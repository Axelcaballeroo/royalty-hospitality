import { applyLoyaltyPoints } from "@/lib/loyalty";
import { createClient } from "@/lib/supabase/server";
import { applyWalletTransaction } from "@/lib/wallet";

export type AutomationTriggerType =
  | "customer_inactive_60d"
  | "customer_birthday_month"
  | "customer_reached_gold"
  | "customer_reached_black"
  | "wallet_balance_above"
  | "waste_alert_created"
  | "reservation_no_show"
  | "reservation_completed";

export type AutomationActionType =
  | "create_campaign_draft"
  | "create_internal_task"
  | "grant_reward"
  | "grant_points"
  | "create_dashboard_alert"
  | "create_wallet_bonus";

export type AutomationRuleRecord = {
  id: string;
  business_id: string;
  name: string;
  trigger_type: AutomationTriggerType;
  action_type: AutomationActionType;
  enabled: boolean;
  config: Record<string, unknown>;
};

type AutomationTarget = {
  customerId?: string;
  customerName?: string;
  reservationId?: string;
  wasteAlertId?: string;
  message: string;
  metadata: Record<string, unknown>;
};

export const triggerLabels: Record<AutomationTriggerType, string> = {
  customer_inactive_60d: "Cliente inactivo 60 dias",
  customer_birthday_month: "Cliente cumple anos este mes",
  customer_reached_gold: "Cliente llego a Gold",
  customer_reached_black: "Cliente llego a Black",
  wallet_balance_above: "Wallet arriba del umbral",
  waste_alert_created: "Alerta de merma urgente",
  reservation_no_show: "Reserva no-show",
  reservation_completed: "Reserva completada",
};

export const actionLabels: Record<AutomationActionType, string> = {
  create_campaign_draft: "Crear campana borrador",
  create_internal_task: "Crear tarea interna",
  grant_reward: "Otorgar recompensa",
  grant_points: "Otorgar puntos",
  create_dashboard_alert: "Crear alerta dashboard",
  create_wallet_bonus: "Crear bono wallet",
};

export const automationTriggers = Object.keys(triggerLabels) as AutomationTriggerType[];
export const automationActions = Object.keys(actionLabels) as AutomationActionType[];

export const defaultAutomationRules: Omit<AutomationRuleRecord, "id" | "business_id">[] = [
  {
    name: "Recuperar clientes inactivos",
    trigger_type: "customer_inactive_60d",
    action_type: "create_campaign_draft",
    enabled: true,
    config: {
      campaignType: "inactive_customers",
      segmentKey: "inactive_60d",
      message: "Hola {{nombre}}, te esperamos de vuelta en {{negocio}} con una experiencia especial.",
    },
  },
  {
    name: "Campana anti-merma urgente",
    trigger_type: "waste_alert_created",
    action_type: "create_campaign_draft",
    enabled: true,
    config: {
      campaignType: "waste_reduction",
      segmentKey: "all_customers",
      message: "Hoy tenemos una recomendacion especial de temporada en {{negocio}}.",
    },
  },
  {
    name: "Seguimiento cliente Gold",
    trigger_type: "customer_reached_gold",
    action_type: "create_internal_task",
    enabled: true,
    config: {
      taskTitle: "Dar seguimiento a cliente Gold",
      priority: "medium",
    },
  },
  {
    name: "Beneficio automatico Black",
    trigger_type: "customer_reached_black",
    action_type: "grant_reward",
    enabled: true,
    config: {
      description: "Beneficio automatico por llegar a Black.",
    },
  },
  {
    name: "Seguimiento no-show",
    trigger_type: "reservation_no_show",
    action_type: "create_internal_task",
    enabled: true,
    config: {
      taskTitle: "Contactar cliente por no-show",
      priority: "high",
    },
  },
];

export async function ensureDefaultAutomationRules(businessId: string) {
  const supabase = await createClient();
  const rows = defaultAutomationRules.map((rule) => ({
    ...rule,
    business_id: businessId,
  }));

  const { error } = await supabase
    .from("automation_rules")
    .upsert(rows, { onConflict: "business_id,name", ignoreDuplicates: true });

  if (error) {
    throw new Error(error.message);
  }
}

function textConfig(
  config: Record<string, unknown>,
  key: string,
  fallback: string,
) {
  const value = config[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberConfig(
  config: Record<string, unknown>,
  key: string,
  fallback: number,
) {
  const value = Number(config[key]);
  return Number.isFinite(value) ? value : fallback;
}

async function findAutomationTarget(rule: AutomationRuleRecord): Promise<AutomationTarget | null> {
  const supabase = await createClient();
  const now = new Date();
  const inactiveCutoff = new Date(now);
  inactiveCutoff.setDate(inactiveCutoff.getDate() - 60);
  const month = now.getMonth() + 1;

  if (rule.trigger_type === "customer_inactive_60d") {
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, last_visit_at")
      .eq("business_id", rule.business_id)
      .or(`last_visit_at.is.null,last_visit_at.lt.${inactiveCutoff.toISOString()}`)
      .order("last_visit_at", { ascending: true, nullsFirst: true })
      .limit(1);
    const customer = data?.[0];
    return customer
      ? {
          customerId: customer.id,
          customerName: customer.full_name,
          message: `${customer.full_name} esta inactivo desde hace 60 dias o mas.`,
          metadata: { customer_id: customer.id, last_visit_at: customer.last_visit_at },
        }
      : null;
  }

  if (rule.trigger_type === "customer_birthday_month") {
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, birthday")
      .eq("business_id", rule.business_id)
      .not("birthday", "is", null);
    const customer = data?.find((item) => {
      if (!item.birthday) {
        return false;
      }
      return new Date(`${item.birthday}T00:00:00`).getMonth() + 1 === month;
    });
    return customer
      ? {
          customerId: customer.id,
          customerName: customer.full_name,
          message: `${customer.full_name} cumple anos este mes.`,
          metadata: { customer_id: customer.id, birthday: customer.birthday },
        }
      : null;
  }

  if (rule.trigger_type === "customer_reached_gold" || rule.trigger_type === "customer_reached_black") {
    const tier = rule.trigger_type === "customer_reached_gold" ? "gold" : "black";
    const { data } = await supabase
      .from("loyalty_accounts")
      .select("customer_id, points_balance, tier, customers(full_name)")
      .eq("business_id", rule.business_id)
      .eq("tier", tier)
      .order("updated_at", { ascending: false })
      .limit(1);
    const account = data?.[0] as
      | {
          customer_id: string;
          points_balance: number;
          tier: string;
          customers: { full_name: string } | null;
        }
      | undefined;
    return account
      ? {
          customerId: account.customer_id,
          customerName: account.customers?.full_name ?? "Cliente",
          message: `${account.customers?.full_name ?? "Cliente"} esta en nivel ${account.tier}.`,
          metadata: {
            customer_id: account.customer_id,
            points_balance: account.points_balance,
            tier: account.tier,
          },
        }
      : null;
  }

  if (rule.trigger_type === "wallet_balance_above") {
    const threshold = numberConfig(rule.config, "threshold", 1000);
    const { data } = await supabase
      .from("wallet_accounts")
      .select("customer_id, balance, customers(full_name)")
      .eq("business_id", rule.business_id)
      .gte("balance", threshold)
      .order("balance", { ascending: false })
      .limit(1);
    const account = data?.[0] as
      | { customer_id: string; balance: number; customers: { full_name: string } | null }
      | undefined;
    return account
      ? {
          customerId: account.customer_id,
          customerName: account.customers?.full_name ?? "Cliente",
          message: `${account.customers?.full_name ?? "Cliente"} tiene wallet arriba de ${threshold}.`,
          metadata: {
            customer_id: account.customer_id,
            balance: account.balance,
            threshold,
          },
        }
      : null;
  }

  if (rule.trigger_type === "waste_alert_created") {
    const { data } = await supabase
      .from("waste_alerts")
      .select("id, risk_level, message, estimated_loss")
      .eq("business_id", rule.business_id)
      .eq("status", "open")
      .in("risk_level", ["urgent", "high"])
      .order("created_at", { ascending: false })
      .limit(1);
    const alert = data?.[0];
    return alert
      ? {
          wasteAlertId: alert.id,
          message: alert.message,
          metadata: {
            waste_alert_id: alert.id,
            risk_level: alert.risk_level,
            estimated_loss: alert.estimated_loss,
          },
        }
      : null;
  }

  if (rule.trigger_type === "reservation_no_show" || rule.trigger_type === "reservation_completed") {
    const status = rule.trigger_type === "reservation_no_show" ? "no_show" : "completed";
    const { data } = await supabase
      .from("reservations")
      .select("id, customer_id, date, time, party_size, status, customers(full_name)")
      .eq("business_id", rule.business_id)
      .eq("status", status)
      .order("updated_at", { ascending: false })
      .limit(1);
    const reservation = data?.[0] as
      | {
          id: string;
          customer_id: string;
          date: string;
          time: string;
          party_size: number;
          status: string;
          customers: { full_name: string } | null;
        }
      | undefined;
    return reservation
      ? {
          customerId: reservation.customer_id,
          customerName: reservation.customers?.full_name ?? "Cliente",
          reservationId: reservation.id,
          message: `Reserva ${status} de ${reservation.customers?.full_name ?? "cliente"}.`,
          metadata: {
            reservation_id: reservation.id,
            customer_id: reservation.customer_id,
            date: reservation.date,
            time: reservation.time,
            party_size: reservation.party_size,
            status: reservation.status,
          },
        }
      : null;
  }

  return null;
}

async function logAutomation(input: {
  businessId: string;
  ruleId: string;
  status: "success" | "failed" | "skipped";
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  await supabase.from("automation_logs").insert({
    business_id: input.businessId,
    rule_id: input.ruleId,
    status: input.status,
    message: input.message,
    metadata: input.metadata ?? {},
  });
}

async function addCustomerEvent(input: {
  businessId: string;
  customerId: string;
  type: string;
  title: string;
  description: string;
  createdBy?: string | null;
}) {
  const supabase = await createClient();
  await supabase.from("customer_events").insert({
    business_id: input.businessId,
    customer_id: input.customerId,
    type: input.type,
    title: input.title,
    description: input.description,
    created_by: input.createdBy ?? null,
  });
}

async function executeAutomationAction(input: {
  rule: AutomationRuleRecord;
  target: AutomationTarget;
  userId?: string | null;
}) {
  const { rule, target, userId } = input;
  const supabase = await createClient();

  if (rule.action_type === "create_campaign_draft") {
    const campaignType = textConfig(rule.config, "campaignType", "promotion");
    const segmentKey = textConfig(rule.config, "segmentKey", "all_customers");
    const message = textConfig(
      rule.config,
      "message",
      "Mensaje automatico preparado para revision del equipo.",
    );

    const { error } = await supabase.from("campaigns").insert({
      business_id: rule.business_id,
      name: `Auto: ${rule.name}`,
      type: campaignType,
      segment_key: segmentKey,
      message,
      channel: "manual",
      status: "draft",
      created_by: userId ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }

    return "Se creo una campana borrador para revision.";
  }

  if (rule.action_type === "create_internal_task") {
    const title = textConfig(rule.config, "taskTitle", `Automatizacion: ${rule.name}`);
    const priority = textConfig(rule.config, "priority", "medium");
    const { error } = await supabase.from("internal_tasks").insert({
      business_id: rule.business_id,
      customer_id: target.customerId ?? null,
      reservation_id: target.reservationId ?? null,
      title,
      description: target.message,
      priority,
      status: "pending",
      created_by: userId ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (target.customerId) {
      await addCustomerEvent({
        businessId: rule.business_id,
        customerId: target.customerId,
        type: "task_created",
        title: "Tarea creada por automatizacion",
        description: title,
        createdBy: userId,
      });
    }

    return "Se creo una tarea interna.";
  }

  if (rule.action_type === "grant_reward") {
    if (!target.customerId) {
      return "No hay cliente para otorgar recompensa.";
    }

    const { data: reward } = await supabase
      .from("rewards")
      .select("id, name, points_required")
      .eq("business_id", rule.business_id)
      .eq("status", "active")
      .order("points_required", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; name: string; points_required: number }>();

    if (!reward) {
      return "No hay recompensa activa disponible.";
    }

    await addCustomerEvent({
      businessId: rule.business_id,
      customerId: target.customerId,
      type: "reward_redeemed",
      title: "Recompensa automatica otorgada",
      description: `${reward.name} otorgada por automatizacion.`,
      createdBy: userId,
    });

    return `Se otorgo la recompensa ${reward.name}.`;
  }

  if (rule.action_type === "grant_points") {
    if (!target.customerId) {
      return "No hay cliente para sumar puntos.";
    }

    const points = Math.round(numberConfig(rule.config, "points", 50));
    await applyLoyaltyPoints({
      businessId: rule.business_id,
      customerId: target.customerId,
      pointsDelta: points,
      type: "earn",
      description: "Puntos otorgados por automatizacion",
      createdBy: userId,
    });
    await addCustomerEvent({
      businessId: rule.business_id,
      customerId: target.customerId,
      type: "points_earned",
      title: "Puntos acumulados",
      description: `Cliente gano ${points} puntos por automatizacion.`,
      createdBy: userId,
    });

    return `Se otorgaron ${points} puntos.`;
  }

  if (rule.action_type === "create_dashboard_alert") {
    return "Se registro una alerta visible en el historial de automatizaciones.";
  }

  if (rule.action_type === "create_wallet_bonus") {
    if (!target.customerId) {
      return "No hay cliente para crear bono wallet.";
    }

    const amount = numberConfig(rule.config, "amount", 100);
    await applyWalletTransaction({
      businessId: rule.business_id,
      customerId: target.customerId,
      type: "bonus",
      amount,
      description: "Bono creado por automatizacion",
      reference: `AUTO-${rule.id.slice(0, 8)}`,
      createdBy: userId,
    });
    await addCustomerEvent({
      businessId: rule.business_id,
      customerId: target.customerId,
      type: "wallet_topup",
      title: "Bono wallet automatico",
      description: `Cliente recibio ${amount} MXN por automatizacion.`,
      createdBy: userId,
    });

    return `Se creo bono wallet por ${amount} MXN.`;
  }

  return "Accion no implementada.";
}

export async function runAutomationRule(input: {
  rule: AutomationRuleRecord;
  userId?: string | null;
}) {
  const { rule, userId } = input;

  if (!rule.enabled) {
    await logAutomation({
      businessId: rule.business_id,
      ruleId: rule.id,
      status: "skipped",
      message: "Regla inactiva.",
    });
    return { status: "skipped" as const, message: "Regla inactiva." };
  }

  try {
    const target = await findAutomationTarget(rule);

    if (!target) {
      const message = "No se encontro un caso que cumpla el disparador.";
      await logAutomation({
        businessId: rule.business_id,
        ruleId: rule.id,
        status: "skipped",
        message,
      });
      return { status: "skipped" as const, message };
    }

    const actionMessage = await executeAutomationAction({ rule, target, userId });
    const skippedByAction =
      actionMessage.startsWith("No hay") || actionMessage.startsWith("No se encontro");
    const status = skippedByAction ? "skipped" : "success";
    const message = `${target.message} ${actionMessage}`;

    await logAutomation({
      businessId: rule.business_id,
      ruleId: rule.id,
      status,
      message,
      metadata: {
        trigger_type: rule.trigger_type,
        action_type: rule.action_type,
        ...target.metadata,
      },
    });

    return { status, message };
  } catch (error) {
    const message = error instanceof Error ? error.message : "automation_failed";
    await logAutomation({
      businessId: rule.business_id,
      ruleId: rule.id,
      status: "failed",
      message,
      metadata: {
        trigger_type: rule.trigger_type,
        action_type: rule.action_type,
      },
    });
    return { status: "failed" as const, message };
  }
}
