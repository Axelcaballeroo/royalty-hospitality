import { getCalendarData } from "@/lib/data";
import { EmptyState, ModuleCard, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const selectedDate = params.date ?? new Date().toISOString().slice(0, 10);
  const { reservations, tasks } = await getCalendarData(selectedDate);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
            Calendario
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-950">
            Agenda del dia
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            Vista simple por fecha con reservas, tareas con due_date y seguimientos internos.
          </p>
        </div>
        <form className="flex gap-2">
          <input
            type="date"
            name="date"
            defaultValue={selectedDate}
            className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400"
          />
          <button className="h-11 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white">
            Ver dia
          </button>
        </form>
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <ModuleCard title="Reservas del dia" description={selectedDate}>
          {reservations.length ? (
            <div className="space-y-3">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">
                        {reservation.time.slice(0, 5)} / {reservation.customers?.full_name ?? "Cliente"}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {reservation.party_size} personas / {reservation.source}
                      </p>
                    </div>
                    <StatusBadge status={reservation.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin reservas" description="No hay reservas para esta fecha." />
          )}
        </ModuleCard>

        <ModuleCard title="Tareas y seguimientos" description="internal_tasks con due_date en esta fecha.">
          {tasks.length ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm font-semibold text-stone-950">{task.title}</p>
                  <div className="mt-2 flex gap-2">
                    <StatusBadge status={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin tareas" description="No hay seguimientos internos para esta fecha." />
          )}
        </ModuleCard>
      </section>
    </div>
  );
}
