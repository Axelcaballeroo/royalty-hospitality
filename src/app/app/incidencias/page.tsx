import Link from "next/link";
import { ModuleCard, SectionHeader, StatCard, StatusBadge } from "@/components/ui";
import { getDailyClosureData, getOperationData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const [closureData, operation] = await Promise.all([
    getDailyClosureData(),
    getOperationData(),
  ]);
  const incidents = closureData.closure?.incidents?.trim();
  const pendingCount = operation.overdueTasks.length + operation.openClockEntries.length + operation.recentNoShows.length;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Operacion"
        title="Incidencias"
        description="Centraliza lo que requiere seguimiento antes del cierre del dia."
        actions={
          <Link href="/app/cierre" className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white">
            Registrar en cierre
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard title="Pendientes" value={String(pendingCount)} detail="Senales operativas" tone="dark" />
        <StatCard title="Tareas vencidas" value={String(operation.overdueTasks.length)} detail="Equipo" />
        <StatCard title="Salidas pendientes" value={String(operation.openClockEntries.length)} detail="Checador" />
        <StatCard title="No-shows" value={String(operation.recentNoShows.length)} detail="Ultimos dias" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ModuleCard title="Incidencias del cierre" description="Notas guardadas por el gerente para la fecha actual.">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
            <p className="text-sm leading-6 text-stone-700">
              {incidents || "Todavia no hay incidencias registradas en el cierre de hoy."}
            </p>
          </div>
        </ModuleCard>

        <ModuleCard title="Seguimientos conectados" description="Alertas que vienen de equipo, reservas y operacion.">
          <div className="grid gap-3">
            {[
              ["Tareas vencidas", operation.overdueTasks.length, "medium"],
              ["Salidas pendientes", operation.openClockEntries.length, "high"],
              ["No-shows recientes", operation.recentNoShows.length, "urgent"],
            ].map(([label, value, status]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <span className="text-sm font-semibold text-stone-800">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-950">{value}</span>
                  <StatusBadge status={String(status)} />
                </div>
              </div>
            ))}
          </div>
        </ModuleCard>
      </section>
    </div>
  );
}
