import { createClient } from "@/lib/supabase/server";

export const walletStatuses = ["active", "frozen", "closed"];
export const walletTransactionTypes = ["topup", "bonus", "purchase", "refund", "adjustment"];

export function formatCurrency(amount: number, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    currency,
    style: "currency",
  }).format(amount);
}

export async function ensureWalletAccount(input: {
  businessId: string;
  customerId: string;
}) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("wallet_accounts")
    .select("id, balance, currency, status")
    .eq("business_id", input.businessId)
    .eq("customer_id", input.customerId)
    .maybeSingle<{ id: string; balance: number; currency: string; status: string }>();

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("wallet_accounts")
    .insert({
      business_id: input.businessId,
      customer_id: input.customerId,
      balance: 0,
      currency: "MXN",
      status: "active",
    })
    .select("id, balance, currency, status")
    .single<{ id: string; balance: number; currency: string; status: string }>();

  if (error || !data) {
    throw new Error(error?.message ?? "wallet_account_failed");
  }

  return data;
}

export async function applyWalletTransaction(input: {
  businessId: string;
  customerId: string;
  type: "topup" | "bonus" | "purchase" | "refund" | "adjustment";
  amount: number;
  description?: string | null;
  reference?: string | null;
  createdBy?: string | null;
}) {
  const supabase = await createClient();
  const account = await ensureWalletAccount({
    businessId: input.businessId,
    customerId: input.customerId,
  });

  if (account.status !== "active") {
    throw new Error("wallet_not_active");
  }

  const signedAmount =
    input.type === "purchase" ? -Math.abs(input.amount) : input.amount;
  const nextBalance = Number(account.balance) + signedAmount;

  if (nextBalance < 0) {
    throw new Error("insufficient_wallet_balance");
  }

  const { error: accountError } = await supabase
    .from("wallet_accounts")
    .update({
      balance: nextBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", input.businessId)
    .eq("customer_id", input.customerId);

  if (accountError) {
    throw new Error(accountError.message);
  }

  const { error: transactionError } = await supabase
    .from("wallet_transactions")
    .insert({
      business_id: input.businessId,
      customer_id: input.customerId,
      type: input.type,
      amount: signedAmount,
      description: input.description ?? null,
      reference: input.reference ?? null,
      created_by: input.createdBy ?? null,
    });

  if (transactionError) {
    throw new Error(transactionError.message);
  }

  return {
    balance: nextBalance,
    currency: account.currency,
  };
}
