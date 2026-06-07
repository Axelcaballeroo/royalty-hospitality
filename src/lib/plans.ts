import { getCurrentBusiness } from "@/lib/current-business";
import { createClient } from "@/lib/supabase/server";

export type PlanKey = "basic" | "pro" | "premium" | "business";

export const planOrder: PlanKey[] = ["basic", "pro", "premium", "business"];

export const planModules: Record<PlanKey, string[]> = {
  basic: ["dashboard", "crm", "reservations", "reports_basic"],
  pro: ["dashboard", "crm", "reservations", "reports_basic", "marketing", "loyalty"],
  premium: [
    "dashboard",
    "crm",
    "reservations",
    "reports_basic",
    "marketing",
    "loyalty",
    "inventory",
    "waste",
    "wallet_placeholder",
  ],
  business: [
    "dashboard",
    "crm",
    "reservations",
    "reports_advanced",
    "marketing",
    "loyalty",
    "inventory",
    "waste",
    "wallet_placeholder",
    "hr",
    "multi_location_placeholder",
    "academy_placeholder",
  ],
};

export const moduleCatalog: Record<
  string,
  { name: string; description: string; requiredPlan: PlanKey; benefits: string[] }
> = {
  dashboard: {
    name: "Dashboard",
    description: "Pulso ejecutivo del negocio.",
    requiredPlan: "basic",
    benefits: ["Metricas del dia", "Actividad reciente", "Alertas operativas"],
  },
  crm: {
    name: "Clientes CRM",
    description: "Cliente como nucleo de la operacion.",
    requiredPlan: "basic",
    benefits: ["Historial", "Reservas conectadas", "Notas y tareas"],
  },
  reservations: {
    name: "Reservas",
    description: "Reservas privadas y publicas.",
    requiredPlan: "basic",
    benefits: ["Estados", "Fuentes", "Conexion al CRM"],
  },
  reports_basic: {
    name: "Reportes basicos",
    description: "Reporte ejecutivo inicial.",
    requiredPlan: "basic",
    benefits: ["Reservas", "Clientes", "Actividad general"],
  },
  reports_advanced: {
    name: "Reportes avanzados",
    description: "Lectura ejecutiva completa por modulo.",
    requiredPlan: "business",
    benefits: ["RRHH", "Merma", "Marketing", "Fidelizacion avanzada"],
  },
  marketing: {
    name: "Marketing",
    description: "Segmentos, campanas y recuperacion de clientes.",
    requiredPlan: "pro",
    benefits: ["Campanas simuladas", "Segmentos automaticos", "Anti-merma"],
  },
  loyalty: {
    name: "Fidelizacion",
    description: "Puntos, niveles, recompensas y club.",
    requiredPlan: "pro",
    benefits: ["Puntos", "Recompensas", "Check-in staff"],
  },
  inventory: {
    name: "Inventario",
    description: "Productos, lotes y movimientos FEFO.",
    requiredPlan: "premium",
    benefits: ["Stock minimo", "Entradas y salidas", "Lotes por vencer"],
  },
  waste: {
    name: "Merma",
    description: "Alertas de vencimiento y perdida estimada.",
    requiredPlan: "premium",
    benefits: ["Alertas", "Campanas anti-merma", "Perdida estimada"],
  },
  wallet_placeholder: {
    name: "Wallet",
    description: "Modulo reservado para saldos y pagos futuros.",
    requiredPlan: "premium",
    benefits: ["Beneficios futuros", "Preparado para pagos", "Experiencia premium"],
  },
  hr: {
    name: "RRHH",
    description: "Empleados, turnos y checador.",
    requiredPlan: "business",
    benefits: ["Checador", "Turnos", "Horas estimadas"],
  },
  multi_location_placeholder: {
    name: "Multi-location",
    description: "Preparado para multiples sucursales.",
    requiredPlan: "business",
    benefits: ["Operacion por ubicacion", "Comparativos", "Expansion"],
  },
  academy_placeholder: {
    name: "Academy",
    description: "Preparado para entrenamiento de equipos.",
    requiredPlan: "business",
    benefits: ["Capacitacion", "Procesos", "Estandares"],
  },
};

export function normalizePlan(plan?: string | null): PlanKey {
  return planOrder.includes(plan as PlanKey) ? (plan as PlanKey) : "basic";
}

export function planIncludesModule(plan: string | null | undefined, moduleKey: string) {
  const normalizedPlan = normalizePlan(plan);
  return planModules[normalizedPlan].includes(moduleKey);
}

export async function getModuleAccess() {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const plan = normalizePlan(current.business.plan);
  const { data } = await supabase
    .from("business_modules")
    .select("module_key, enabled")
    .eq("business_id", current.businessId);
  const overrides = new Map((data ?? []).map((module) => [module.module_key, module.enabled]));

  const access = Object.keys(moduleCatalog).reduce<Record<string, boolean>>((acc, moduleKey) => {
    const includedByPlan = planIncludesModule(plan, moduleKey);
    const enabled = overrides.has(moduleKey) ? Boolean(overrides.get(moduleKey)) : true;
    acc[moduleKey] = includedByPlan && enabled;
    return acc;
  }, {});

  return { current, plan, access, overrides };
}

export async function hasModule(moduleKey: string) {
  const { access } = await getModuleAccess();
  return Boolean(access[moduleKey]);
}

export async function hasAnyModule(moduleKeys: string[]) {
  const { access } = await getModuleAccess();
  return moduleKeys.some((moduleKey) => Boolean(access[moduleKey]));
}
