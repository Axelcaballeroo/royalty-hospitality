import { createClient } from "@/lib/supabase/server";

export const loyaltyTiers = [
  { key: "bronze", min: 0 },
  { key: "silver", min: 500 },
  { key: "gold", min: 1500 },
  { key: "black", min: 3000 },
] as const;

export function getLoyaltyTier(points: number) {
  return [...loyaltyTiers]
    .reverse()
    .find((tier) => points >= tier.min)?.key ?? "bronze";
}

export async function ensureLoyaltyAccount(input: {
  businessId: string;
  customerId: string;
}) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("loyalty_accounts")
    .select("id, points_balance, tier")
    .eq("business_id", input.businessId)
    .eq("customer_id", input.customerId)
    .maybeSingle<{ id: string; points_balance: number; tier: string }>();

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
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

export async function applyLoyaltyPoints(input: {
  businessId: string;
  customerId: string;
  pointsDelta: number;
  type: "earn" | "redeem" | "adjustment" | "expired";
  description: string;
  createdBy?: string | null;
}) {
  const supabase = await createClient();
  const account = await ensureLoyaltyAccount({
    businessId: input.businessId,
    customerId: input.customerId,
  });
  const nextBalance = Math.max(0, account.points_balance + input.pointsDelta);
  const nextTier = getLoyaltyTier(nextBalance);

  const { error: accountError } = await supabase
    .from("loyalty_accounts")
    .update({
      points_balance: nextBalance,
      tier: nextTier,
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", input.businessId)
    .eq("customer_id", input.customerId);

  if (accountError) {
    throw new Error(accountError.message);
  }

  const { error: transactionError } = await supabase
    .from("loyalty_transactions")
    .insert({
      business_id: input.businessId,
      customer_id: input.customerId,
      type: input.type,
      points: input.pointsDelta,
      description: input.description,
      created_by: input.createdBy ?? null,
    });

  if (transactionError) {
    throw new Error(transactionError.message);
  }

  return {
    pointsBalance: nextBalance,
    tier: nextTier,
  };
}
