import {
  ensureAutomationDefaultsAction,
  runAutomationRuleAction,
  toggleAutomationRuleAction,
} from "@/app/app/automatizaciones/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { UpgradeModuleScreen } from "@/components/upgrade-module-screen";
import { DataTable, EmptyState, ModuleCard, PrimaryButton, SecondaryButton, StatCard, StatusBadge } from "@/components/ui";
import { actionLabels, triggerLabels } from "@/lib/automation";
import { getAutomationData } from "@/lib/data";
import { hasModule } from "@/lib/plans";

export const dynamic = "force-dynamic";

const fieldClass =
  "h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400";

const statusFilters = [
  { value: "all", label: "Todos" },
  { value: "success", label: "Exitosos" },
  { value: "failed", label: "Errores" },
  { value: "skipped", label: "Omitidos" },
];

export default async function AutomationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
    status?: string;
    enabled?: string;
  }>;
}) {
  if (!(await hasModule("automation"))) {
    return <UpgradeModuleScreen moduleKey="automation" />;
  }

  const params = await searchParams;
  const status = statusFilters.some((filter) => filter.value === params.status)
    ? params.status ?? "all"
    : "all";
  const enabled =
    params.enabled === "true" || params.enabled === "false" ? params.enabled : "all";
  const { current, rules, logs, metrics } = await getAutomationData({ status, enabled });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
            Automatizaciones
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-950">
            Automation Engine V1
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            Reglas internas para conectar CRM, reservas, fidelizacion, wallet, marketing y merma. Las acciones son simuladas y quedan listas para revision del equipo.
          </p>
        </div>
        <form action={ensureAutomationDefaultsAction}>
          <SecondaryButton>Restaurar reglas base</SecondaryButton>
        </form>
      </div>

      {params.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {params.error}
        </p>
      ) : null}
      {params.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {params.success}
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Reglas activas" value={String(metrics.activeRules)} detail={current.business.name} tone="dark" />
        <StatCard title="Reglas inactivas" value={String(metrics.inactiveRules)} detail="Pausadas" />
        <StatCard title="Ejecutadas hoy" value={String(metrics.runsToday)} detail="Success" />
        <StatCard title="Errores hoy" value={String(metrics.errorsToday)} detail="Failed" />
        <StatCard title="Historial reciente" value={String(metrics.recentRuns)} detail="Ultimos logs" />
      </section>

      <ModuleCard title="Filtros" description="Revisa reglas por estado y logs por resultado.">
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <select name="enabled" defaultValue={enabled} className={fieldClass}>
            <option value="all">Todas las reglas</option>
            <option value="true">Solo activas</option>
            <option value="false">Solo inactivas</option>
          </select>
          <select name="status" defaultValue={status} className={fieldClass}>
            {statusFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
          <PrimaryButton type="submit">Aplicar filtros</PrimaryButton>
        </form>
      </ModuleCard>

      <ModuleCard title="Reglas" description="Disparadores y acciones iniciales del motor.">
        {rules.length ? (
          <DataTable
            columns={["Regla", "Disparador", "Accion", "Estado", "Ejecutar", "Activacion"]}
            rows={rules.map((rule) => [
              <div key="name">
                <p className="font-medium text-stone-950">{rule.name}</p>
                <p className="mt-1 text-xs text-stone-500">
                  Config JSON preparada para ajustes futuros.
                </p>
              </div>,
              triggerLabels[rule.trigger_type],
              actionLabels[rule.action_type],
              <StatusBadge key="enabled" status={rule.enabled ? "active" : "inactive"} />,
              <form key="run" action={runAutomationRuleAction}>
                <input type="hidden" name="rule_id" value={rule.id} />
                <ConfirmSubmitButton
                  className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-medium text-white transition hover:bg-stone-800"
                  message="Ejecutar esta automatizacion ahora?"
                >
                  Ejecutar
                </ConfirmSubmitButton>
              </form>,
              <form key="toggle" action={toggleAutomationRuleAction}>
                <input type="hidden" name="rule_id" value={rule.id} />
                <input type="hidden" name="enabled" value={rule.enabled ? "false" : "true"} />
                <button className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-xs font-medium text-stone-800 transition hover:border-stone-300">
                  {rule.enabled ? "Pausar" : "Activar"}
                </button>
              </form>,
            ])}
          />
        ) : (
          <EmptyState
            title="Sin reglas todavia"
            description="Restaura las reglas base para iniciar con automatizaciones operativas."
            action={
              <form action={ensureAutomationDefaultsAction}>
                <PrimaryButton>Crear reglas base</PrimaryButton>
              </form>
            }
          />
        )}
      </ModuleCard>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ModuleCard title="Historial" description="Resultado de cada ejecucion manual o automatica futura.">
          {logs.length ? (
            <DataTable
              columns={["Fecha", "Regla", "Resultado", "Mensaje"]}
              rows={logs.map((log) => [
                new Date(log.created_at).toLocaleString("es-MX", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
                log.automation_rules?.name ?? "Regla eliminada",
                <StatusBadge key="status" status={log.status} />,
                log.message,
              ])}
            />
          ) : (
            <EmptyState
              title="Sin ejecuciones"
              description="Ejecuta una regla para crear el primer log de automatizacion."
            />
          )}
        </ModuleCard>

        <ModuleCard title="Acciones disponibles" description="Preparadas sin integraciones externas reales.">
          <div className="grid gap-2">
            {Object.entries(actionLabels).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                <span className="text-sm font-medium text-stone-700">{label}</span>
                <StatusBadge status={key} />
              </div>
            ))}
          </div>
        </ModuleCard>
      </section>
    </div>
  );
}
