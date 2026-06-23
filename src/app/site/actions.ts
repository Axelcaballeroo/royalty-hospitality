"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateLoyaltyCode } from "@/lib/loyalty-code";
import { buildReservationSlots, type BusinessHour, type Reservation, type RestaurantTable } from "@/lib/data";

function requiredString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function createUniqueLoyaltyCode(input: {
  businessId: string;
  prefixSource: string;
}) {
  const admin = createAdminClient();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateLoyaltyCode(input.prefixSource);
    const { data } = await admin
      .from("customers")
      .select("id")
      .eq("business_id", input.businessId)
      .eq("loyalty_code", code)
      .maybeSingle<{ id: string }>();

    if (!data) {
      return code;
    }
  }

  return `${generateLoyaltyCode(input.prefixSource)}-${Date.now().toString().slice(-4)}`;
}

export async function createPublicReservationAction(formData: FormData) {
  const businessSlug = requiredString(formData, "business_slug");
  const returnTo = requiredString(formData, "return_to");
  const fullName = requiredString(formData, "full_name");
  const phone = requiredString(formData, "phone");
  const email = requiredString(formData, "email");
  const date = requiredString(formData, "date");
  const time = requiredString(formData, "time");
  const partySize = Number(requiredString(formData, "party_size"));
  const specialRequest = requiredString(formData, "special_request");
  const targetPath = returnTo || (businessSlug ? `/site/${businessSlug}/reservas` : "/reservar");
  const separator = targetPath.includes("?") ? "&" : "?";

  if (!businessSlug) {
    redirect(`${targetPath}${separator}error=business_missing`);
  }

  if (!fullName || !phone || !date || !time || !partySize || partySize <= 0) {
    redirect(`${targetPath}${separator}error=reservation_validation`);
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, slug, reservation_enabled")
    .eq("slug", businessSlug)
    .eq("status", "active")
    .maybeSingle<{ id: string; slug: string; reservation_enabled: boolean }>();

  if (!business || !business.reservation_enabled) {
    redirect(`${targetPath}${separator}error=reservations_unavailable`);
  }

  const [sameDayReservations, tables, hours, settings] = await Promise.all([
    admin
      .from("reservations")
      .select("id, date, time, party_size, status, source, notes, special_request, customer_id, customers(full_name, phone)")
      .eq("business_id", business.id)
      .eq("date", date),
    admin
      .from("tables")
      .select("id, name, area, capacity, is_active")
      .eq("business_id", business.id),
    admin
      .from("business_hours")
      .select("day_of_week, opens_at, closes_at, is_closed")
      .eq("business_id", business.id),
    admin
      .from("business_settings")
      .select("reservation_interval_minutes")
      .eq("business_id", business.id)
      .maybeSingle<{ reservation_interval_minutes: number }>(),
  ]);
  const availableSlot = buildReservationSlots({
    date,
    hours: (hours.data ?? []) as BusinessHour[],
    intervalMinutes: settings.data?.reservation_interval_minutes,
    reservations: (sameDayReservations.data ?? []) as unknown as Reservation[],
    tables: (tables.data ?? []) as RestaurantTable[],
    partySize,
  }).find((slot) => slot.time === time && slot.available);

  if (!availableSlot) {
    redirect(`${targetPath}${separator}error=reservation_unavailable`);
  }

  let customerId: string | null = null;
  let loyaltyCode: string | null = null;

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
      redirect(`${targetPath}${separator}error=${encodeURIComponent(customerUpdateError.message)}`);
    }

    const { data: updatedCustomer } = await admin
      .from("customers")
      .select("loyalty_code")
      .eq("business_id", business.id)
      .eq("id", customerId)
      .maybeSingle<{ loyalty_code: string | null }>();

    if (!updatedCustomer?.loyalty_code) {
      loyaltyCode = await createUniqueLoyaltyCode({
        businessId: business.id,
        prefixSource: businessSlug,
      });
      await admin
        .from("customers")
        .update({
          loyalty_code: loyaltyCode,
          loyalty_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq("business_id", business.id)
        .eq("id", customerId);
    } else {
      loyaltyCode = updatedCustomer.loyalty_code;
    }
  } else {
    loyaltyCode = await createUniqueLoyaltyCode({
      businessId: business.id,
      prefixSource: businessSlug,
    });
    const { data: customer, error: customerError } = await admin
      .from("customers")
      .insert({
        business_id: business.id,
        full_name: fullName,
        phone,
        email: email || null,
        loyalty_code: loyaltyCode,
        loyalty_enabled: true,
        status: "active",
      })
      .select("id")
      .single<{ id: string }>();

    if (customerError || !customer) {
      redirect(`${targetPath}${separator}error=${encodeURIComponent(customerError?.message ?? "customer_failed")}`);
    }

    customerId = customer.id;
  }

  const { error: loyaltyError } = await admin.from("loyalty_accounts").upsert(
    {
      business_id: business.id,
      customer_id: customerId,
      points_balance: 0,
      tier: "bronze",
    },
    { onConflict: "business_id,customer_id", ignoreDuplicates: true },
  );

  if (loyaltyError) {
    redirect(`${targetPath}${separator}error=${encodeURIComponent(loyaltyError.message)}`);
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
    redirect(`${targetPath}${separator}error=${encodeURIComponent(reservationError?.message ?? "reservation_failed")}`);
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

  redirect(`${targetPath}${separator}success=1&phone=${encodeURIComponent(phone)}&code=${encodeURIComponent(loyaltyCode ?? "")}`);
}
