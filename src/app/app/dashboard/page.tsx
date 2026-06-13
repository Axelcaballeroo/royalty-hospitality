import Link from "next/link";
import { Plus } from "lucide-react";
import { getDashboardData } from "@/lib/data";
import { EmptyState, ModuleCard, SectionHeader, StatCard, StatusBadge } from "@/components/ui";
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
        description="Pulso del negocio por dia, crecimiento, operacion y alertas comerciales."
        actions={
          <Link
            href="/app/operacion"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
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

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-950">Hoy</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Reservas hoy" value={String(stats.reservationsToday)} detail="Fecha actual del servidor" tone="dark" />
          <StatCard title="Turnos de hoy" value={String(stats.shiftsToday)} detail="Equipo programado" />
          <StatCard title="Trabajando ahora" value={String(stats.employeesWorkingNow)} detail="Checador RRHH" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-950">Crecimiento</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Clientes nuevos mes" value={String(stats.customersNew)} detail="Creados este mes" />
          <StatCard title="Clientes inactivos" value={String(stats.inactiveCustomers)} detail="60 dias" />
          <StatCard title="Campanas enviadas" value={String(stats.campaignsSent)} detail="Este mes" />
          <StatCard title="Puntos emitidos" value={String(stats.pointsIssued)} detail="Este mes" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-950">Operacion</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Reservas pendientes" value={String(stats.pendingReservations)} detail="Por confirmar" />
          <StatCard title="No-shows del mes" value={String(stats.noShows)} detail="Requieren seguimiento" />
          <StatCard title="Clientes totales" value={String(stats.customersTotal)} detail="CRM del tenant" />
          <StatCard title="Tareas pendientes" value={String(stats.pendingTasks)} detail="Internas" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-950">Alertas</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Alertas de merma" value={String(stats.openWasteAlerts)} detail="Abiertas" />
          <StatCard title="Lotes urgentes" value={String(stats.urgentBatches)} detail="Vencimiento critico" />
          <StatCard title="Merma estimada" value={`$${stats.estimatedWasteLoss.toFixed(0)}`} detail="MXN en riesgo" />
          <StatCard title="Salidas pendientes" value={String(stats.pendingClockOuts)} detail="Entradas abiertas" />
          <StatCard title="Automatizaciones" value={String(stats.automationsToday)} detail="Ejecutadas hoy" />
          <StatCard title="Errores auto" value={String(stats.automationErrorsToday)} detail="Revisar logs" />
        </div>
      </section>

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
