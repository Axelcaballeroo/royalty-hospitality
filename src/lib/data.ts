import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/current-business";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSegmentCustomers, segmentDefinitions } from "@/lib/marketing";

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
      openWasteAlerts: openWasteAlerts.count ?? 0,
      urgentBatches: urgentBatches.count ?? 0,
      estimatedWasteLoss:
        wasteAlertsForLoss.data?.reduce(
          (sum, alert) => sum + Number(alert.estimated_loss),
          0,
        ) ?? 0,
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
  const [customer, events, reservations, notes, tasks, comments, businessUsers, loyaltyAccount, loyaltyTransactions, rewards, campaignRecipients] =
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

export async function getLoyaltyData() {
  const current = await getCurrentBusiness();
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

export async function getMarketingData(selectedSegment = "all_customers") {
  const current = await getCurrentBusiness();
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
    },
  };
}

export async function getCampaignDetail(campaignId: string) {
  const current = await getCurrentBusiness();
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
  const current = await getCurrentBusiness();
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
  const current = await getCurrentBusiness();
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

export async function getCheckInData(search?: string) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const term = search?.trim().replace(/[%_,]/g, "");

  let query = supabase
    .from("customers")
    .select("id, full_name, phone, email, loyalty_code, last_visit_at, loyalty_accounts(points_balance, tier)")
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

  const [account, transactions, rewards] = await Promise.all([
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
  ]);

  return {
    business,
    customer,
    account: account.data,
    transactions: transactions.data ?? [],
    rewards: (rewards.data ?? []) as Reward[],
  };
}
