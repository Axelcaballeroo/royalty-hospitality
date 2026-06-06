"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

function requiredString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createPublicReservationAction(formData: FormData) {
  const businessSlug = requiredString(formData, "business_slug");
  const fullName = requiredString(formData, "full_name");
  const phone = requiredString(formData, "phone");
  const email = requiredString(formData, "email");
  const date = requiredString(formData, "date");
  const time = requiredString(formData, "time");
  const partySize = Number(requiredString(formData, "party_size"));
  const specialRequest = requiredString(formData, "special_request");

  if (!businessSlug) {
    redirect("/site/not-found/reservas?error=business_missing");
  }

  if (!fullName || !phone || !date || !time || !partySize || partySize <= 0) {
    redirect(`/site/${businessSlug}/reservas?error=reservation_validation`);
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, slug, reservation_enabled")
    .eq("slug", businessSlug)
    .eq("status", "active")
    .maybeSingle<{ id: string; slug: string; reservation_enabled: boolean }>();

  if (!business || !business.reservation_enabled) {
    redirect(`/site/${businessSlug}/reservas?error=reservations_unavailable`);
  }

  let customerId: string | null = null;

  const { data: customerByPhone } = await admin
    .from("customers")
    .select("id, email, full_name")
    .eq("business_id", business.id)
    .eq("phone", phone)
    .maybeSingle<{ id: string; email: string | null; full_name: string }>();

  if (customerByPhone) {
    customerId = customerByPhone.id;
  } else if (email) {
    const { data: customerByEmail } = await admin
      .from("customers")
      .select("id, phone, full_name")
      .eq("business_id", business.id)
      .eq("email", email)
      .maybeSingle<{ id: string; phone: string | null; full_name: string }>();

    customerId = customerByEmail?.id ?? null;
  }

  if (customerId) {
    const { error: customerUpdateError } = await admin
      .from("customers")
      .update({
        full_name: fullName,
        phone,
        email: email || null,
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", business.id)
      .eq("id", customerId);

    if (customerUpdateError) {
      redirect(`/site/${businessSlug}/reservas?error=${encodeURIComponent(customerUpdateError.message)}`);
    }
  } else {
    const { data: customer, error: customerError } = await admin
      .from("customers")
      .insert({
        business_id: business.id,
        full_name: fullName,
        phone,
        email: email || null,
        status: "active",
      })
      .select("id")
      .single<{ id: string }>();

    if (customerError || !customer) {
      redirect(`/site/${businessSlug}/reservas?error=${encodeURIComponent(customerError?.message ?? "customer_failed")}`);
    }

    customerId = customer.id;
  }

  const { data: reservation, error: reservationError } = await admin
    .from("reservations")
    .insert({
      business_id: business.id,
      customer_id: customerId,
      date,
      time,
      party_size: partySize,
      status: "pending",
      source: "web",
      notes: null,
      special_request: specialRequest || null,
    })
    .select("id")
    .single<{ id: string }>();

  if (reservationError || !reservation) {
    redirect(`/site/${businessSlug}/reservas?error=${encodeURIComponent(reservationError?.message ?? "reservation_failed")}`);
  }

  await admin.from("customer_events").insert({
    business_id: business.id,
    customer_id: customerId,
    reservation_id: reservation.id,
    type: "reservation_created",
    title: "Reserva creada",
    description: `Reserva para ${partySize} personas el ${date} a las ${time}`,
  });

  await admin.from("internal_tasks").insert({
    business_id: business.id,
    customer_id: customerId,
    reservation_id: reservation.id,
    title: "Confirmar reserva publica",
    description: `Contactar a ${fullName} para confirmar la reserva publica.`,
    priority: "medium",
    status: "pending",
    due_date: `${date}T${time}:00`,
  });

  redirect(`/site/${businessSlug}/reservas?success=1`);
}
