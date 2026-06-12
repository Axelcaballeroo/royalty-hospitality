import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSuperadminEmailsEnv } from "@/lib/supabase/env";
import { moduleCatalog, normalizePlan, planModules, type PlanKey } from "@/lib/plans";

export async function isSuperadmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const superadminEmails = getSuperadminEmailsEnv();
  const userEmail = user.email?.trim().toLowerCase();

  if (userEmail && superadminEmails.includes(userEmail)) {
    return true;
  }

  const { data } = await supabase
    .from("business_users")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "superadmin")
    .eq("status", "active")
    .limit(1)
    .maybeSingle<{ id: string }>();

  return Boolean(data);
}

export async function requireSuperadmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const allowed = await isSuperadmin();
  if (!allowed) {
    if (process.env.NODE_ENV === "development") {
      const { data: roles } = await supabase
        .from("business_users")
        .select("business_id, role, status")
        .eq("user_id", user.id);

      console.error("SUPERADMIN ACCESS DENIED:", {
        userId: user.id,
        email: user.email ?? null,
        roles: roles ?? [],
        superadminEmailsConfigured: Boolean(process.env.SUPERADMIN_EMAILS?.trim()),
      });
    }

    redirect("/app/dashboard?error=forbidden");
  }

  return { userId: user.id };
}

export async function syncBusinessModulesForPlan(input: {
  businessId: string;
  plan: string;
}) {
  const admin = createAdminClient();
  const plan = normalizePlan(input.plan);
  const included = new Set(planModules[plan]);
  const allModuleKeys = Object.keys(moduleCatalog);

  await admin.from("modules").upsert(
    allModuleKeys.map((key) => ({
      key,
      name: moduleCatalog[key].name,
      description: moduleCatalog[key].description,
    })),
    { onConflict: "key" },
  );

  await admin.from("business_modules").upsert(
    allModuleKeys.map((moduleKey) => ({
      business_id: input.businessId,
      module_key: moduleKey,
      enabled: included.has(moduleKey),
    })),
    { onConflict: "business_id,module_key" },
  );

  return plan;
}

export function getPlanCounts<T extends { plan: string }>(businesses: T[]) {
  const counts: Record<PlanKey, number> = {
    basic: 0,
    pro: 0,
    premium: 0,
    business: 0,
  };

  for (const business of businesses) {
    counts[normalizePlan(business.plan)] += 1;
  }

  return counts;
}
