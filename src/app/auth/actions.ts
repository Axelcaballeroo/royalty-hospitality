"use server";

import { redirect } from "next/navigation";
import { ensureDevEmail, isValidEmail, normalizeEmail } from "@/lib/auth-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const authErrorMessage =
  "No se pudo crear la cuenta. Revisa el email o intenta con otro.";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

export async function loginAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/app/dashboard");

  if (!email || !password || !isValidEmail(email)) {
    redirect("/login?error=missing_fields");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(next.startsWith("/app") ? next : "/app/dashboard");
}

export async function registerAction(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = ensureDevEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const businessName = String(formData.get("businessName") ?? "").trim();
  const businessType = String(formData.get("businessType") ?? "").trim();

  if (!fullName || !email || !password || !businessName || !businessType) {
    redirect("/register?error=missing_fields");
  }

  if (!isValidEmail(email)) {
    redirect("/register?error=email_invalido");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        business_name: businessName,
      },
    },
  });

  if (error || !data.user) {
    redirect(`/register?error=${encodeURIComponent(authErrorMessage)}`);
  }

  const admin = createAdminClient();
  const baseSlug = slugify(businessName) || "business";
  const slug = `${baseSlug}-${data.user.id.slice(0, 8)}`;

  const { data: business, error: businessError } = await admin
    .from("businesses")
    .insert({
      name: businessName,
      slug,
      type: businessType,
      email,
    })
    .select("id")
    .single<{ id: string }>();

  if (businessError || !business) {
    redirect(`/register?error=${encodeURIComponent(businessError?.message ?? "business_failed")}`);
  }

  const { error: userError } = await admin.from("business_users").insert({
    business_id: business.id,
    user_id: data.user.id,
    role: "owner",
    status: "active",
  });

  if (userError) {
    redirect(`/register?error=${encodeURIComponent(userError.message)}`);
  }

  const moduleRows = ["reservations", "crm", "reports"].map((module_key) => ({
    business_id: business.id,
    module_key,
    enabled: true,
  }));

  const { error: modulesError } = await admin
    .from("business_modules")
    .insert(moduleRows);

  if (modulesError) {
    redirect(`/register?error=${encodeURIComponent(modulesError.message)}`);
  }

  redirect("/app/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
