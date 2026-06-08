"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateLoyaltyCode } from "@/lib/loyalty-code";

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

async function ensureAdminLoyaltyAccount(input: {
  businessId: string;
  customerId: string;
}) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("loyalty_accounts")
    .select("id, points_balance, tier")
    .eq("business_id", input.businessId)
    .eq("customer_id", input.customerId)
    .maybeSingle<{ id: string; points_balance: number; tier: string }>();

  if (existing) {
    return existing;
  }

  const { data, error } = await admin
    .from("loyalty_accounts")
    .insert({
      business_id: input.businessId,
      customer_id: input.customerId,
      points_balance: 0,
      tier: "bronze",
    })
    .select("id, points_balance, tier")
    .single<{ id: string; points_balance: number; tier: string }>();

  if (error || !data) {
    throw new Error(error?.message ?? "loyalty_account_failed");
  }

  return data;
}

export async function registerClubMemberAction(formData: FormData) {
  const businessSlug = requiredString(formData, "business_slug");
  const fullName = requiredString(formData, "full_name");
  const phone = requiredString(formData, "phone");
  const email = requiredString(formData, "email");
  const birthday = requiredString(formData, "birthday");

  if (!businessSlug || !fullName || !phone) {
    redirect(`/club/${businessSlug || "missing"}?error=club_validation`);
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, slug")
    .eq("slug", businessSlug)
    .eq("status", "active")
    .maybeSingle<{ id: string; slug: string }>();

  if (!business) {
    redirect(`/club/${businessSlug}?error=business_not_found`);
  }

  const { data: existing } = await admin
    .from("customers")
    .select("id, full_name, loyalty_code")
    .eq("business_id", business.id)
    .eq("phone", phone)
    .maybeSingle<{ id: string; full_name: string; loyalty_code: string | null }>();

  if (existing) {
    let code = existing.loyalty_code;

    if (!code) {
      code = await createUniqueLoyaltyCode({
        businessId: business.id,
        prefixSource: business.slug,
      });
      await admin
        .from("customers")
        .update({ loyalty_code: code, loyalty_enabled: true })
        .eq("business_id", business.id)
        .eq("id", existing.id);
    }

    await ensureAdminLoyaltyAccount({
      businessId: business.id,
      customerId: existing.id,
    });

    redirect(`/club/${businessSlug}/cuenta?phone=${encodeURIComponent(phone)}&code=${encodeURIComponent(code)}&existing=1`);
  }

  const loyaltyCode = await createUniqueLoyaltyCode({
    businessId: business.id,
    prefixSource: business.slug,
  });

  const { data: customer, error: customerError } = await admin
    .from("customers")
    .insert({
      business_id: business.id,
      full_name: fullName,
      phone,
      email: email || null,
      birthday: birthday || null,
      loyalty_code: loyaltyCode,
      loyalty_enabled: true,
      status: "active",
    })
    .select("id")
    .single<{ id: string }>();

  if (customerError || !customer) {
    redirect(`/club/${businessSlug}?error=${encodeURIComponent(customerError?.message ?? "customer_failed")}`);
  }

  await ensureAdminLoyaltyAccount({
    businessId: business.id,
    customerId: customer.id,
  });

  await admin.from("customer_events").insert({
    business_id: business.id,
    customer_id: customer.id,
    type: "customer_created",
    title: "Registro en Club",
    description: "Cliente registrado en programa de fidelizacion",
  });

  redirect(`/club/${businessSlug}/cuenta?phone=${encodeURIComponent(phone)}&code=${encodeURIComponent(loyaltyCode)}&registered=1`);
}

export async function clubAccountLoginAction(formData: FormData) {
  const businessSlug = requiredString(formData, "business_slug");
  const phone = requiredString(formData, "phone");
  const code = requiredString(formData, "code").toUpperCase();

  if (!businessSlug || !phone || !code) {
    redirect(`/club/${businessSlug}/login?error=account_validation`);
  }

  redirect(`/club/${businessSlug}/cuenta?phone=${encodeURIComponent(phone)}&code=${encodeURIComponent(code)}`);
}
