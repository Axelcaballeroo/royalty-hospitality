"use server";

import { redirect } from "next/navigation";
import { ensureDevEmail, isValidEmail, normalizeEmail } from "@/lib/auth-email";
import { clearDemoAuthCookies, isSafePrivateNextPath, setDemoAuthCookies } from "@/lib/demo-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const authErrorMessage =
  "No se pudo crear la cuenta. Revisa el email o intenta con otro.";
const passwordLengthMessage = "La contraseña debe tener al menos 6 caracteres.";

function registerError(message: string): never {
  redirect(`/register?error=${encodeURIComponent(message)}`);
}

function devErrorMessage(fallback: string, error?: { message?: string } | null) {
  if (process.env.NODE_ENV === "development" && error?.message) {
    return error.message;
  }

  return fallback;
}

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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "Login invalido")}`);
  }

  await setDemoAuthCookies({
    id: data.user.id,
    email: data.user.email ?? email,
  });

  redirect(isSafePrivateNextPath(next) ? next : "/app/dashboard");
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

  if (password.length < 6) {
    registerError(passwordLengthMessage);
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
    console.error("REGISTER ERROR:", error);
    console.error("SIGNUP ERROR:", error);
    registerError(devErrorMessage(authErrorMessage, error));
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
    console.error("REGISTER ERROR:", businessError);
    console.error("BUSINESS INSERT ERROR:", businessError);
    registerError(
      `Usuario creado, pero falló la creación del negocio: ${devErrorMessage(
        "error interno",
        businessError,
      )}`,
    );
  }

  const { error: userError } = await admin.from("business_users").insert({
    business_id: business.id,
    user_id: data.user.id,
    role: "owner",
    status: "active",
  });

  if (userError) {
    console.error("REGISTER ERROR:", userError);
    console.error("BUSINESS USER INSERT ERROR:", userError);
    registerError(devErrorMessage("No se pudo vincular el usuario al negocio.", userError));
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
    console.error("REGISTER ERROR:", modulesError);
    console.error("MODULES INSERT ERROR:", modulesError);
    registerError(devErrorMessage("No se pudieron activar los modulos iniciales.", modulesError));
  }

  redirect("/app/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearDemoAuthCookies();
  redirect("/login");
}
