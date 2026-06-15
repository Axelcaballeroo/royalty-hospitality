import { createClient } from "@/lib/supabase/server";

export const segmentDefinitions = [
  { key: "all_customers", name: "Todos los clientes" },
  { key: "new_customers_30d", name: "Nuevos ultimos 30 dias" },
  { key: "inactive_60d", name: "Inactivos 60 dias" },
  { key: "birthday_month", name: "Cumpleanos del mes" },
  { key: "vip_customers", name: "Clientes VIP" },
  { key: "bronze_customers", name: "Bronze" },
  { key: "silver_customers", name: "Silver" },
  { key: "gold_customers", name: "Gold" },
  { key: "black_customers", name: "Black" },
  { key: "customers_with_points", name: "Con puntos" },
  { key: "customers_near_reward", name: "Cerca de recompensa" },
  { key: "customers_without_recent_visit", name: "Sin visita reciente" },
] as const;

export const suggestedTemplates = [
  {
    name: "Cumpleanos",
    type: "birthday",
    message:
      "Hola {{nombre}}, en {{negocio}} queremos celebrar contigo. Este mes tienes un beneficio especial.",
  },
  {
    name: "Cliente inactivo",
    type: "inactive_customers",
    message:
      "Hola {{nombre}}, te extranamos en {{negocio}}. Vuelve esta semana y recibe un beneficio especial.",
  },
  {
    name: "Puntos disponibles",
    type: "reward",
    message:
      "Hola {{nombre}}, tienes {{puntos}} puntos disponibles. Puedes usarlos en tu proxima visita.",
  },
  {
    name: "Promo rapida",
    type: "promotion",
    message:
      "Hola {{nombre}}, hoy tenemos una promocion especial para ti en {{negocio}}.",
  },
];

export type SegmentCustomer = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  total_visits: number;
  total_spent: number;
  last_visit_at: string | null;
  created_at: string;
  loyalty_accounts?: { points_balance: number; tier: string }[] | { points_balance: number; tier: string } | null;
};

function getAccount(customer: SegmentCustomer) {
  if (Array.isArray(customer.loyalty_accounts)) {
    return customer.loyalty_accounts[0] ?? null;
  }

  return customer.loyalty_accounts ?? null;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export async function getSegmentCustomers(input: {
  businessId: string;
  segmentKey: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("id, full_name, phone, email, birthday, total_visits, total_spent, last_visit_at, created_at, loyalty_accounts(points_balance, tier)")
    .eq("business_id", input.businessId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const customers = (data ?? []) as unknown as SegmentCustomer[];
  const { data: rewards } = await supabase
    .from("rewards")
    .select("points_required")
    .eq("business_id", input.businessId)
    .eq("status", "active")
    .order("points_required", { ascending: true })
    .limit(1);
  const nextRewardPoints = rewards?.[0]?.points_required ?? 500;
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const thirtyDaysAgo = daysAgo(30);
  const sixtyDaysAgo = daysAgo(60);

  return customers.filter((customer) => {
    const account = getAccount(customer);

    switch (input.segmentKey) {
      case "new_customers_30d":
        return customer.created_at >= thirtyDaysAgo;
      case "inactive_60d":
        return !customer.last_visit_at || customer.last_visit_at < sixtyDaysAgo;
      case "birthday_month":
        return customer.birthday
          ? Number(customer.birthday.slice(5, 7)) === currentMonth
          : false;
      case "vip_customers":
        return customer.total_visits >= 5 || Number(customer.total_spent) >= 5000;
      case "bronze_customers":
        return account?.tier === "bronze";
      case "silver_customers":
        return account?.tier === "silver";
      case "gold_customers":
        return account?.tier === "gold";
      case "black_customers":
        return account?.tier === "black";
      case "customers_with_points":
        return (account?.points_balance ?? 0) > 0;
      case "customers_near_reward": {
        const points = account?.points_balance ?? 0;
        return points > 0 && points < nextRewardPoints && nextRewardPoints - points <= 150;
      }
      case "customers_without_recent_visit":
        return !customer.last_visit_at || customer.last_visit_at < thirtyDaysAgo;
      case "all_customers":
      default:
        return true;
    }
  });
}

export function renderMarketingMessage(input: {
  message: string;
  customer: SegmentCustomer;
  businessName: string;
}) {
  const account = getAccount(input.customer);

  return input.message
    .replaceAll("{{nombre}}", input.customer.full_name)
    .replaceAll("{{negocio}}", input.businessName)
    .replaceAll("{{puntos}}", String(account?.points_balance ?? 0))
    .replaceAll("{{nivel}}", account?.tier ?? "bronze");
}
