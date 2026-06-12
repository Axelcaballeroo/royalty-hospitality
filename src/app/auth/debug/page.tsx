import { cookies } from "next/headers";
import { AuthDebugClient } from "@/app/auth/debug/auth-debug-client";
import { createClient } from "@/lib/supabase/server";

type BusinessUserDebugRow = {
  business_id: string;
  role: string;
  businesses:
    | {
        id: string;
        name: string;
        slug: string;
      }
    | {
        id: string;
        name: string;
        slug: string;
      }[]
    | null;
};

export default async function AuthDebugPage() {
  const cookieStore = await cookies();
  const supabaseCookiesDetected = cookieStore
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: businessUser } = user
    ? await supabase
        .from("business_users")
        .select("business_id, role, businesses(id, name, slug)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle<BusinessUserDebugRow>()
    : { data: null };

  const business = Array.isArray(businessUser?.businesses)
    ? businessUser?.businesses[0]
    : businessUser?.businesses;

  const rows = [
    ["Server user found", user ? "yes" : "no"],
    ["User email", user?.email ?? "No authenticated user"],
    ["User id", user?.id ?? "No authenticated user"],
    ["Current business found", business ? "yes" : "no"],
    ["Current business", business ? `${business.name} (${business.id})` : "Not found"],
    ["Business slug", business?.slug ?? "Not found"],
    ["Business role", businessUser?.role ?? "Not found"],
    ["Supabase cookies detected", supabaseCookiesDetected ? "yes" : "no"],
  ];

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-stone-950">Auth debug</h1>
      <dl className="mt-6 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
            <dt className="text-sm font-medium text-stone-500">{label}</dt>
            <dd className="break-words text-sm text-stone-950">{value}</dd>
          </div>
        ))}
        <AuthDebugClient />
      </dl>
    </main>
  );
}
