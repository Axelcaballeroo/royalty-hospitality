type SupabaseBrowserEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

type SupabaseAdminEnv = SupabaseBrowserEnv & {
  serviceRoleKey: string;
};

export function getSupabaseBrowserEnv(): SupabaseBrowserEnv {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const missing: string[] = [];

  if (!supabaseUrl) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseAnonKey) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(`Missing Supabase auth environment variables: ${missing.join(", ")}.`);
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function getSupabaseAdminEnv(): SupabaseAdminEnv {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseBrowserEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variable: SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { supabaseUrl, supabaseAnonKey, serviceRoleKey };
}

export function getSuperadminEmailsEnv() {
  const rawEmails = process.env.SUPERADMIN_EMAILS;

  if (!rawEmails?.trim() && process.env.NODE_ENV !== "development") {
    throw new Error("Missing superadmin environment variable: SUPERADMIN_EMAILS.");
  }

  return (rawEmails ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
