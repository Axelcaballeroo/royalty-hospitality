"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentBusiness } from "@/lib/current-business";
import { generateLoyaltyCode } from "@/lib/loyalty-code";
import { createClient } from "@/lib/supabase/server";

type CheckInInput = {
  reservationId: string;
  customerId?: string;
  customerName: string;
  phone?: string;
  tableName: string;
  waiterName: string;
};

async function createCustomerCode(businessId: string, slug: string) {
  const supabase = await createClient();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateLoyaltyCode(slug);
    const { data } = await supabase.from("customers").select("id").eq("business_id", businessId).eq("loyalty_code", code).maybeSingle();
    if (!data) return code;
  }
  return `${generateLoyaltyCode(slug)}-${Date.now().toString().slice(-4)}`;
}

export async function prepareReservationPosCheckIn(input: CheckInInput) {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("id, customer_id, status")
    .eq("business_id", current.businessId)
    .eq("id", input.reservationId)
    .maybeSingle<{ id: string; customer_id: string | null; status: string }>();
  if (error || !reservation) throw new Error(error?.message ?? "Reserva no encontrada");
  if (["cancelled", "no_show", "completed"].includes(reservation.status)) throw new Error("La reserva ya no puede abrir una cuenta.");

  let customerId = input.customerId || reservation.customer_id || "";
  if (!customerId && input.phone) {
    const { data: existing } = await supabase.from("customers").select("id").eq("business_id", current.businessId).eq("phone", input.phone).maybeSingle<{ id: string }>();
    customerId = existing?.id ?? "";
  }
  if (!customerId) {
    const { data: customer, error: customerError } = await supabase.from("customers").insert({
      business_id: current.businessId,
      full_name: input.customerName,
      phone: input.phone || null,
      loyalty_code: await createCustomerCode(current.businessId, current.business.slug),
      loyalty_enabled: true,
      status: "active",
    }).select("id").single<{ id: string }>();
    if (customerError || !customer) throw new Error(customerError?.message ?? "No se pudo crear el cliente");
    customerId = customer.id;
  }

  await supabase.from("reservations").update({
    customer_id: customerId,
    status: "confirmed",
    updated_at: new Date().toISOString(),
  }).eq("business_id", current.businessId).eq("id", input.reservationId);

  await supabase.from("internal_notes").insert({
    business_id: current.businessId,
    customer_id: customerId,
    reservation_id: input.reservationId,
    title: "Check-in y cuenta POS",
    content: `Reserva marcada como llegó. Cuenta POS abierta desde reserva. Mesa asignada: ${input.tableName}. Mesero asignado: ${input.waiterName}.`,
    created_by: current.userId,
  });

  revalidatePath("/app/reservas");
  revalidatePath(`/app/clientes/${customerId}`);
  return { customerId };
}

export async function completeReservationPosSale(input: {
  reservationId: string;
  saleId: string;
  total: number;
  paymentMethod: string;
  closedAt: string;
}) {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const { data: reservation, error } = await supabase.from("reservations")
    .select("customer_id, status")
    .eq("business_id", current.businessId)
    .eq("id", input.reservationId)
    .maybeSingle<{ customer_id: string; status: string }>();
  if (error || !reservation) throw new Error(error?.message ?? "Reserva no encontrada");
  if (reservation.status === "completed") return;

  await supabase.from("reservations").update({ status: "completed", updated_at: input.closedAt }).eq("business_id", current.businessId).eq("id", input.reservationId);
  const { data: customer } = await supabase.from("customers").select("total_visits, total_spent").eq("business_id", current.businessId).eq("id", reservation.customer_id).maybeSingle<{ total_visits: number; total_spent: number }>();
  await supabase.from("customers").update({
    total_visits: (customer?.total_visits ?? 0) + 1,
    total_spent: Number(customer?.total_spent ?? 0) + input.total,
    last_visit_at: input.closedAt,
    updated_at: input.closedAt,
  }).eq("business_id", current.businessId).eq("id", reservation.customer_id);

  await Promise.all([
    supabase.from("customer_events").insert({
      business_id: current.businessId,
      customer_id: reservation.customer_id,
      reservation_id: input.reservationId,
      type: "visit_completed",
      title: "Visita y consumo POS",
      description: `Consumo ${input.total} · ${input.paymentMethod}`,
      metadata: { sale_id: input.saleId, total: input.total, payment_method: input.paymentMethod, closed_at: input.closedAt },
      created_by: current.userId,
    }),
    supabase.from("internal_notes").insert({
      business_id: current.businessId,
      customer_id: reservation.customer_id,
      reservation_id: input.reservationId,
      title: "Cuenta POS cerrada",
      content: `Venta ${input.saleId}. Total ${input.total}. Pago ${input.paymentMethod}.`,
      created_by: current.userId,
    }),
  ]);

  revalidatePath("/app/reservas");
  revalidatePath(`/app/clientes/${reservation.customer_id}`);
}
