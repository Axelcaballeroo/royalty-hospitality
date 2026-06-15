import { createClient } from "@/lib/supabase/server";
import { requireCurrentBusiness } from "@/lib/current-business";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ensureDefaultAutomationRules,
  type AutomationActionType,
  type AutomationTriggerType,
} from "@/lib/automation";
import { getSegmentCustomers, segmentDefinitions } from "@/lib/marketing";
import { estimateWorkedHours, getTodayDate, getWeekStartIso } from "@/lib/hr";
import { getPlanCounts } from "@/lib/superadmin";

export type Customer = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  loyalty_code: string | null;
  loyalty_enabled: boolean;
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

export type InternalTask = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  created_at: string;
  customers?: { id: string; full_name: string } | null;
  reservations?: { id: string; date: string; time: string } | null;
};

export type InternalNote = {
  id: string;
  title: string;
  content: string;
  customer_id: string | null;
  reservation_id: string | null;
  created_at: string;
  customers?: { id: string; full_name: string } | null;
  reservations?: { id: string; date: string; time: string } | null;
};

export type InternalComment = {
  id: string;
  task_id: string | null;
  note_id: string | null;
  comment: string;
  created_at: string;
  internal_tasks?: { title: string } | null;
  internal_notes?: { title: string } | null;
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
  menu_pdf_url?: string | null;
  website_enabled: boolean;
  reservation_enabled: boolean;
  plan: string;
  status: string;
  onboarding_completed?: boolean;
  onboarding_step?: number;
};

export type BusinessSettings = {
  id: string;
  business_id: string;
  currency: string;
  points_per_currency: number;
  reservation_auto_confirmed: boolean;
  reservation_interval_minutes: number;
  timezone: string;
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

export type LoyaltyAccount = {
  id: string;
  customer_id: string;
  points_balance: number;
  tier: string;
  customers: { full_name: string; phone: string | null; loyalty_code?: string | null } | null;
};

export type Reward = {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  status: string;
};

export type LoyaltyTransaction = {
  id: string;
  customer_id: string;
  type: string;
  points: number;
  description: string | null;
  created_at: string;
  customers: { full_name: string } | null;
};

export type Campaign = {
  id: string;
  name: string;
  type: string;
  segment_key: string;
  message: string;
  channel: string;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
};

export type CampaignRecipient = {
  id: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  redeemed_at: string | null;
  customers: { full_name: string; phone: string | null; email: string | null } | null;
};

export type MessageTemplate = {
  id: string;
  name: string;
  type: string;
  message: string;
  status: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  min_stock: number;
  status: string;
  created_at: string;
};

export type InventoryBatch = {
  id: string;
  item_id: string;
  quantity: number;
  initial_quantity: number;
  expiration_date: string | null;
  cost: number;
  status: string;
  inventory_items?: { name: string; unit: string } | null;
};

export type InventoryMovement = {
  id: string;
  item_id: string;
  batch_id: string | null;
  type: string;
  quantity: number;
  reason: string | null;
  created_at: string;
  inventory_items?: { name: string; unit: string } | null;
};

export type WasteAlert = {
  id: string;
  item_id: string;
  batch_id: string | null;
  risk_level: string;
  message: string;
  estimated_loss: number;
  status: string;
  created_at: string;
  inventory_items?: { name: string; unit: string } | null;
};

export type Courtesy = {
  id: string;
  closure_id: string | null;
  customer_id: string | null;
  employee_id: string | null;
  date: string;
  item_name: string;
  quantity: number;
  estimated_value: number;
  reason: string;
  authorized_by: string | null;
  notes: string | null;
  created_at: string;
  customers?: { full_name: string } | null;
  employees?: { full_name: string } | null;
};

export type DailyClosure = {
  id: string;
  date: string;
  summary: string | null;
  estimated_sales: number;
  completed_reservations: number;
  no_shows: number;
  courtesy_total: number;
  waste_total: number;
  incidents: string | null;
  manager_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Employee = {
  id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  position: string | null;
  status: string;
  created_at: string;
};

export type Shift = {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  role: string | null;
  status: string;
  employees?: { full_name: string; position: string | null } | null;
};

export type TimeClockEntry = {
  id: string;
  employee_id: string;
  shift_id: string | null;
  clock_in: string;
  clock_out: string | null;
  break_start: string | null;
  break_end: string | null;
  notes: string | null;
  created_at: string;
  employees?: { full_name: string; position: string | null } | null;
  shifts?: { date: string; start_time: string; end_time: string; role: string | null } | null;
};

export type AssistantAlertPriority = "CRITICA" | "ALTA" | "MEDIA" | "BAJA";

export type AssistantAlert = {
  id: string;
  area: "Inventario" | "Clientes" | "Marketing" | "Operacion" | "Equipo";
  title: string;
  description: string;
  priority: AssistantAlertPriority;
  date: string;
  href: string;
  resolveLabel: string;
};

export type WalletAccount = {
  id: string;
  customer_id: string;
  balance: number;
  currency: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  customers?: { full_name: string; phone: string | null; email?: string | null } | null;
  wallet_transactions?: { created_at: string; type: string; amount: number }[];
};

export type WalletTransaction = {
  id: string;
  customer_id: string;
  type: string;
  amount: number;
  description: string | null;
  reference: string | null;
  created_at: string;
  customers?: { full_name: string; phone: string | null } | null;
};

export type ClubEvent = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  created_at: string;
};

export type AutomationRule = {
  id: string;
  business_id: string;
  name: string;
  trigger_type: AutomationTriggerType;
  action_type: AutomationActionType;
  enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AutomationLog = {
  id: string;
  business_id: string;
  rule_id: string | null;
  status: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
  automation_rules?: {
    name: string;
    trigger_type: AutomationTriggerType;
    action_type: AutomationActionType;
  } | null;
};

type RawAutomationLog = Omit<AutomationLog, "automation_rules"> & {
  automation_rules?:
    | AutomationLog["automation_rules"]
    | AutomationLog["automation_rules"][];
};

function normalizeAutomationLogs(rows: unknown): AutomationLog[] {
  return ((rows as RawAutomationLog[] | null) ?? []).map((log) => ({
    ...log,
    automation_rules: Array.isArray(log.automation_rules)
      ? log.automation_rules[0] ?? null
      : log.automation_rules ?? null,
  }));
}

export type ReportPeriod = "today" | "7d" | "month" | "90d";

function getReportRange(period: ReportPeriod) {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "7d") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    start.setDate(start.getDate() - 89);
    start.setHours(0, 0, 0, 0);
  }

  return {
    start,
    end,
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export type ClubCustomer = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  loyalty_code: string | null;
  last_visit_at: string | null;
};

export async function getDashboardData() {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const todayStartIso = `${today}T00:00:00.000Z`;
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartIso = monthStart.toISOString().slice(0, 10);

  const [
    reservationsToday,
    vipReservationsToday,
    completedReservations,
    estimatedSales,
    customersTotal,
    customersNew,
    pendingReservations,
    inRoomReservations,
    noShows,
    pendingTasks,
    pointsIssued,
    rewardsRedeemed,
    campaignsSent,
    customersReached,
    inactiveCustomers,
    birthdayCustomers,
    inventoryItems,
    openWasteAlerts,
    urgentBatches,
    wasteAlertsForLoss,
    employeesWorkingNow,
    shiftsToday,
    pendingClockOuts,
    automationsToday,
    automationErrorsToday,
    automationActivity,
    activity,
  ] = await Promise.all([
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("date", today),
    supabase
      .from("reservations")
      .select("id, customers(loyalty_code, loyalty_accounts(tier))")
      .eq("business_id", current.businessId)
      .eq("date", today)
      .neq("status", "cancelled"),
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "completed")
      .gte("date", monthStartIso),
    supabase
      .from("daily_closures")
      .select("estimated_sales")
      .eq("business_id", current.businessId)
      .gte("date", monthStartIso),
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
      .select("party_size")
      .eq("business_id", current.businessId)
      .eq("date", today)
      .eq("status", "completed"),
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
      .from("loyalty_transactions")
      .select("points")
      .eq("business_id", current.businessId)
      .eq("type", "earn")
      .gte("created_at", `${monthStartIso}T00:00:00.000Z`),
    supabase
      .from("loyalty_transactions")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("type", "redeem")
      .gte("created_at", `${monthStartIso}T00:00:00.000Z`),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "sent")
      .gte("sent_at", `${monthStartIso}T00:00:00.000Z`),
    supabase
      .from("campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "sent")
      .gte("sent_at", `${monthStartIso}T00:00:00.000Z`),
    getSegmentCustomers({
      businessId: current.businessId,
      segmentKey: "inactive_60d",
    }),
    getSegmentCustomers({
      businessId: current.businessId,
      segmentKey: "birthday_month",
    }),
    supabase
      .from("inventory_items")
      .select("id, min_stock, inventory_batches(quantity)")
      .eq("business_id", current.businessId)
      .eq("status", "active"),
    supabase
      .from("waste_alerts")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "open"),
    supabase
      .from("inventory_batches")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "urgent")
      .gt("quantity", 0),
    supabase
      .from("waste_alerts")
      .select("estimated_loss")
      .eq("business_id", current.businessId)
      .eq("status", "open"),
    supabase
      .from("time_clock_entries")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .is("clock_out", null),
    supabase
      .from("shifts")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("date", today)
      .neq("status", "cancelled"),
    supabase
      .from("time_clock_entries")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .is("clock_out", null),
    supabase
      .from("automation_logs")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "success")
      .gte("created_at", todayStartIso),
    supabase
      .from("automation_logs")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "failed")
      .gte("created_at", todayStartIso),
    supabase
      .from("automation_logs")
      .select("id, status, message, created_at, automation_rules(name, trigger_type, action_type)")
      .eq("business_id", current.businessId)
      .order("created_at", { ascending: false })
      .limit(5),
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
      vipReservationsToday:
        ((vipReservationsToday.data ?? []) as unknown as {
          customers?: {
            loyalty_code: string | null;
            loyalty_accounts?: { tier: string }[] | { tier: string } | null;
          } | null;
        }[]).filter((reservation) => {
          const account = Array.isArray(reservation.customers?.loyalty_accounts)
            ? reservation.customers?.loyalty_accounts[0]
            : reservation.customers?.loyalty_accounts;
          return Boolean(reservation.customers?.loyalty_code) || ["gold", "black"].includes(account?.tier ?? "");
        }).length,
      completedReservations: completedReservations.count ?? 0,
      estimatedSales:
        estimatedSales.data?.reduce(
          (sum, closure) => sum + Number(closure.estimated_sales),
          0,
        ) ?? 0,
      customersTotal: customersTotal.count ?? 0,
      customersNew: customersNew.count ?? 0,
      pendingReservations: pendingReservations.count ?? 0,
      customersInRoom:
        inRoomReservations.data?.reduce(
          (sum, reservation) => sum + Number(reservation.party_size),
          0,
        ) ?? 0,
      noShows: noShows.count ?? 0,
      pendingTasks: pendingTasks.count ?? 0,
      pointsIssued:
        pointsIssued.data?.reduce(
          (sum, transaction) => sum + Math.max(0, Number(transaction.points)),
          0,
        ) ?? 0,
      rewardsRedeemed: rewardsRedeemed.count ?? 0,
      campaignsSent: campaignsSent.count ?? 0,
      customersReached: customersReached.count ?? 0,
      inactiveCustomers: inactiveCustomers.length,
      birthdayCustomers: birthdayCustomers.length,
      lowStockItems:
        inventoryItems.data?.filter((item) => {
          const batches = (item.inventory_batches ?? []) as { quantity: number }[];
          const stock = batches.reduce(
            (sum, batch) => sum + Number(batch.quantity),
            0,
          );
          return stock <= Number(item.min_stock);
        }).length ?? 0,
      activeInventoryProducts: inventoryItems.data?.length ?? 0,
      openWasteAlerts: openWasteAlerts.count ?? 0,
      urgentBatches: urgentBatches.count ?? 0,
      estimatedWasteLoss:
        wasteAlertsForLoss.data?.reduce(
          (sum, alert) => sum + Number(alert.estimated_loss),
          0,
        ) ?? 0,
      employeesWorkingNow: employeesWorkingNow.count ?? 0,
      shiftsToday: shiftsToday.count ?? 0,
      pendingClockOuts: pendingClockOuts.count ?? 0,
      automationsToday: automationsToday.count ?? 0,
      automationErrorsToday: automationErrorsToday.count ?? 0,
    },
    automationActivity: normalizeAutomationLogs(automationActivity.data ?? []),
    activity: activity.data ?? [],
  };
}

function priorityRank(priority: AssistantAlertPriority) {
  return { CRITICA: 0, ALTA: 1, MEDIA: 2, BAJA: 3 }[priority];
}

export async function getAssistantData() {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const today = getTodayDate();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoDate = sevenDaysAgo.toISOString().slice(0, 10);

  const [
    wasteAlerts,
    urgentBatches,
    inventoryItems,
    pendingReservations,
    noShows,
    closure,
    overdueTasks,
    openClockEntries,
    shiftsToday,
    birthdayCustomers,
    inactiveCustomers,
    vipCustomers,
  ] = await Promise.all([
    supabase
      .from("waste_alerts")
      .select("id, risk_level, message, estimated_loss, created_at, inventory_items(name, unit)")
      .eq("business_id", current.businessId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("inventory_batches")
      .select("id, quantity, expiration_date, status, inventory_items(name, unit)")
      .eq("business_id", current.businessId)
      .in("status", ["near_expiration", "urgent", "expired"])
      .gt("quantity", 0)
      .order("expiration_date", { ascending: true })
      .limit(8),
    supabase
      .from("inventory_items")
      .select("id, name, unit, min_stock, inventory_batches(quantity)")
      .eq("business_id", current.businessId)
      .eq("status", "active"),
    supabase
      .from("reservations")
      .select("id, date, time, party_size, customer_id, customers(full_name)")
      .eq("business_id", current.businessId)
      .eq("status", "pending")
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(8),
    supabase
      .from("reservations")
      .select("id, date, time, customer_id, customers(full_name)")
      .eq("business_id", current.businessId)
      .eq("status", "no_show")
      .gte("date", sevenDaysAgoDate)
      .order("date", { ascending: false })
      .limit(5),
    supabase
      .from("daily_closures")
      .select("id, date, status, incidents, updated_at")
      .eq("business_id", current.businessId)
      .eq("date", today)
      .maybeSingle<{ id: string; date: string; status: string; incidents: string | null; updated_at: string }>(),
    supabase
      .from("internal_tasks")
      .select("id, title, due_date, priority")
      .eq("business_id", current.businessId)
      .in("status", ["pending", "in_progress"])
      .lt("due_date", `${today}T00:00:00.000Z`)
      .order("due_date", { ascending: true })
      .limit(8),
    supabase
      .from("time_clock_entries")
      .select("id, clock_in, employees(full_name)")
      .eq("business_id", current.businessId)
      .is("clock_out", null)
      .order("clock_in", { ascending: true })
      .limit(8),
    supabase
      .from("shifts")
      .select("id, date, start_time, role, status, employees(full_name)")
      .eq("business_id", current.businessId)
      .eq("date", today)
      .in("status", ["scheduled", "missed"])
      .order("start_time", { ascending: true })
      .limit(8),
    getSegmentCustomers({ businessId: current.businessId, segmentKey: "birthday_month" }),
    getSegmentCustomers({ businessId: current.businessId, segmentKey: "inactive_60d" }),
    getSegmentCustomers({ businessId: current.businessId, segmentKey: "vip_customers" }),
  ]);

  const lowStockAlerts = ((inventoryItems.data ?? []) as (InventoryItem & {
    inventory_batches?: { quantity: number }[];
  })[])
    .map((item) => ({
      item,
      stock: (item.inventory_batches ?? []).reduce((sum, batch) => sum + Number(batch.quantity), 0),
    }))
    .filter(({ item, stock }) => stock <= Number(item.min_stock))
    .slice(0, 6);
  const pendingReservationRows = (pendingReservations.data ?? []) as unknown as {
    id: string;
    date: string;
    time: string;
    party_size: number;
    customer_id: string;
    customers?: { full_name: string } | null;
  }[];
  const noShowRows = (noShows.data ?? []) as unknown as {
    id: string;
    date: string;
    time: string;
    customer_id: string;
    customers?: { full_name: string } | null;
  }[];
  const overdueTaskRows = (overdueTasks.data ?? []) as {
    id: string;
    title: string;
    due_date: string | null;
    priority: string;
  }[];
  const openClockRows = (openClockEntries.data ?? []) as unknown as {
    id: string;
    clock_in: string;
    employees?: { full_name: string } | null;
  }[];
  const shiftRows = (shiftsToday.data ?? []) as unknown as {
    id: string;
    date: string;
    start_time: string;
    role: string | null;
    status: string;
    employees?: { full_name: string } | null;
  }[];

  const alerts: AssistantAlert[] = [
    ...((wasteAlerts.data ?? []) as unknown as WasteAlert[]).map((alert) => ({
      id: `waste-${alert.id}`,
      area: "Inventario" as const,
      title: `Merma en riesgo: ${alert.inventory_items?.name ?? "Producto"}`,
      description: alert.message,
      priority: alert.risk_level === "urgent" || alert.risk_level === "high" ? "CRITICA" as const : "ALTA" as const,
      date: alert.created_at,
      href: "/app/inventario?view=alertas",
      resolveLabel: "Resolver",
    })),
    ...((urgentBatches.data ?? []) as unknown as InventoryBatch[]).map((batch) => ({
      id: `batch-${batch.id}`,
      area: "Inventario" as const,
      title: `Producto por vencer: ${batch.inventory_items?.name ?? "Producto"}`,
      description: `${batch.quantity} ${batch.inventory_items?.unit ?? ""} con vencimiento ${batch.expiration_date ?? "sin fecha"}.`,
      priority: batch.status === "expired" || batch.status === "urgent" ? "ALTA" as const : "MEDIA" as const,
      date: batch.expiration_date ?? today,
      href: "/app/inventario?view=vencimientos",
      resolveLabel: "Resolver",
    })),
    ...lowStockAlerts.map(({ item, stock }) => ({
      id: `stock-${item.id}`,
      area: "Inventario" as const,
      title: `Stock bajo: ${item.name}`,
      description: `Quedan ${stock} ${item.unit}; el minimo recomendado es ${item.min_stock}.`,
      priority: "MEDIA" as const,
      date: today,
      href: "/app/inventario",
      resolveLabel: "Resolver",
    })),
    ...pendingReservationRows.map((reservation) => ({
      id: `reservation-${reservation.id}`,
      area: "Operacion" as const,
      title: `Reserva pendiente: ${reservation.customers?.full_name ?? "Cliente"}`,
      description: `${reservation.date} ${reservation.time.slice(0, 5)} / ${reservation.party_size} personas.`,
      priority: "ALTA" as const,
      date: reservation.date,
      href: "/app/operacion?tab=reservas",
      resolveLabel: "Resolver",
    })),
    ...noShowRows.map((reservation) => ({
      id: `noshow-${reservation.id}`,
      area: "Operacion" as const,
      title: `No-show: ${reservation.customers?.full_name ?? "Cliente"}`,
      description: `No asistio el ${reservation.date}. Conviene dar seguimiento.`,
      priority: "MEDIA" as const,
      date: reservation.date,
      href: "/app/operacion?tab=alertas",
      resolveLabel: "Resolver",
    })),
    ...(closure.data?.status === "closed"
      ? []
      : [{
          id: `closure-${today}`,
          area: "Operacion" as const,
          title: "Cierre pendiente",
          description: "Aun no se ha cerrado el dia operativo.",
          priority: "ALTA" as const,
          date: today,
          href: "/app/operacion?tab=cierre",
          resolveLabel: "Resolver",
        }]),
    ...(closure.data?.incidents?.trim()
      ? [{
          id: `incident-${closure.data.id}`,
          area: "Operacion" as const,
          title: "Incidencia sin resolver",
          description: closure.data.incidents,
          priority: "MEDIA" as const,
          date: closure.data.updated_at,
          href: "/app/operacion?tab=cierre",
          resolveLabel: "Resolver",
        }]
      : []),
    ...overdueTaskRows.map((task) => ({
      id: `task-${task.id}`,
      area: "Equipo" as const,
      title: `Tarea vencida: ${task.title}`,
      description: task.due_date ? new Date(task.due_date).toLocaleString("es-MX") : "Sin fecha limite.",
      priority: task.priority === "high" ? "ALTA" as const : "MEDIA" as const,
      date: task.due_date ?? today,
      href: "/app/crm-interno",
      resolveLabel: "Resolver",
    })),
    ...openClockRows.map((entry) => ({
      id: `clock-${entry.id}`,
      area: "Equipo" as const,
      title: `Empleado sin salida: ${entry.employees?.full_name ?? "Empleado"}`,
      description: `Entrada registrada ${new Date(entry.clock_in).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}.`,
      priority: "MEDIA" as const,
      date: entry.clock_in,
      href: "/app/rrhh/checador",
      resolveLabel: "Resolver",
    })),
    ...shiftRows.map((shift) => ({
      id: `shift-${shift.id}`,
      area: "Equipo" as const,
      title: `Turno pendiente: ${shift.employees?.full_name ?? "Empleado"}`,
      description: `${shift.start_time.slice(0, 5)} / ${shift.role ?? "turno operativo"}.`,
      priority: shift.status === "missed" ? "ALTA" as const : "BAJA" as const,
      date: shift.date,
      href: "/app/rrhh",
      resolveLabel: "Resolver",
    })),
    ...vipCustomers.slice(0, 4).map((customer) => ({
      id: `vip-${customer.id}`,
      area: "Clientes" as const,
      title: `Cliente VIP para revisar: ${customer.full_name}`,
      description: customer.phone ?? customer.email ?? "Cliente frecuente sin contacto visible.",
      priority: "BAJA" as const,
      date: customer.last_visit_at ?? today,
      href: `/app/clientes/${customer.id}`,
      resolveLabel: "Resolver",
    })),
    ...birthdayCustomers.slice(0, 4).map((customer) => ({
      id: `birthday-${customer.id}`,
      area: "Clientes" as const,
      title: `Cumpleanos del mes: ${customer.full_name}`,
      description: "Puedes activar una cortesia o campana de cumpleanos.",
      priority: "BAJA" as const,
      date: today,
      href: "/app/marketing?segment=birthday_month&type=birthday",
      resolveLabel: "Resolver",
    })),
    ...(inactiveCustomers.length
      ? [{
          id: "inactive-customers",
          area: "Marketing" as const,
          title: `${inactiveCustomers.length} clientes inactivos`,
          description: "Hay una oportunidad para recuperar visitas con una campana.",
          priority: "MEDIA" as const,
          date: today,
          href: "/app/marketing?segment=inactive_60d&type=inactive_customers",
          resolveLabel: "Resolver",
        }]
      : []),
  ].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));

  return {
    current,
    alerts,
    counts: {
      total: alerts.length,
      critical: alerts.filter((alert) => alert.priority === "CRITICA").length,
      high: alerts.filter((alert) => alert.priority === "ALTA").length,
      medium: alerts.filter((alert) => alert.priority === "MEDIA").length,
      low: alerts.filter((alert) => alert.priority === "BAJA").length,
    },
  };
}

type OperationReservation = Reservation & {
  customers: {
    id: string;
    full_name: string;
    phone: string | null;
    loyalty_code?: string | null;
    loyalty_accounts?: { points_balance: number; tier: string }[] | { points_balance: number; tier: string } | null;
  } | null;
};

type LowStockRow = {
  id: string;
  name: string;
  unit: string;
  min_stock: number;
  inventory_batches?: { quantity: number }[];
};

export async function getOperationData() {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoDate = sevenDaysAgo.toISOString().slice(0, 10);

  const [
    reservations,
    pendingReservations,
    recentNoShows,
    tasks,
    overdueTasks,
    openClockEntries,
    wasteAlerts,
    urgentBatches,
    inventoryItems,
    customerSignals,
    courtesies,
    campaigns,
    closure,
    rewards,
  ] = await Promise.all([
    supabase
      .from("reservations")
      .select("id, date, time, party_size, status, source, notes, special_request, customer_id, customers(id, full_name, phone, loyalty_code, loyalty_accounts(points_balance, tier))")
      .eq("business_id", current.businessId)
      .eq("date", today)
      .order("time", { ascending: true }),
    supabase
      .from("reservations")
      .select("id, date, time, party_size, status, customer_id, customers(id, full_name, phone)")
      .eq("business_id", current.businessId)
      .eq("status", "pending")
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(6),
    supabase
      .from("reservations")
      .select("id, date, time, party_size, status, customer_id, customers(id, full_name, phone)")
      .eq("business_id", current.businessId)
      .eq("status", "no_show")
      .gte("date", sevenDaysAgoDate)
      .order("date", { ascending: false })
      .limit(5),
    supabase
      .from("internal_tasks")
      .select("id, title, description, priority, status, due_date, assigned_to, created_at, customers(id, full_name), reservations(id, date, time)")
      .eq("business_id", current.businessId)
      .in("status", ["pending", "in_progress"])
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(8),
    supabase
      .from("internal_tasks")
      .select("id, title, description, priority, status, due_date, assigned_to, created_at, customers(id, full_name), reservations(id, date, time)")
      .eq("business_id", current.businessId)
      .in("status", ["pending", "in_progress"])
      .lt("due_date", `${today}T00:00:00.000Z`)
      .order("due_date", { ascending: true })
      .limit(6),
    supabase
      .from("time_clock_entries")
      .select("id, employee_id, shift_id, clock_in, clock_out, break_start, break_end, notes, created_at, employees(full_name, position), shifts(date, start_time, end_time, role)")
      .eq("business_id", current.businessId)
      .is("clock_out", null)
      .order("clock_in", { ascending: false }),
    supabase
      .from("waste_alerts")
      .select("id, item_id, batch_id, risk_level, message, estimated_loss, status, created_at, inventory_items(name, unit)")
      .eq("business_id", current.businessId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("inventory_batches")
      .select("id, item_id, quantity, initial_quantity, expiration_date, cost, status, inventory_items(name, unit)")
      .eq("business_id", current.businessId)
      .in("status", ["near_expiration", "urgent", "expired"])
      .gt("quantity", 0)
      .order("expiration_date", { ascending: true })
      .limit(8),
    supabase
      .from("inventory_items")
      .select("id, name, unit, min_stock, inventory_batches(quantity)")
      .eq("business_id", current.businessId)
      .eq("status", "active"),
    supabase
      .from("customers")
      .select("id, full_name, phone, email, birthday, loyalty_code, loyalty_enabled, tags, notes, total_visits, total_spent, last_visit_at, status, created_at")
      .eq("business_id", current.businessId)
      .eq("status", "active")
      .limit(100),
    supabase
      .from("courtesies")
      .select("id, closure_id, customer_id, employee_id, date, item_name, quantity, estimated_value, reason, authorized_by, notes, created_at, customers(full_name), employees(full_name)")
      .eq("business_id", current.businessId)
      .eq("date", today)
      .order("created_at", { ascending: false }),
    supabase
      .from("campaigns")
      .select("id, name, type, segment_key, message, channel, status, scheduled_at, sent_at, created_at")
      .eq("business_id", current.businessId)
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("daily_closures")
      .select("id, date, summary, estimated_sales, completed_reservations, no_shows, courtesy_total, waste_total, incidents, manager_notes, status, created_at, updated_at")
      .eq("business_id", current.businessId)
      .eq("date", today)
      .maybeSingle<DailyClosure>(),
    supabase
      .from("rewards")
      .select("id, name, description, points_required, status")
      .eq("business_id", current.businessId)
      .eq("status", "active")
      .order("points_required", { ascending: true }),
  ]);

  const reservationRows = (reservations.data ?? []) as unknown as OperationReservation[];
  const vipReservations = reservationRows.filter((reservation) => {
    const account = Array.isArray(reservation.customers?.loyalty_accounts)
      ? reservation.customers?.loyalty_accounts[0]
      : reservation.customers?.loyalty_accounts;
    return reservation.customers?.loyalty_code || ["gold", "black"].includes(account?.tier ?? "");
  });
  const lowStockItems = ((inventoryItems.data ?? []) as LowStockRow[])
    .map((item) => {
      const stock = (item.inventory_batches ?? []).reduce(
        (sum, batch) => sum + Number(batch.quantity),
        0,
      );
      return { ...item, stock };
    })
    .filter((item) => item.stock <= Number(item.min_stock));
  const courtesyRows = (courtesies.data ?? []) as unknown as Courtesy[];
  const customerSignalRows = (customerSignals.data ?? []) as Customer[];
  const todayMonth = today.slice(5, 7);
  const inactiveCutoff = new Date();
  inactiveCutoff.setDate(inactiveCutoff.getDate() - 30);
  const birthdayCustomers = customerSignalRows.filter((customer) => customer.birthday?.slice(5, 7) === todayMonth);
  const inactiveCustomers = customerSignalRows.filter((customer) => {
    if (!customer.last_visit_at) return true;
    return new Date(customer.last_visit_at) < inactiveCutoff;
  });
  const courtesyTotal = courtesyRows.reduce(
    (sum, courtesy) => sum + Number(courtesy.estimated_value) * Number(courtesy.quantity),
    0,
  );
  const closureRow = closure.data ?? null;

  return {
    current,
    today,
    reservations: reservationRows,
    pendingReservations: (pendingReservations.data ?? []) as unknown as OperationReservation[],
    recentNoShows: (recentNoShows.data ?? []) as unknown as OperationReservation[],
    vipReservations,
    tasks: (tasks.data ?? []) as unknown as InternalTask[],
    overdueTasks: (overdueTasks.data ?? []) as unknown as InternalTask[],
    openClockEntries: (openClockEntries.data ?? []) as unknown as TimeClockEntry[],
    wasteAlerts: (wasteAlerts.data ?? []) as unknown as WasteAlert[],
    urgentBatches: (urgentBatches.data ?? []) as unknown as InventoryBatch[],
    lowStockItems,
    birthdayCustomers,
    inactiveCustomers,
    courtesies: courtesyRows,
    courtesyTotal,
    campaigns: (campaigns.data ?? []) as Campaign[],
    closure: closureRow,
    rewards: (rewards.data ?? []) as Reward[],
    stats: {
      reservationsToday: reservationRows.length,
      expectedCustomers: reservationRows.reduce(
        (sum, reservation) => sum + Number(reservation.party_size),
        0,
      ),
      vipToday: vipReservations.length,
      pendingTasks: tasks.data?.length ?? 0,
      birthdays: birthdayCustomers.length,
      inactiveCustomers: inactiveCustomers.length,
      employeesWorking: openClockEntries.data?.length ?? 0,
      wasteAlerts: wasteAlerts.data?.length ?? 0,
      courtesiesToday: courtesyRows.length,
      suggestedCampaigns: (campaigns.data?.length ?? 0) + (wasteAlerts.data?.length ? 1 : 0),
      closurePending: closureRow?.status === "closed" ? 0 : 1,
    },
  };
}

export async function getDailyClosureData(dateInput?: string) {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const date = dateInput || new Date().toISOString().slice(0, 10);

  const [closure, courtesies, customers, employees, reservationCounts, wasteMovements] =
    await Promise.all([
      supabase
        .from("daily_closures")
        .select("id, date, summary, estimated_sales, completed_reservations, no_shows, courtesy_total, waste_total, incidents, manager_notes, status, created_at, updated_at")
        .eq("business_id", current.businessId)
        .eq("date", date)
        .maybeSingle<DailyClosure>(),
      supabase
        .from("courtesies")
        .select("id, closure_id, customer_id, employee_id, date, item_name, quantity, estimated_value, reason, authorized_by, notes, created_at, customers(full_name), employees(full_name)")
        .eq("business_id", current.businessId)
        .eq("date", date)
        .order("created_at", { ascending: false }),
      supabase
        .from("customers")
        .select("id, full_name, phone, email, birthday, loyalty_code, loyalty_enabled, tags, notes, total_visits, total_spent, last_visit_at, status, created_at")
        .eq("business_id", current.businessId)
        .eq("status", "active")
        .order("full_name", { ascending: true })
        .limit(80),
      supabase
        .from("employees")
        .select("id, user_id, full_name, phone, email, position, status, created_at")
        .eq("business_id", current.businessId)
        .eq("status", "active")
        .order("full_name", { ascending: true }),
      supabase
        .from("reservations")
        .select("id, status")
        .eq("business_id", current.businessId)
        .eq("date", date),
      supabase
        .from("inventory_movements")
        .select("quantity")
        .eq("business_id", current.businessId)
        .eq("type", "waste")
        .gte("created_at", `${date}T00:00:00.000Z`)
        .lt("created_at", `${date}T23:59:59.999Z`),
    ]);

  const courtesyRows = (courtesies.data ?? []) as unknown as Courtesy[];
  const courtesyTotal = courtesyRows.reduce(
    (sum, courtesy) => sum + Number(courtesy.estimated_value) * Number(courtesy.quantity),
    0,
  );
  const reservationRows = reservationCounts.data ?? [];

  return {
    current,
    date,
    closure: closure.data,
    courtesies: courtesyRows,
    customers: (customers.data ?? []) as Customer[],
    employees: (employees.data ?? []) as Employee[],
    defaults: {
      completedReservations: reservationRows.filter((reservation) => reservation.status === "completed").length,
      noShows: reservationRows.filter((reservation) => reservation.status === "no_show").length,
      courtesyTotal,
      wasteTotal:
        wasteMovements.data?.reduce((sum, movement) => sum + Number(movement.quantity), 0) ?? 0,
    },
  };
}

export async function getAutomationData(filters: { status?: string; enabled?: string } = {}) {
  const current = await requireCurrentBusiness();
  await ensureDefaultAutomationRules(current.businessId);
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  let rulesQuery = supabase
    .from("automation_rules")
    .select("*")
    .eq("business_id", current.businessId)
    .order("created_at", { ascending: true });

  if (filters.enabled === "true") {
    rulesQuery = rulesQuery.eq("enabled", true);
  } else if (filters.enabled === "false") {
    rulesQuery = rulesQuery.eq("enabled", false);
  }

  let logsQuery = supabase
    .from("automation_logs")
    .select("id, business_id, rule_id, status, message, metadata, created_at, automation_rules(name, trigger_type, action_type)")
    .eq("business_id", current.businessId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (filters.status && filters.status !== "all") {
    logsQuery = logsQuery.eq("status", filters.status);
  }

  const [rules, logs, logsToday, errorsToday] = await Promise.all([
    rulesQuery,
    logsQuery,
    supabase
      .from("automation_logs")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "success")
      .gte("created_at", `${today}T00:00:00.000Z`),
    supabase
      .from("automation_logs")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "failed")
      .gte("created_at", `${today}T00:00:00.000Z`),
  ]);

  const automationRules = (rules.data ?? []) as AutomationRule[];
  const automationLogs = normalizeAutomationLogs(logs.data ?? []);

  return {
    current,
    rules: automationRules,
    logs: automationLogs,
    metrics: {
      activeRules: automationRules.filter((rule) => rule.enabled).length,
      inactiveRules: automationRules.filter((rule) => !rule.enabled).length,
      runsToday: logsToday.count ?? 0,
      errorsToday: errorsToday.count ?? 0,
      recentRuns: automationLogs.length,
    },
  };
}

export async function getCustomersData(filters: CustomerFilters = {}) {
  const current = await requireCurrentBusiness();
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
  const customers = (data ?? []) as Customer[];
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartDate = monthStart.toISOString().slice(0, 10);
  const [{ data: pointsIssued }, { count: visitsThisMonth }] = await Promise.all([
    supabase
      .from("loyalty_transactions")
      .select("points")
      .eq("business_id", current.businessId)
      .eq("type", "earn"),
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "completed")
      .gte("date", monthStartDate),
  ]);

  return {
    current,
    customers,
    stats: {
      totalCustomers: customers.length,
      vipCustomers: customers.filter((customer) => customer.total_visits >= 5 || Number(customer.total_spent) >= 5000).length,
      inactiveCustomers: customers.filter((customer) => {
        if (!customer.last_visit_at) {
          return true;
        }
        const lastVisit = new Date(customer.last_visit_at);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 60);
        return lastVisit < cutoff;
      }).length,
      pointsIssued:
        pointsIssued?.reduce((sum, transaction) => sum + Math.max(0, Number(transaction.points)), 0) ?? 0,
      visitsThisMonth: visitsThisMonth ?? 0,
    },
  };
}

export async function getCustomerDetail(customerId: string) {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const [customer, events, reservations, notes, tasks, comments, businessUsers, loyaltyAccount, loyaltyTransactions, rewards, campaignRecipients, walletAccount, walletTransactions] =
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
      supabase
        .from("loyalty_accounts")
        .select("id, points_balance, tier")
        .eq("business_id", current.businessId)
        .eq("customer_id", customerId)
        .maybeSingle<{ id: string; points_balance: number; tier: string }>(),
      supabase
        .from("loyalty_transactions")
        .select("id, type, points, description, created_at")
        .eq("business_id", current.businessId)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("rewards")
        .select("id, name, description, points_required, status")
        .eq("business_id", current.businessId)
        .eq("status", "active")
        .order("points_required", { ascending: true }),
      supabase
        .from("campaign_recipients")
        .select("id, status, sent_at, opened_at, clicked_at, redeemed_at, campaigns(name, channel)")
        .eq("business_id", current.businessId)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("wallet_accounts")
        .select("id, customer_id, balance, currency, status, created_at, updated_at")
        .eq("business_id", current.businessId)
        .eq("customer_id", customerId)
        .maybeSingle<WalletAccount>(),
      supabase
        .from("wallet_transactions")
        .select("id, customer_id, type, amount, description, reference, created_at")
        .eq("business_id", current.businessId)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(12),
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
    loyaltyAccount: loyaltyAccount.data,
    loyaltyTransactions: loyaltyTransactions.data ?? [],
    rewards: (rewards.data ?? []) as Reward[],
    campaignRecipients: campaignRecipients.data ?? [],
    walletAccount: walletAccount.data,
    walletTransactions: (walletTransactions.data ?? []) as WalletTransaction[],
  };
}

export async function getInternalCrmData() {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();

  const [tasks, notes, comments, customers, reservations, businessUsers] =
    await Promise.all([
      supabase
        .from("internal_tasks")
        .select("id, title, description, priority, status, due_date, assigned_to, created_at, customers(id, full_name), reservations(id, date, time)")
        .eq("business_id", current.businessId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("internal_notes")
        .select("id, title, content, customer_id, reservation_id, created_at, customers(id, full_name), reservations(id, date, time)")
        .eq("business_id", current.businessId)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("internal_comments")
        .select("id, task_id, note_id, comment, created_at, internal_tasks(title), internal_notes(title)")
        .eq("business_id", current.businessId)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("customers")
        .select("id, full_name, phone, email")
        .eq("business_id", current.businessId)
        .order("full_name", { ascending: true }),
      supabase
        .from("reservations")
        .select("id, date, time, customer_id, customers(full_name)")
        .eq("business_id", current.businessId)
        .order("date", { ascending: false })
        .limit(50),
      supabase
        .from("business_users")
        .select("user_id, role, status")
        .eq("business_id", current.businessId)
        .eq("status", "active")
        .order("created_at", { ascending: true }),
    ]);

  const taskRows = (tasks.data ?? []) as unknown as InternalTask[];
  const noteRows = (notes.data ?? []) as unknown as InternalNote[];
  const commentRows = (comments.data ?? []) as unknown as InternalComment[];

  return {
    current,
    tasks: taskRows,
    notes: noteRows,
    comments: commentRows,
    customers: (customers.data ?? []) as Customer[],
    reservations: reservations.data ?? [],
    businessUsers: (businessUsers.data ?? []) as BusinessUser[],
    metrics: {
      pendingTasks: taskRows.filter((task) => ["pending", "in_progress"].includes(task.status)).length,
      completedTasks: taskRows.filter((task) => task.status === "completed").length,
      notes: noteRows.length,
      comments: commentRows.length,
      assignedUsers: new Set(taskRows.map((task) => task.assigned_to).filter(Boolean)).size,
    },
  };
}

export async function getReservationsData(filters: ReservationFilters = {}) {
  const current = await requireCurrentBusiness();
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
  const current = await requireCurrentBusiness();
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
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const [hours, modules, settings, users] = await Promise.all([
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
    supabase
      .from("business_settings")
      .select("id, business_id, currency, points_per_currency, reservation_auto_confirmed, reservation_interval_minutes, timezone")
      .eq("business_id", current.businessId)
      .maybeSingle<BusinessSettings>(),
    supabase
      .from("business_users")
      .select("id, user_id, role, status, created_at")
      .eq("business_id", current.businessId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    current,
    hours: hours.data ?? [],
    modules: modules.data ?? [],
    settings: settings.data,
    users: users.data ?? [],
  };
}

export async function getOnboardingChecklistData() {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const [settings, rewards, customers, employees, loyaltyAccounts, reservations] = await Promise.all([
    supabase
      .from("business_settings")
      .select("points_per_currency")
      .eq("business_id", current.businessId)
      .maybeSingle<{ points_per_currency: number }>(),
    supabase
      .from("rewards")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "active"),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId),
    supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "active"),
    supabase
      .from("loyalty_accounts")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId),
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId),
  ]);

  const items = [
    {
      label: "Logo cargado",
      done: Boolean(current.business.logo_url),
      href: "/app/configuracion",
    },
    {
      label: "Programa de puntos configurado",
      done: Boolean(settings.data?.points_per_currency && Number(settings.data.points_per_currency) > 0),
      href: "/app/clientes?tab=fidelizacion",
    },
    {
      label: "Primer beneficio creado",
      done: (rewards.count ?? 0) > 0,
      href: "/app/clientes?tab=beneficios&action=benefit",
    },
    {
      label: "Primer cliente registrado",
      done: (customers.count ?? 0) > 0,
      href: "/app/clientes?action=new",
    },
    {
      label: "Primer QR generado",
      done: Boolean(current.business.slug) && ((loyaltyAccounts.count ?? 0) > 0 || (customers.count ?? 0) > 0),
      href: "/app/clientes?tab=registro",
    },
    {
      label: "Equipo agregado",
      done: (employees.count ?? 0) > 0,
      href: "/app/rrhh",
    },
    {
      label: "Menu cargado",
      done: Boolean(current.business.menu_pdf_url),
      href: "/app/configuracion",
    },
    {
      label: "Primera reserva",
      done: (reservations.count ?? 0) > 0,
      href: "/app/operacion?tab=reservas&action=nueva-reserva",
    },
  ];

  const completed = items.filter((item) => item.done).length;
  const progressSteps = [0, 15, 30, 45, 60, 75, 90, 100, 100];
  const progress = progressSteps[completed] ?? 100;

  return {
    current,
    items,
    completed,
    total: items.length,
    progress,
  };
}

export async function getLoyaltyData() {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const [accounts, rewards, transactions, customers, earnTransactions, redeemTransactions] = await Promise.all([
    supabase
      .from("loyalty_accounts")
      .select("id, customer_id, points_balance, tier, customers(full_name, phone, loyalty_code)")
      .eq("business_id", current.businessId)
      .order("points_balance", { ascending: false })
      .limit(50),
    supabase
      .from("rewards")
      .select("id, name, description, points_required, status")
      .eq("business_id", current.businessId)
      .order("points_required", { ascending: true }),
    supabase
      .from("loyalty_transactions")
      .select("id, customer_id, type, points, description, created_at, customers(full_name)")
      .eq("business_id", current.businessId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("customers")
      .select("id, full_name, phone, email")
      .eq("business_id", current.businessId)
      .order("full_name", { ascending: true }),
    supabase
      .from("loyalty_transactions")
      .select("points")
      .eq("business_id", current.businessId)
      .eq("type", "earn"),
    supabase
      .from("loyalty_transactions")
      .select("points")
      .eq("business_id", current.businessId)
      .eq("type", "redeem"),
  ]);

  const loyaltyAccounts = (accounts.data ?? []) as unknown as LoyaltyAccount[];

  return {
    current,
    accounts: loyaltyAccounts,
    rewards: (rewards.data ?? []) as Reward[],
    transactions: (transactions.data ?? []) as unknown as LoyaltyTransaction[],
    customers: (customers.data ?? []) as Customer[],
    summary: {
      registeredCustomers: loyaltyAccounts.length,
      pointsIssued:
        earnTransactions.data?.reduce(
          (sum, transaction) => sum + Math.max(0, Number(transaction.points)),
          0,
        ) ?? 0,
      pointsRedeemed:
        redeemTransactions.data?.reduce(
          (sum, transaction) => sum + Math.abs(Number(transaction.points)),
          0,
        ) ?? 0,
      tierCounts: {
        bronze: loyaltyAccounts.filter((account) => account.tier === "bronze").length,
        silver: loyaltyAccounts.filter((account) => account.tier === "silver").length,
        gold: loyaltyAccounts.filter((account) => account.tier === "gold").length,
        black: loyaltyAccounts.filter((account) => account.tier === "black").length,
      },
    },
  };
}

export async function getWalletData() {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartIso = monthStart.toISOString();

  const [accounts, transactions, customers, topups, purchases, bonuses] = await Promise.all([
    supabase
      .from("wallet_accounts")
      .select("id, customer_id, balance, currency, status, created_at, updated_at, customers(full_name, phone, email), wallet_transactions(type, amount, created_at)")
      .eq("business_id", current.businessId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("wallet_transactions")
      .select("id, customer_id, type, amount, description, reference, created_at, customers(full_name, phone)")
      .eq("business_id", current.businessId)
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("customers")
      .select("id, full_name, phone, email")
      .eq("business_id", current.businessId)
      .order("full_name", { ascending: true }),
    supabase
      .from("wallet_transactions")
      .select("amount")
      .eq("business_id", current.businessId)
      .eq("type", "topup")
      .gte("created_at", monthStartIso),
    supabase
      .from("wallet_transactions")
      .select("amount")
      .eq("business_id", current.businessId)
      .eq("type", "purchase")
      .gte("created_at", monthStartIso),
    supabase
      .from("wallet_transactions")
      .select("amount")
      .eq("business_id", current.businessId)
      .eq("type", "bonus")
      .gte("created_at", monthStartIso),
  ]);

  const accountRows = (accounts.data ?? []) as unknown as WalletAccount[];
  const transactionRows = (transactions.data ?? []) as unknown as WalletTransaction[];

  return {
    current,
    accounts: accountRows,
    transactions: transactionRows,
    customers: (customers.data ?? []) as Customer[],
    metrics: {
      totalBalance: accountRows.reduce((sum, account) => sum + Number(account.balance), 0),
      activeWallets: accountRows.filter((account) => account.status === "active").length,
      topups:
        topups.data?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) ?? 0,
      purchases:
        purchases.data?.reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0) ?? 0,
      bonuses:
        bonuses.data?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) ?? 0,
    },
  };
}

export async function getMarketingData(selectedSegment = "all_customers") {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const segmentCustomers = await getSegmentCustomers({
    businessId: current.businessId,
    segmentKey: selectedSegment,
  });
  const [
    campaigns,
    sentCampaigns,
    recipients,
    inactiveCustomers,
    birthdayCustomers,
    vipCustomers,
    nearRewardCustomers,
    urgentBatches,
    templates,
  ] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, type, segment_key, message, channel, status, scheduled_at, sent_at, created_at")
      .eq("business_id", current.businessId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "sent"),
    supabase
      .from("campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId),
    getSegmentCustomers({ businessId: current.businessId, segmentKey: "inactive_60d" }),
    getSegmentCustomers({ businessId: current.businessId, segmentKey: "birthday_month" }),
    getSegmentCustomers({ businessId: current.businessId, segmentKey: "vip_customers" }),
    getSegmentCustomers({ businessId: current.businessId, segmentKey: "customers_near_reward" }),
    supabase
      .from("inventory_batches")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .in("status", ["near_expiration", "urgent", "expired"])
      .gt("quantity", 0),
    supabase
      .from("message_templates")
      .select("id, name, type, message, status")
      .eq("business_id", current.businessId)
      .order("created_at", { ascending: false }),
  ]);

  const segmentSummaries = await Promise.all(
    segmentDefinitions.map(async (segment) => ({
      ...segment,
      count: (
        await getSegmentCustomers({
          businessId: current.businessId,
          segmentKey: segment.key,
        })
      ).length,
    })),
  );

  return {
    current,
    campaigns: (campaigns.data ?? []) as Campaign[],
    templates: (templates.data ?? []) as MessageTemplate[],
    segmentCustomers,
    segmentSummaries,
    metrics: {
      campaignsCreated: campaigns.data?.length ?? 0,
      campaignsSent: sentCampaigns.count ?? 0,
      customersReached: recipients.count ?? 0,
      inactiveCustomers: inactiveCustomers.length,
      birthdayCustomers: birthdayCustomers.length,
      vipCustomers: vipCustomers.length,
      nearRewardCustomers: nearRewardCustomers.length,
      expiringProducts: urgentBatches.count ?? 0,
    },
  };
}

export async function getCampaignDetail(campaignId: string) {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const [campaign, recipients] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, type, segment_key, message, channel, status, scheduled_at, sent_at, created_at")
      .eq("business_id", current.businessId)
      .eq("id", campaignId)
      .maybeSingle<Campaign>(),
    supabase
      .from("campaign_recipients")
      .select("id, status, sent_at, opened_at, clicked_at, redeemed_at, customers(full_name, phone, email)")
      .eq("business_id", current.businessId)
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false }),
  ]);

  const recipientRows = (recipients.data ?? []) as unknown as CampaignRecipient[];

  return {
    current,
    campaign: campaign.data,
    recipients: recipientRows,
    metrics: {
      total: recipientRows.length,
      sent: recipientRows.filter((recipient) => recipient.status === "sent").length,
      opened: recipientRows.filter((recipient) => recipient.opened_at).length,
      clicked: recipientRows.filter((recipient) => recipient.clicked_at).length,
      redeemed: recipientRows.filter((recipient) => recipient.redeemed_at).length,
    },
  };
}

export async function getInventoryData() {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const [items, batches, alerts, movements] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, name, category, unit, min_stock, status, created_at, inventory_batches(quantity)")
      .eq("business_id", current.businessId)
      .order("created_at", { ascending: false }),
    supabase
      .from("inventory_batches")
      .select("id, item_id, quantity, initial_quantity, expiration_date, cost, status, inventory_items(name, unit)")
      .eq("business_id", current.businessId)
      .gt("quantity", 0)
      .order("expiration_date", { ascending: true }),
    supabase
      .from("waste_alerts")
      .select("id, item_id, batch_id, risk_level, message, estimated_loss, status, created_at, inventory_items(name, unit)")
      .eq("business_id", current.businessId)
      .eq("status", "open")
      .order("created_at", { ascending: false }),
    supabase
      .from("inventory_movements")
      .select("id, item_id, batch_id, type, quantity, reason, created_at, inventory_items(name, unit)")
      .eq("business_id", current.businessId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const itemRows = (items.data ?? []) as unknown as (InventoryItem & {
    inventory_batches?: { quantity: number }[];
  })[];
  const itemsWithStock = itemRows.map((item) => ({
    ...item,
    stock: (item.inventory_batches ?? []).reduce(
      (sum, batch) => sum + Number(batch.quantity),
      0,
    ),
  }));
  const alertRows = (alerts.data ?? []) as unknown as WasteAlert[];

  return {
    current,
    items: itemsWithStock,
    batches: (batches.data ?? []) as unknown as InventoryBatch[],
    alerts: alertRows,
    movements: (movements.data ?? []) as unknown as InventoryMovement[],
    metrics: {
      activeItems: itemsWithStock.filter((item) => item.status === "active").length,
      lowStock: itemsWithStock.filter((item) => item.stock <= Number(item.min_stock)).length,
      expiringBatches: ((batches.data ?? []) as { status: string }[]).filter(
        (batch) => batch.status === "near_expiration" || batch.status === "urgent" || batch.status === "expired",
      ).length,
      openAlerts: alertRows.length,
      estimatedLoss: alertRows.reduce(
        (sum, alert) => sum + Number(alert.estimated_loss),
        0,
      ),
    },
  };
}

export async function getInventoryItemDetail(itemId: string) {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const [item, batches, movements, alerts] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, name, category, unit, min_stock, status, created_at")
      .eq("business_id", current.businessId)
      .eq("id", itemId)
      .maybeSingle<InventoryItem>(),
    supabase
      .from("inventory_batches")
      .select("id, item_id, quantity, initial_quantity, expiration_date, cost, status")
      .eq("business_id", current.businessId)
      .eq("item_id", itemId)
      .order("expiration_date", { ascending: true }),
    supabase
      .from("inventory_movements")
      .select("id, item_id, batch_id, type, quantity, reason, created_at")
      .eq("business_id", current.businessId)
      .eq("item_id", itemId)
      .order("created_at", { ascending: false }),
    supabase
      .from("waste_alerts")
      .select("id, item_id, batch_id, risk_level, message, estimated_loss, status, created_at")
      .eq("business_id", current.businessId)
      .eq("item_id", itemId)
      .order("created_at", { ascending: false }),
  ]);
  const batchRows = (batches.data ?? []) as InventoryBatch[];

  return {
    current,
    item: item.data,
    batches: batchRows,
    movements: (movements.data ?? []) as InventoryMovement[],
    alerts: (alerts.data ?? []) as WasteAlert[],
    stock: batchRows.reduce((sum, batch) => sum + Number(batch.quantity), 0),
  };
}

export async function getHrData() {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const today = getTodayDate();
  const weekStart = getWeekStartIso();
  const todayStart = `${today}T00:00:00.000Z`;
  const todayEnd = `${today}T23:59:59.999Z`;

  const [
    employees,
    shiftsToday,
    upcomingShifts,
    openEntries,
    entriesToday,
    weekEntries,
    missedShifts,
    completedShifts,
    businessUsers,
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id, user_id, full_name, phone, email, position, status, created_at")
      .eq("business_id", current.businessId)
      .order("created_at", { ascending: false }),
    supabase
      .from("shifts")
      .select("id, employee_id, date, start_time, end_time, role, status, employees(full_name, position)")
      .eq("business_id", current.businessId)
      .eq("date", today)
      .order("start_time", { ascending: true }),
    supabase
      .from("shifts")
      .select("id, employee_id, date, start_time, end_time, role, status, employees(full_name, position)")
      .eq("business_id", current.businessId)
      .gte("date", today)
      .neq("status", "cancelled")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(12),
    supabase
      .from("time_clock_entries")
      .select("id, employee_id, shift_id, clock_in, clock_out, break_start, break_end, notes, created_at, employees(full_name, position), shifts(date, start_time, end_time, role)")
      .eq("business_id", current.businessId)
      .is("clock_out", null)
      .order("clock_in", { ascending: true }),
    supabase
      .from("time_clock_entries")
      .select("id, employee_id, shift_id, clock_in, clock_out, break_start, break_end, notes, created_at, employees(full_name, position)")
      .eq("business_id", current.businessId)
      .gte("clock_in", todayStart)
      .lte("clock_in", todayEnd)
      .order("clock_in", { ascending: false }),
    supabase
      .from("time_clock_entries")
      .select("clock_in, clock_out, break_start, break_end")
      .eq("business_id", current.businessId)
      .gte("clock_in", weekStart),
    supabase
      .from("shifts")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "missed"),
    supabase
      .from("shifts")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "completed")
      .gte("date", today),
    supabase
      .from("business_users")
      .select("user_id, role, status")
      .eq("business_id", current.businessId)
      .eq("status", "active"),
  ]);

  const employeeRows = (employees.data ?? []) as Employee[];
  const openEntryRows = (openEntries.data ?? []) as unknown as TimeClockEntry[];
  const entriesTodayRows = (entriesToday.data ?? []) as unknown as TimeClockEntry[];
  const weekHours =
    weekEntries.data?.reduce(
      (sum, entry) => sum + estimateWorkedHours(entry),
      0,
    ) ?? 0;

  return {
    current,
    employees: employeeRows,
    shiftsToday: (shiftsToday.data ?? []) as unknown as Shift[],
    upcomingShifts: (upcomingShifts.data ?? []) as unknown as Shift[],
    openEntries: openEntryRows,
    entriesToday: entriesTodayRows,
    businessUsers: (businessUsers.data ?? []) as BusinessUser[],
    summary: {
      activeEmployees: employeeRows.filter((employee) => employee.status === "active").length,
      shiftsToday: shiftsToday.data?.length ?? 0,
      entriesToday: entriesTodayRows.length,
      pendingClockOuts: openEntryRows.length,
      missedShifts: missedShifts.count ?? 0,
      completedShifts: completedShifts.count ?? 0,
      weekHours,
      lateEntries: 0,
    },
  };
}

export async function getEmployeeDetail(employeeId: string) {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const today = getTodayDate();
  const weekStart = getWeekStartIso();
  const [employee, upcomingShifts, clockEntries, weekEntries, businessUsers] =
    await Promise.all([
      supabase
        .from("employees")
        .select("id, user_id, full_name, phone, email, position, status, created_at")
        .eq("business_id", current.businessId)
        .eq("id", employeeId)
        .maybeSingle<Employee>(),
      supabase
        .from("shifts")
        .select("id, employee_id, date, start_time, end_time, role, status")
        .eq("business_id", current.businessId)
        .eq("employee_id", employeeId)
        .gte("date", today)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(10),
      supabase
        .from("time_clock_entries")
        .select("id, employee_id, shift_id, clock_in, clock_out, break_start, break_end, notes, created_at, shifts(date, start_time, end_time, role)")
        .eq("business_id", current.businessId)
        .eq("employee_id", employeeId)
        .order("clock_in", { ascending: false })
        .limit(20),
      supabase
        .from("time_clock_entries")
        .select("clock_in, clock_out, break_start, break_end")
        .eq("business_id", current.businessId)
        .eq("employee_id", employeeId)
        .gte("clock_in", weekStart),
      supabase
        .from("business_users")
        .select("user_id, role, status")
        .eq("business_id", current.businessId)
        .eq("status", "active"),
    ]);

  return {
    current,
    employee: employee.data,
    upcomingShifts: (upcomingShifts.data ?? []) as Shift[],
    clockEntries: (clockEntries.data ?? []) as unknown as TimeClockEntry[],
    businessUsers: (businessUsers.data ?? []) as BusinessUser[],
    weekHours:
      weekEntries.data?.reduce(
        (sum, entry) => sum + estimateWorkedHours(entry),
        0,
      ) ?? 0,
  };
}

export async function getTimeClockData() {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const today = getTodayDate();
  const [employees, shiftsToday, openEntries, entriesToday] = await Promise.all([
    supabase
      .from("employees")
      .select("id, user_id, full_name, phone, email, position, status, created_at")
      .eq("business_id", current.businessId)
      .eq("status", "active")
      .order("full_name", { ascending: true }),
    supabase
      .from("shifts")
      .select("id, employee_id, date, start_time, end_time, role, status, employees(full_name, position)")
      .eq("business_id", current.businessId)
      .eq("date", today)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true }),
    supabase
      .from("time_clock_entries")
      .select("id, employee_id, shift_id, clock_in, clock_out, break_start, break_end, notes, created_at, employees(full_name, position), shifts(date, start_time, end_time, role)")
      .eq("business_id", current.businessId)
      .is("clock_out", null)
      .order("clock_in", { ascending: true }),
    supabase
      .from("time_clock_entries")
      .select("id, employee_id, shift_id, clock_in, clock_out, break_start, break_end, notes, created_at, employees(full_name, position)")
      .eq("business_id", current.businessId)
      .gte("clock_in", `${today}T00:00:00.000Z`)
      .lte("clock_in", `${today}T23:59:59.999Z`)
      .order("clock_in", { ascending: false }),
  ]);

  return {
    current,
    employees: (employees.data ?? []) as Employee[],
    shiftsToday: (shiftsToday.data ?? []) as unknown as Shift[],
    openEntries: (openEntries.data ?? []) as unknown as TimeClockEntry[],
    entriesToday: (entriesToday.data ?? []) as unknown as TimeClockEntry[],
  };
}

export async function getExecutiveReportsData(period: ReportPeriod = "month") {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const range = getReportRange(period);
  const inactiveCutoff = new Date();
  inactiveCutoff.setDate(inactiveCutoff.getDate() - 60);

  const [
    reservations,
    newCustomers,
    recurringCustomers,
    inactiveCustomers,
    vipCustomers,
    pointsIssued,
    pointsRedeemed,
    rewardsRedeemed,
    loyaltyAccounts,
    campaignsSent,
    customersReached,
    campaignsRedeemed,
    wasteAlerts,
    urgentWasteAlerts,
    wasteAlertsLoss,
    wasteMovements,
    activeEmployees,
    completedShifts,
    clockEntries,
    pendingClockOuts,
  ] = await Promise.all([
    supabase
      .from("reservations")
      .select("id, status")
      .eq("business_id", current.businessId)
      .gte("date", range.startDate)
      .lte("date", range.endDate),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .gte("created_at", range.startIso)
      .lte("created_at", range.endIso),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .gt("total_visits", 1),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .or(`last_visit_at.is.null,last_visit_at.lt.${inactiveCutoff.toISOString()}`),
    getSegmentCustomers({ businessId: current.businessId, segmentKey: "vip_customers" }),
    supabase
      .from("loyalty_transactions")
      .select("points")
      .eq("business_id", current.businessId)
      .eq("type", "earn")
      .gte("created_at", range.startIso)
      .lte("created_at", range.endIso),
    supabase
      .from("loyalty_transactions")
      .select("points")
      .eq("business_id", current.businessId)
      .eq("type", "redeem")
      .gte("created_at", range.startIso)
      .lte("created_at", range.endIso),
    supabase
      .from("loyalty_transactions")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("type", "redeem")
      .gte("created_at", range.startIso)
      .lte("created_at", range.endIso),
    supabase
      .from("loyalty_accounts")
      .select("tier")
      .eq("business_id", current.businessId),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "sent")
      .gte("sent_at", range.startIso)
      .lte("sent_at", range.endIso),
    supabase
      .from("campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .gte("created_at", range.startIso)
      .lte("created_at", range.endIso),
    supabase
      .from("campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "redeemed")
      .gte("redeemed_at", range.startIso)
      .lte("redeemed_at", range.endIso),
    supabase
      .from("waste_alerts")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "open"),
    supabase
      .from("waste_alerts")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "open")
      .eq("risk_level", "urgent"),
    supabase
      .from("waste_alerts")
      .select("estimated_loss")
      .eq("business_id", current.businessId)
      .eq("status", "open"),
    supabase
      .from("inventory_movements")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("type", "waste")
      .gte("created_at", range.startIso)
      .lte("created_at", range.endIso),
    supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "active"),
    supabase
      .from("shifts")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .eq("status", "completed")
      .gte("date", range.startDate)
      .lte("date", range.endDate),
    supabase
      .from("time_clock_entries")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .gte("clock_in", range.startIso)
      .lte("clock_in", range.endIso),
    supabase
      .from("time_clock_entries")
      .select("id", { count: "exact", head: true })
      .eq("business_id", current.businessId)
      .is("clock_out", null),
  ]);

  const reservationRows = reservations.data ?? [];
  const tierRows = loyaltyAccounts.data ?? [];
  const reached = customersReached.count ?? 0;
  const redeemedCampaigns = campaignsRedeemed.count ?? 0;

  const metrics = {
    reservations: {
      total: reservationRows.length,
      confirmed: reservationRows.filter((reservation) => reservation.status === "confirmed").length,
      completed: reservationRows.filter((reservation) => reservation.status === "completed").length,
      cancelled: reservationRows.filter((reservation) => reservation.status === "cancelled").length,
      noShows: reservationRows.filter((reservation) => reservation.status === "no_show").length,
    },
    customers: {
      new: newCustomers.count ?? 0,
      recurring: recurringCustomers.count ?? 0,
      inactive: inactiveCustomers.count ?? 0,
      vip: vipCustomers.length,
    },
    loyalty: {
      pointsIssued:
        pointsIssued.data?.reduce((sum, transaction) => sum + Number(transaction.points), 0) ?? 0,
      pointsRedeemed:
        pointsRedeemed.data?.reduce((sum, transaction) => sum + Math.abs(Number(transaction.points)), 0) ?? 0,
      rewardsRedeemed: rewardsRedeemed.count ?? 0,
      tiers: {
        bronze: tierRows.filter((account) => account.tier === "bronze").length,
        silver: tierRows.filter((account) => account.tier === "silver").length,
        gold: tierRows.filter((account) => account.tier === "gold").length,
        black: tierRows.filter((account) => account.tier === "black").length,
      },
    },
    marketing: {
      campaignsSent: campaignsSent.count ?? 0,
      customersReached: reached,
      campaignsRedeemed: redeemedCampaigns,
      redemptionRate: reached ? Math.round((redeemedCampaigns / reached) * 100) : 0,
    },
    inventory: {
      openAlerts: wasteAlerts.count ?? 0,
      urgentAlerts: urgentWasteAlerts.count ?? 0,
      estimatedWaste:
        wasteAlertsLoss.data?.reduce(
          (sum, alert) => sum + Number(alert.estimated_loss),
          0,
        ) ?? 0,
      wasteMovements: wasteMovements.count ?? 0,
    },
    hr: {
      activeEmployees: activeEmployees.count ?? 0,
      completedShifts: completedShifts.count ?? 0,
      clockEntries: clockEntries.count ?? 0,
      pendingClockOuts: pendingClockOuts.count ?? 0,
    },
  };

  const summary = [
    `En este periodo tuviste ${metrics.reservations.total} reservas y ${metrics.customers.new} clientes nuevos.`,
    `Hay ${metrics.customers.inactive} clientes inactivos que podrias recuperar con una campana.`,
    `Tienes ${metrics.inventory.openAlerts} alertas de merma abiertas.`,
    `Hay ${metrics.hr.pendingClockOuts} empleados con salida pendiente.`,
  ];

  return { current, period, range, metrics, summary };
}

export async function getCheckInData(search?: string) {
  const current = await requireCurrentBusiness();
  const supabase = await createClient();
  const rawTerm = search?.trim() ?? "";
  const qrPrefix = `${current.business.slug}:`;
  const normalizedQrTerm = rawTerm.toLowerCase().startsWith(qrPrefix.toLowerCase())
    ? rawTerm.slice(qrPrefix.length)
    : rawTerm;
  const term = normalizedQrTerm.replace(/[%_,]/g, "");

  let query = supabase
    .from("customers")
    .select("id, full_name, phone, email, loyalty_code, last_visit_at, loyalty_accounts(points_balance, tier), wallet_accounts(balance, currency, status)")
    .eq("business_id", current.businessId)
    .eq("loyalty_enabled", true);

  if (term) {
    query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,loyalty_code.ilike.%${term}%`);
  }

  const { data } = await query.order("full_name", { ascending: true }).limit(20);
  const { data: rewards } = await supabase
    .from("rewards")
    .select("id, name, description, points_required, status")
    .eq("business_id", current.businessId)
    .eq("status", "active")
    .order("points_required", { ascending: true });

  return {
    current,
    customers: data ?? [],
    rewards: (rewards ?? []) as Reward[],
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

export async function getClubAccountByPhoneAndCode(input: {
  businessSlug: string;
  phone: string;
  code: string;
}) {
  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, name, slug, brand_primary_color, brand_secondary_color")
    .eq("slug", input.businessSlug)
    .eq("status", "active")
    .maybeSingle<{
      id: string;
      name: string;
      slug: string;
      brand_primary_color: string | null;
      brand_secondary_color: string | null;
    }>();

  if (!business) {
    return null;
  }

  const { data: customer } = await admin
    .from("customers")
    .select("id, full_name, phone, email, birthday, loyalty_code, last_visit_at")
    .eq("business_id", business.id)
    .eq("phone", input.phone)
    .eq("loyalty_code", input.code.toUpperCase())
    .eq("loyalty_enabled", true)
    .maybeSingle<ClubCustomer>();

  if (!customer) {
    return { business, customer: null };
  }

  const [account, transactions, rewards, walletAccount, walletTransactions, events, reservations] = await Promise.all([
    admin
      .from("loyalty_accounts")
      .select("id, points_balance, tier")
      .eq("business_id", business.id)
      .eq("customer_id", customer.id)
      .maybeSingle<{ id: string; points_balance: number; tier: string }>(),
    admin
      .from("loyalty_transactions")
      .select("id, type, points, description, created_at")
      .eq("business_id", business.id)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(12),
    admin
      .from("rewards")
      .select("id, name, description, points_required, status")
      .eq("business_id", business.id)
      .eq("status", "active")
      .order("points_required", { ascending: true }),
    admin
      .from("wallet_accounts")
      .select("id, customer_id, balance, currency, status")
      .eq("business_id", business.id)
      .eq("customer_id", customer.id)
      .maybeSingle<WalletAccount>(),
    admin
      .from("wallet_transactions")
      .select("id, customer_id, type, amount, description, reference, created_at")
      .eq("business_id", business.id)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("customer_events")
      .select("id, type, title, description, created_at")
      .eq("business_id", business.id)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("reservations")
      .select("id, date, time, party_size, status, source, notes, special_request")
      .eq("business_id", business.id)
      .eq("customer_id", customer.id)
      .order("date", { ascending: false })
      .limit(12),
  ]);

  return {
    business,
    customer,
    account: account.data,
    transactions: transactions.data ?? [],
    rewards: (rewards.data ?? []) as Reward[],
    walletAccount: walletAccount.data,
    walletTransactions: (walletTransactions.data ?? []) as WalletTransaction[],
    events: (events.data ?? []) as ClubEvent[],
    reservations: reservations.data ?? [],
  };
}

export async function getSuperadminDashboardData() {
  const admin = createAdminClient();
  const [
    businesses,
    users,
    reservations,
    customers,
    modules,
  ] = await Promise.all([
    admin
      .from("businesses")
      .select("id, name, slug, type, plan, status, created_at"),
    admin.auth.admin.listUsers({ page: 1, perPage: 1 }),
    admin.from("reservations").select("id", { count: "exact", head: true }),
    admin.from("customers").select("id", { count: "exact", head: true }),
    admin
      .from("business_modules")
      .select("module_key, enabled")
      .eq("enabled", true),
  ]);

  const businessRows = businesses.data ?? [];
  const moduleUsage = Object.entries(
    (modules.data ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.module_key] = (acc[row.module_key] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return {
    businesses: businessRows,
    metrics: {
      totalBusinesses: businessRows.length,
      activeBusinesses: businessRows.filter((business) => business.status === "active").length,
      usersRegistered: users.data.users.length,
      planCounts: getPlanCounts(businessRows),
      totalReservations: reservations.count ?? 0,
      totalCustomers: customers.count ?? 0,
      mrrPlaceholder: 0,
      moduleUsage,
    },
  };
}

export async function getSuperadminBusinessesData(search?: string) {
  const admin = createAdminClient();
  let query = admin
    .from("businesses")
    .select("id, name, slug, type, plan, status, created_at, business_users(id)")
    .order("created_at", { ascending: false });

  if (search) {
    const q = search.replace(/[%_,]/g, "");
    query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%,type.ilike.%${q}%`);
  }

  const { data } = await query;
  return (data ?? []) as unknown as (PublicBusiness & { created_at: string; business_users?: { id: string }[] })[];
}

export async function getSuperadminBusinessDetail(businessId: string) {
  const admin = createAdminClient();
  const [
    business,
    modules,
    users,
    reservations,
    customers,
    events,
    logs,
  ] = await Promise.all([
    admin
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .maybeSingle<PublicBusiness & { created_at: string; plan: string; status: string }>(),
    admin
      .from("business_modules")
      .select("id, module_key, enabled")
      .eq("business_id", businessId)
      .order("module_key", { ascending: true }),
    admin
      .from("business_users")
      .select("id, user_id, role, status, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true }),
    admin
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    admin
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    admin
      .from("customer_events")
      .select("id, type, title, description, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(8),
    admin
      .from("admin_audit_logs")
      .select("id, action, description, metadata, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return {
    business: business.data,
    modules: modules.data ?? [],
    users: users.data ?? [],
    metrics: {
      reservations: reservations.count ?? 0,
      customers: customers.count ?? 0,
    },
    events: events.data ?? [],
    logs: logs.data ?? [],
  };
}

export async function getSuperadminUsersData() {
  const admin = createAdminClient();
  const [authUsers, memberships] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    admin
      .from("business_users")
      .select("id, user_id, business_id, role, status, created_at, businesses(name, slug)")
      .order("created_at", { ascending: false }),
  ]);

  return {
    authUsers: authUsers.data.users,
    memberships: memberships.data ?? [],
  };
}
