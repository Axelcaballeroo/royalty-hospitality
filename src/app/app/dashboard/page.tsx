import Link from "next/link";
import { Plus } from "lucide-react";
import { getDashboardData } from "@/lib/data";
import { EmptyState, ModuleCard, StatCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { current, stats, activity } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
          {current.business.name}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-950">
          Dashboard real
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          Metricas calculadas desde Supabase para el negocio activo.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Reservas de hoy" value={String(stats.reservationsToday)} detail="Fecha actual del servidor" tone="dark" />
        <StatCard title="Clientes totales" value={String(stats.customersTotal)} detail="CRM del tenant" />
        <StatCard title="Nuevos este mes" value={String(stats.customersNew)} detail="Clientes creados desde inicio de mes" />
        <StatCard title="Pendientes" value={String(stats.pendingReservations)} detail="Reservas por confirmar" />
        <StatCard title="No-shows del mes" value={String(stats.noShows)} detail="Requieren seguimiento" />
        <StatCard title="Puntos emitidos" value={String(stats.pointsIssued)} detail="Este mes" />
        <StatCard title="Campanas enviadas" value={String(stats.campaignsSent)} detail="Este mes" />
        <StatCard title="Clientes alcanzados" value={String(stats.customersReached)} detail="Este mes" />
        <StatCard title="Inactivos" value={String(stats.inactiveCustomers)} detail="60 dias" />
        <StatCard title="Cumpleanos" value={String(stats.birthdayCustomers)} detail="Este mes" />
        <StatCard title="Canjes" value={String(stats.rewardsRedeemed)} detail="Recompensas este mes" />
        <StatCard title="Bajo stock" value={String(stats.lowStockItems)} detail="Inventario" />
        <StatCard title="Alertas merma" value={String(stats.openWasteAlerts)} detail="Abiertas" />
        <StatCard title="Lotes urgentes" value={String(stats.urgentBatches)} detail="Vencimiento critico" />
        <StatCard title="Merma estimada" value={`$${stats.estimatedWasteLoss.toFixed(0)}`} detail="MXN en riesgo" />
        <StatCard title="Trabajando ahora" value={String(stats.employeesWorkingNow)} detail="Checador RRHH" />
        <StatCard title="Turnos de hoy" value={String(stats.shiftsToday)} detail="Equipo programado" />
        <StatCard title="Salidas pendientes" value={String(stats.pendingClockOuts)} detail="Entradas abiertas" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <StatCard
          title="Tareas internas pendientes"
          value={String(stats.pendingTasks)}
          detail="Pendientes o en progreso"
        />
        <ModuleCard title="Acciones rapidas" description="Atajos para operar desde el dashboard.">
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/app/reservas"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              <Plus size={16} />
              Crear reserva
            </Link>
            <Link
              href="/app/clientes"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-800 transition hover:border-stone-300"
            >
              <Plus size={16} />
              Crear cliente
            </Link>
            <Link
              href="/app/clientes"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-800 transition hover:border-stone-300"
            >
              <Plus size={16} />
              Crear tarea interna
            </Link>
          </div>
        </ModuleCard>
      </section>

      <ModuleCard title="Actividad reciente" description="Timeline global desde customer_events.">
        {activity.length ? (
          <div className="space-y-3">
            {activity.map((event) => (
              <div key={event.id} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-950">{event.title}</p>
                <p className="mt-1 text-xs text-stone-500">{event.type}</p>
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
