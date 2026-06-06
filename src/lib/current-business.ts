import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentBusiness = {
  userId: string;
  businessId: string;
  role: string;
    business: {
      id: string;
      name: string;
      slug: string;
      type: string | null;
      logo_url?: string | null;
      cover_url?: string | null;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      city?: string | null;
      country?: string | null;
      public_description?: string | null;
      brand_primary_color?: string | null;
      brand_secondary_color?: string | null;
      instagram_url?: string | null;
      facebook_url?: string | null;
      whatsapp_url?: string | null;
      website_enabled?: boolean;
      reservation_enabled?: boolean;
      plan: string;
      status: string;
      timezone: string;
  };
};

type BusinessUserRow = {
  business_id: string;
  role: string;
  businesses:
    | {
        id: string;
        name: string;
        slug: string;
        type: string | null;
        logo_url: string | null;
        cover_url: string | null;
        phone: string | null;
        email: string | null;
        address: string | null;
        city: string | null;
        country: string | null;
        public_description: string | null;
        brand_primary_color: string | null;
        brand_secondary_color: string | null;
        instagram_url: string | null;
        facebook_url: string | null;
        whatsapp_url: string | null;
        website_enabled: boolean;
        reservation_enabled: boolean;
        plan: string;
        status: string;
        timezone: string;
      }
    | {
        id: string;
        name: string;
        slug: string;
        type: string | null;
        logo_url: string | null;
        cover_url: string | null;
        phone: string | null;
        email: string | null;
        address: string | null;
        city: string | null;
        country: string | null;
        public_description: string | null;
        brand_primary_color: string | null;
        brand_secondary_color: string | null;
        instagram_url: string | null;
        facebook_url: string | null;
        whatsapp_url: string | null;
        website_enabled: boolean;
        reservation_enabled: boolean;
        plan: string;
        status: string;
        timezone: string;
      }[];
};

export async function getCurrentBusiness(): Promise<CurrentBusiness> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("business_users")
    .select(
      "business_id, role, businesses(id, name, slug, type, logo_url, cover_url, phone, email, address, city, country, public_description, brand_primary_color, brand_secondary_color, instagram_url, facebook_url, whatsapp_url, website_enabled, reservation_enabled, plan, status, timezone)",
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle<BusinessUserRow>();

  if (error || !data) {
    redirect("/login?error=missing_business");
  }

  const business = Array.isArray(data.businesses)
    ? data.businesses[0]
    : data.businesses;

  if (!business) {
    redirect("/login?error=missing_business");
  }

  return {
    userId: user.id,
    businessId: data.business_id,
    role: data.role,
    business,
  };
}
