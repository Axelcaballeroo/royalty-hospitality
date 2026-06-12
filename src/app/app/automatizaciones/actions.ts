"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ensureDefaultAutomationRules,
  runAutomationRule,
  type AutomationRuleRecord,
} from "@/lib/automation";
import { requireCurrentBusiness } from "@/lib/current-business";
import { createClient } from "@/lib/supabase/server";

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function ensureAutomationDefaultsAction() {
  const current = await requireCurrentBusiness();

  try {
    await ensureDefaultAutomationRules(current.businessId);
  } catch (error) {
    redirect(
      `/app/automatizaciones?error=${encodeURIComponent(
        error instanceof Error ? error.message : "automation_defaults_failed",
      )}`,
    );
  }

  revalidatePath("/app/automatizaciones");
  redirect("/app/automatizaciones?success=defaults_ready");
}

export async function toggleAutomationRuleAction(formData: FormData) {
  const ruleId = requiredString(formData, "rule_id");
  const enabled = requiredString(formData, "enabled") === "true";
  const current = await requireCurrentBusiness();
  const supabase = await createClient();

  if (!ruleId) {
    redirect("/app/automatizaciones?error=rule_required");
  }

  const { error } = await supabase
    .from("automation_rules")
    .update({
      enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", current.businessId)
    .eq("id", ruleId);

  if (error) {
    redirect(`/app/automatizaciones?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/app/automatizaciones");
  redirect("/app/automatizaciones?success=rule_updated");
}

export async function runAutomationRuleAction(formData: FormData) {
  const ruleId = requiredString(formData, "rule_id");
  const current = await requireCurrentBusiness();
  const supabase = await createClient();

  if (!ruleId) {
    redirect("/app/automatizaciones?error=rule_required");
  }

  const { data: rule, error } = await supabase
    .from("automation_rules")
    .select("id, business_id, name, trigger_type, action_type, enabled, config")
    .eq("business_id", current.businessId)
    .eq("id", ruleId)
    .single<AutomationRuleRecord>();

  if (error || !rule) {
    redirect(`/app/automatizaciones?error=${encodeURIComponent(error?.message ?? "rule_not_found")}`);
  }

  const result = await runAutomationRule({
    rule,
    userId: current.userId,
  });

  revalidatePath("/app/automatizaciones");
  revalidatePath("/app/dashboard");
  redirect(
    `/app/automatizaciones?${
      result.status === "failed" ? "error" : "success"
    }=${encodeURIComponent(result.message)}`,
  );
}
