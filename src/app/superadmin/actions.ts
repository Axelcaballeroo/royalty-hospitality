"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePlan, planModules, type PlanKey } from "@/lib/plans";
import { requireSuperadmin, syncBusinessModulesForPlan } from "@/lib/superadmin";

function requiredString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function audit(input: {
  adminUserId: string;
  businessId?: string | null;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  await admin.from("admin_audit_logs").insert({
    admin_user_id: input.adminUserId,
    business_id: input.businessId ?? null,
    action: input.action,
    description: input.description,
    metadata: input.metadata ?? {},
  });
}

export async function superadminUpdateBusinessPlanAction(formData: FormData) {
  const { userId } = await requireSuperadmin();
  const admin = createAdminClient();
  const businessId = requiredString(formData, "business_id");
  const plan = normalizePlan(requiredString(formData, "plan"));

  const { error } = await admin
    .from("businesses")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", businessId);

  if (error) {
    redirect(`/superadmin/businesses/${businessId}?error=${encodeURIComponent(error.message)}`);
  }

  await syncBusinessModulesForPlan({ businessId, plan });
  await audit({
    adminUserId: userId,
    businessId,
    action: "business_plan_updated",
    description: `Plan cambiado a ${plan}`,
    metadata: { plan, modules: planModules[plan as PlanKey] },
  });

  revalidatePath("/superadmin");
  revalidatePath("/superadmin/businesses");
  revalidatePath(`/superadmin/businesses/${businessId}`);
  redirect(`/superadmin/businesses/${businessId}?success=plan_updated`);
}

export async function superadminUpdateBusinessStatusAction(formData: FormData) {
  const { userId } = await requireSuperadmin();
  const admin = createAdminClient();
  const businessId = requiredString(formData, "business_id");
  const status = requiredString(formData, "status") || "active";

  const { error } = await admin
    .from("businesses")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", businessId);

  if (error) {
    redirect(`/superadmin/businesses/${businessId}?error=${encodeURIComponent(error.message)}`);
  }

  await audit({
    adminUserId: userId,
    businessId,
    action: "business_status_updated",
    description: `Estado cambiado a ${status}`,
    metadata: { status },
  });

  revalidatePath("/superadmin/businesses");
  revalidatePath(`/superadmin/businesses/${businessId}`);
  redirect(`/superadmin/businesses/${businessId}?success=status_updated`);
}

export async function superadminToggleBusinessModuleAction(formData: FormData) {
  const { userId } = await requireSuperadmin();
  const admin = createAdminClient();
  const businessId = requiredString(formData, "business_id");
  const moduleKey = requiredString(formData, "module_key");
  const enabled = formData.get("enabled") === "on";

  const { error } = await admin
    .from("business_modules")
    .upsert(
      {
        business_id: businessId,
        module_key: moduleKey,
        enabled,
      },
      { onConflict: "business_id,module_key" },
    );

  if (error) {
    redirect(`/superadmin/businesses/${businessId}?error=${encodeURIComponent(error.message)}`);
  }

  await audit({
    adminUserId: userId,
    businessId,
    action: "business_module_toggled",
    description: `${moduleKey} ${enabled ? "activado" : "desactivado"}`,
    metadata: { moduleKey, enabled },
  });

  revalidatePath(`/superadmin/businesses/${businessId}`);
  redirect(`/superadmin/businesses/${businessId}?success=module_updated`);
}
