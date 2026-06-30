"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentBusiness } from "@/lib/current-business";
import { createClient } from "@/lib/supabase/server";
import type { CurrencyCode, PaymentMethod } from "@/lib/pos-shared";

export type PosCustomerSaleInput = {
  saleId: string;
  folio: string;
  customerId?: string;
  reservationId?: string;
  tableName: string;
  orderType: string;
  isQuickSale: boolean;
  gross: number;
  discount: number;
  courtesy: number;
  total: number;
  paymentMethod: PaymentMethod;
  waiterName?: string;
  cashRegister?: string;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
  payments: Array<{
    method: Exclude<PaymentMethod, "Mixto">;
    amount: number;
    currency?: CurrencyCode;
    foreignAmount?: number;
    exchangeRate?: number;
    equivalentMxn?: number;
  }>;
  amountReceived?: number;
  change?: number;
  closedAt: string;
};

function safeAmount(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export async function recordPosCustomerSale(input: PosCustomerSaleInput) {
  if (!input.customerId) return { recorded: false, anonymous: true };

  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const row = {
    business_id: current.businessId,
    sale_id: input.saleId,
    folio: input.folio,
    customer_id: input.customerId,
    reservation_id: input.reservationId || null,
    table_name: input.tableName,
    order_type: input.orderType,
    is_quick_sale: input.isQuickSale,
    gross: safeAmount(input.gross),
    discount: safeAmount(input.discount),
    courtesy: safeAmount(input.courtesy),
    total: safeAmount(input.total),
    payment_method: input.paymentMethod,
    waiter_name: input.waiterName || null,
    cash_register: input.cashRegister || null,
    items: input.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: Math.max(0, Math.floor(item.quantity)),
      price: safeAmount(item.price),
    })),
    payments: input.payments.map((payment) => ({
      ...payment,
      amount: safeAmount(payment.amount),
    })),
    amount_received: input.amountReceived === undefined ? null : safeAmount(input.amountReceived),
    change_amount: input.change === undefined ? null : safeAmount(input.change),
    closed_at: input.closedAt,
    created_by: current.userId,
  };

  const { error } = await supabase
    .from("pos_customer_sales")
    .upsert(row, { onConflict: "business_id,sale_id", ignoreDuplicates: true });

  if (error) throw new Error(error.message);

  revalidatePath(`/app/clientes/${input.customerId}`);
  if (input.reservationId) revalidatePath("/app/reservas");
  return { recorded: true, anonymous: false };
}

export async function recordCustomerTicketReprint(input: {
  saleId: string;
  customerId: string;
  authorizedBy: string;
  authorizedRole: string;
}) {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const { data: sale, error: saleError } = await supabase
    .from("pos_customer_sales")
    .select("id, reservation_id, folio")
    .eq("business_id", current.businessId)
    .eq("customer_id", input.customerId)
    .eq("sale_id", input.saleId)
    .maybeSingle<{ id: string; reservation_id: string | null; folio: string }>();

  if (saleError || !sale) throw new Error(saleError?.message ?? "Consumo no encontrado");

  const { error } = await supabase.from("customer_events").insert({
    business_id: current.businessId,
    customer_id: input.customerId,
    reservation_id: sale.reservation_id,
    type: "visit_completed",
    title: "Ticket reimpreso",
    description: `Ticket ${sale.folio} reimpreso · autorizó ${input.authorizedBy}`,
    metadata: {
      source: "pos",
      sale_id: input.saleId,
      folio: sale.folio,
      authorized_by: input.authorizedBy,
      authorized_role: input.authorizedRole,
    },
    created_by: current.userId,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/app/clientes/${input.customerId}`);
}
