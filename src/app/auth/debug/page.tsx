import { cookies } from "next/headers";
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

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-stone-950">Auth debug</h1>
        <p className="mt-4 rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-700">
          No authenticated user.
        </p>
      </main>
    );
  }

  const { data: businessUser } = await supabase
    .from("business_users")
    .select("business_id, role, businesses(id, name, slug)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle<BusinessUserDebugRow>();

  const business = Array.isArray(businessUser?.businesses)
    ? businessUser?.businesses[0]
    : businessUser?.businesses;

  const rows = [
    ["User email", user.email ?? "No email"],
    ["User id", user.id],
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
      </dl>
    </main>
  );
}
