import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/current-business";
import { createAdminClient } from "@/lib/supabase/admin";

export type Customer = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  tags: string[];
  notes: string | null;
  total_visits: number;
  total_spent: number;
  last_visit_at: string | null;
  status: string;
  created_at: string;
};

export type Reservation = {
  id: string;
  date: string;
  time: string;
  party_size: number;
  status: string;
  source: string;
  notes: string | null;
  special_request: string | null;
  customer_id: string;
  customers: { full_name: string; phone: string | null } | null;
};

export type BusinessUser = {
  user_id: string;
  role: string;
  status: string;
};

export type PublicBusiness = {
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
  timezone: string;
  public_description: string | null;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  whatsapp_url: string | null;
  website_enabled: boolean;
  reservation_enabled: boolean;
};

export type CustomerFilters = {
  q?: string;
  status?: string;
  tag?: string;
};

export type ReservationFilters = {
  date?: string;
  status?: string;
  source?: string;
};

export async function getDashboardData() {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartIso = monthStart.toISOString().slice(0, 10);

  const [
    reservationsToday,
    customersTotal,
    customersNew,
    pendingReservations,
    noShows,
    pendingTasks,
    activity,
  ] = await Promise.all([
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("date", today),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .gte("created_at", `${monthStartIso}T00:00:00.000Z`),
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "pending"),
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "no_show")
      .gte("date", monthStartIso),
    supabase
      .from("internal_tasks")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .in("status", ["pending", "in_progress"]),
    supabase
      .from("customer_events")
      .select("id, type, title, description, created_at")
      .eq("business_id", current.businessId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return {
    current,
    stats: {
      reservationsToday: reservationsToday.count ?? 0,
      customersTotal: customersTotal.count ?? 0,
      customersNew: customersNew.count ?? 0,
      pendingReservations: pendingReservations.count ?? 0,
      noShows: noShows.count ?? 0,
      pendingTasks: pendingTasks.count ?? 0,
    },
    activity: activity.data ?? [],
  };
}

export async function getCustomersData(filters: CustomerFilters = {}) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  let query = supabase
    .from("customers")
    .select("*")
    .eq("business_id", current.businessId);

  if (filters.q) {
    const q = filters.q.replace(/[%_,]/g, "");
    query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.tag) {
    query = query.contains("tags", [filters.tag]);
  }

  const { data } = await query.order("created_at", { ascending: false });

  return { current, customers: (data ?? []) as Customer[] };
}

export async function getCustomerDetail(customerId: string) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const [customer, events, reservations, notes, tasks, comments, businessUsers] =
    await Promise.all([
      supabase
        .from("customers")
        .select("*")
        .eq("business_id", current.businessId)
        .eq("id", customerId)
        .single<Customer>(),
      supabase
        .from("customer_events")
        .select("id, type, title, description, created_at")
        .eq("business_id", current.businessId)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false }),
      supabase
        .from("reservations")
        .select("id, date, time, party_size, status, source, notes")
        .eq("business_id", current.businessId)
        .eq("customer_id", customerId)
        .order("date", { ascending: false }),
      supabase
        .from("internal_notes")
        .select("id, title, content, created_at")
        .eq("business_id", current.businessId)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false }),
      supabase
        .from("internal_tasks")
        .select("id, title, description, priority, status, due_date, assigned_to, created_at")
        .eq("business_id", current.businessId)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false }),
      supabase
        .from("internal_comments")
        .select("id, task_id, note_id, comment, created_at")
        .eq("business_id", current.businessId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("business_users")
        .select("user_id, role, status")
        .eq("business_id", current.businessId)
        .eq("status", "active")
        .order("created_at", { ascending: true }),
    ]);

  return {
    current,
    customer: customer.data,
    events: events.data ?? [],
    reservations: reservations.data ?? [],
    notes: notes.data ?? [],
    tasks: tasks.data ?? [],
    comments: comments.data ?? [],
    businessUsers: (businessUsers.data ?? []) as BusinessUser[],
  };
}

export async function getReservationsData(filters: ReservationFilters = {}) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  let reservationsQuery = supabase
    .from("reservations")
    .select("id, date, time, party_size, status, source, notes, special_request, customer_id, customers(full_name, phone)")
    .eq("business_id", current.businessId);

  if (filters.date) {
    reservationsQuery = reservationsQuery.eq("date", filters.date);
  }

  if (filters.status && filters.status !== "all") {
    reservationsQuery = reservationsQuery.eq("status", filters.status);
  }

  if (filters.source && filters.source !== "all") {
    reservationsQuery = reservationsQuery.eq("source", filters.source);
  }

  const [reservations, customers] = await Promise.all([
    reservationsQuery
      .order("date", { ascending: true })
      .order("time", { ascending: true }),
    supabase
      .from("customers")
      .select("id, full_name, phone, email")
      .eq("business_id", current.businessId)
      .order("full_name", { ascending: true }),
  ]);

  return {
    current,
    reservations: (reservations.data ?? []) as unknown as Reservation[],
    customers: (customers.data ?? []) as Customer[],
  };
}

export async function getCalendarData(date: string) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;
  const [reservations, tasks] = await Promise.all([
    supabase
      .from("reservations")
      .select("id, date, time, party_size, status, source, notes, customer_id, customers(full_name, phone)")
      .eq("business_id", current.businessId)
      .eq("date", date)
      .order("time", { ascending: true }),
    supabase
      .from("internal_tasks")
      .select("id, title, priority, status, due_date, customers(full_name)")
      .eq("business_id", current.businessId)
      .gte("due_date", dayStart)
      .lte("due_date", dayEnd)
      .order("due_date", { ascending: true }),
  ]);

  return {
    current,
    reservations: (reservations.data ?? []) as unknown as Reservation[],
    tasks: tasks.data ?? [],
  };
}

export async function getBusinessSettingsData() {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const [hours, modules] = await Promise.all([
    supabase
      .from("business_hours")
      .select("day_of_week, opens_at, closes_at, is_closed")
      .eq("business_id", current.businessId)
      .order("day_of_week", { ascending: true }),
    supabase
      .from("business_modules")
      .select("module_key, enabled")
      .eq("business_id", current.businessId)
      .order("module_key", { ascending: true }),
  ]);

  return {
    current,
    hours: hours.data ?? [],
    modules: modules.data ?? [],
  };
}

export async function getPublicBusinessBySlug(slug: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle<PublicBusiness>();

  if (!data) {
    return null;
  }

  const { data: hours } = await admin
    .from("business_hours")
    .select("day_of_week, opens_at, closes_at, is_closed")
    .eq("business_id", data.id)
    .order("day_of_week", { ascending: true });

  return {
    business: data,
    hours: hours ?? [],
  };
}
