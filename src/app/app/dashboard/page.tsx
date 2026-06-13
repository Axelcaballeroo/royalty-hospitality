import Link from "next/link";
import { Plus } from "lucide-react";
import { getDashboardData } from "@/lib/data";
import { ActionCard, EmptyState, ModuleCard, SectionHeader, StatCard, StatusBadge } from "@/components/ui";
import { formatEventType } from "@/lib/formatters";
import { canSeeAdminGuidance } from "@/lib/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { current, stats, automationActivity, activity } = await getDashboardData();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={current.business.name}
        title="Dashboard ejecutivo"
        description="Lectura ejecutiva de crecimiento, clientes, fidelizacion, marketing, merma y equipo."
        actions={
          <Link
            href="/app/operacion"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
          >
            Ir a operacion de hoy
          </Link>
        }
      />

      {!current.business.onboarding_completed ? (
        <Link
          href="/app/onboarding"
          className="block rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 transition hover:border-amber-300"
        >
          Completa la configuracion inicial de tu negocio. Paso {current.business.onboarding_step ?? 1} de 6.
        </Link>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Clientes nuevos" value={String(stats.customersNew)} detail="Crecimiento mensual" tone="dark" />
        <StatCard title="Clientes inactivos" value={String(stats.inactiveCustomers)} detail="Oportunidad de recuperacion" />
        <StatCard title="Puntos emitidos" value={String(stats.pointsIssued)} detail="Fidelizacion" />
        <StatCard title="Campanas enviadas" value={String(stats.campaignsSent)} detail="Marketing" />
        <StatCard title="Merma estimada" value={`$${stats.estimatedWasteLoss.toFixed(0)}`} detail="Perdida en riesgo" />
        <StatCard title="Equipo trabajando" value={String(stats.employeesWorkingNow)} detail="Operacion en sala" />
      </section>

      <ModuleCard title="Lectura ejecutiva" description="Senales para decidir que mover hoy sin entrar al detalle operativo.">
        <div className="grid gap-3 md:grid-cols-3">
          <ActionCard title="Clientes" description={`${stats.inactiveCustomers} clientes necesitan una razon para volver.`} href="/app/clientes" action="Ver clientes" />
          <ActionCard title="Marketing" description={`${stats.customersReached} clientes alcanzados por campanas recientes.`} href="/app/marketing" action="Ver acciones" />
          <ActionCard title="Merma" description={`${stats.openWasteAlerts} alertas abiertas pueden convertirse en promocion.`} href="/app/inventario" action="Controlar" />
        </div>
      </ModuleCard>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <StatCard title="Clientes alcanzados" value={String(stats.customersReached)} detail="Marketing este mes" />
        <ModuleCard title="Acciones rapidas" description="Atajos para operar desde el dashboard.">
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/app/operacion"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2"
            >
              Operacion de hoy
            </Link>
            <Link
              href="/app/reservas"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-800 transition hover:border-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2"
            >
              <Plus size={16} />
              Crear reserva
            </Link>
            <Link
              href="/app/clientes"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-800 transition hover:border-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2"
            >
              <Plus size={16} />
              Crear cliente
            </Link>
            <Link
              href="/app/crm-interno"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-800 transition hover:border-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2"
            >
              <Plus size={16} />
              Crear tarea interna
            </Link>
            {canSeeAdminGuidance(current.role) ? (
              <Link
                href="/app/demo"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-800 transition hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2"
              >
                Ver recorrido guiado
              </Link>
            ) : null}
          </div>
        </ModuleCard>
      </section>

      <ModuleCard title="Ultimas automatizaciones" description="Reglas ejecutadas y alertas generadas por Automation Engine.">
        {automationActivity.length ? (
          <div className="space-y-3">
            {automationActivity.map((log) => (
              <div key={log.id} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-stone-950">
                    {log.automation_rules?.name ?? "Automatizacion"}
                  </p>
                  <StatusBadge status={log.status} />
                </div>
                <p className="mt-2 text-sm leading-6 text-stone-600">{log.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin automatizaciones ejecutadas"
            description="Cuando ejecutes reglas, los ultimos resultados apareceran aqui."
            action={
              <Link
                href="/app/automatizaciones"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
              >
                Abrir automatizaciones
              </Link>
            }
          />
        )}
      </ModuleCard>

      <ModuleCard title="Actividad reciente" description="Timeline global desde customer_events.">
        {activity.length ? (
          <div className="space-y-3">
            {activity.map((event) => (
              <div key={event.id} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-950">{event.title}</p>
                <p className="mt-1 text-xs text-stone-500">{formatEventType(event.type)}</p>
                {event.description ? (
                  <p className="mt-2 text-sm text-stone-600">{event.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin actividad todavia"
            description="Cuando crees clientes, reservas, notas o tareas, los eventos apareceran aqui."
          />
        )}
      </ModuleCard>
    </div>
  );
}
