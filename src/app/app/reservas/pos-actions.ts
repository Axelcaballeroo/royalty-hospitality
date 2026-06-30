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

  await Promise.all([
    supabase.from("internal_notes").insert({
      business_id: current.businessId,
      customer_id: customerId,
      reservation_id: input.reservationId,
      title: "Check-in y cuenta POS",
      content: `Reserva marcada como llegó. Cuenta POS abierta desde reserva. Mesa asignada: ${input.tableName}. Mesero asignado: ${input.waiterName}.`,
      created_by: current.userId,
    }),
    supabase.from("customer_events").insert([
      {
        business_id: current.businessId,
        customer_id: customerId,
        reservation_id: input.reservationId,
        type: "reservation_confirmed",
        title: "Cliente llegó",
        description: `Mesa asignada: ${input.tableName}`,
        metadata: { source: "reservation", table_name: input.tableName },
        created_by: current.userId,
      },
      {
        business_id: current.businessId,
        customer_id: customerId,
        reservation_id: input.reservationId,
        type: "reservation_confirmed",
        title: "Cuenta abierta en POS",
        description: `Mesero: ${input.waiterName}`,
        metadata: { source: "pos", table_name: input.tableName, waiter_name: input.waiterName },
        created_by: current.userId,
      },
    ]),
  ]);

  revalidatePath("/app/reservas");
  revalidatePath(`/app/clientes/${customerId}`);
  return { customerId };
}
