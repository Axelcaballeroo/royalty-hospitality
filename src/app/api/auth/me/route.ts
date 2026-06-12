import { NextResponse } from "next/server";
import { getDemoAuthCookieUser } from "@/lib/demo-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type BusinessUserMeRow = {
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

export async function GET() {
  const user = await getDemoAuthCookieUser();

  if (!user) {
    return NextResponse.json(
      {
        authenticated: false,
        user_id: null,
        email: null,
        business: null,
        role: null,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const admin = createAdminClient();
  const { data: businessUser } = await admin
    .from("business_users")
    .select("business_id, role, businesses(id, name, slug)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle<BusinessUserMeRow>();

  const business = Array.isArray(businessUser?.businesses)
    ? businessUser?.businesses[0]
    : businessUser?.businesses;

  return NextResponse.json(
    {
      authenticated: true,
      user_id: user.id,
      email: user.email,
      business: business
        ? {
            id: business.id,
            name: business.name,
            slug: business.slug,
          }
        : null,
      role: businessUser?.role ?? null,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
