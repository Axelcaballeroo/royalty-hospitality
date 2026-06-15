import Link from "next/link";
import { Bell } from "lucide-react";
import { getAssistantData, type AssistantAlertPriority } from "@/lib/data";
import { EmptyState, ModuleCard, SectionHeader, StatCard, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

const priorityStatus: Record<AssistantAlertPriority, string> = {
  CRITICA: "urgent",
  ALTA: "high",
  MEDIA: "medium",
  BAJA: "low",
};

export default async function AlertsCenterPage() {
  const { current, alerts, counts } = await getAssistantData();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={current.business.name}
        title="Centro de Alertas"
        description="Royalty Assistant consolida inventario, clientes, marketing, operacion y equipo para ayudarte a decidir."
        actions={
          <Link
            href="/app/operacion"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
          >
            Ir al Centro Operativo
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard title="Alertas activas" value={String(counts.total)} detail="Total abierto" tone="dark" />
        <StatCard title="Criticas" value={String(counts.critical)} detail="Resolver primero" />
        <StatCard title="Altas" value={String(counts.high)} detail="Requieren atencion" />
        <StatCard title="Medias y bajas" value={String(counts.medium + counts.low)} detail="Seguimiento" />
      </section>

      <ModuleCard title="Bandeja unificada" description="Cada alerta tiene una accion principal para resolver el siguiente paso.">
        {alerts.length ? (
          <div className="divide-y divide-stone-100">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
                      <Bell size={15} />
                    </span>
                    <p className="text-sm font-semibold text-stone-950">{alert.title}</p>
                    <StatusBadge status={priorityStatus[alert.priority]} />
                    <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-500">
                      {alert.area}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{alert.description}</p>
                  <p className="mt-1 text-xs text-stone-400">{new Date(alert.date).toLocaleString("es-MX")}</p>
                </div>
                <Link
                  href={alert.href}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800"
                >
                  {alert.resolveLabel}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin alertas activas" description="Cuando el sistema detecte oportunidades o riesgos, apareceran aqui." />
        )}
      </ModuleCard>
    </div>
  );
}
