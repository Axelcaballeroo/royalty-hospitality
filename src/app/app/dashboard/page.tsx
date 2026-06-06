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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Reservas de hoy" value={String(stats.reservationsToday)} detail="Fecha actual del servidor" tone="dark" />
        <StatCard title="Clientes totales" value={String(stats.customersTotal)} detail="CRM del tenant" />
        <StatCard title="Nuevos este mes" value={String(stats.customersNew)} detail="Clientes creados desde inicio de mes" />
        <StatCard title="Pendientes" value={String(stats.pendingReservations)} detail="Reservas por confirmar" />
        <StatCard title="No-shows del mes" value={String(stats.noShows)} detail="Requieren seguimiento" />
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
