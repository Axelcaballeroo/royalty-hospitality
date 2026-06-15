import Link from "next/link";
import { Download, TrendingUp } from "lucide-react";
import { UpgradeModuleScreen } from "@/components/upgrade-module-screen";
import { DataTable, ModuleCard, StatCard, StatusBadge } from "@/components/ui";
import { getExecutiveReportsData, type ReportPeriod } from "@/lib/data";
import { hasAnyModule } from "@/lib/plans";

export const dynamic = "force-dynamic";

const periods: { key: ReportPeriod; label: string }[] = [
  { key: "today", label: "Hoy" },
  { key: "7d", label: "Ultimos 7 dias" },
  { key: "month", label: "Este mes" },
  { key: "90d", label: "Ultimos 90 dias" },
];

const currency = new Intl.NumberFormat("es-MX", {
  currency: "MXN",
  style: "currency",
});

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: ReportPeriod }>;
}) {
  if (!(await hasAnyModule(["reports_basic", "reports_advanced"]))) {
    return <UpgradeModuleScreen moduleKey="reports_basic" />;
  }

  const params = await searchParams;
  const period = periods.some((item) => item.key === params.period)
    ? params.period ?? "month"
    : "month";
  const { metrics, summary, range } = await getExecutiveReportsData(period);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
            Reportes
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-950">
            Reportes ejecutivos
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            Lectura de todos los modulos del negocio activo, lista para decisiones ejecutivas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/app/reportes/export?type=report&period=${period}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800" prefetch={false}>
            <Download size={16} />
            Exportar CSV
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap gap-2">
        {periods.map((item) => (
          <button
            key={item.key}
            name="period"
            value={item.key}
            className={[
              "h-10 rounded-lg border px-4 text-sm font-medium transition",
              period === item.key
                ? "border-stone-950 bg-stone-950 text-white"
                : "border-stone-200 bg-white text-stone-700 hover:border-stone-300",
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
      </form>

      <ModuleCard title="Resumen del negocio" description={`${range.startDate} a ${range.endDate}`}>
        <div className="grid gap-3 md:grid-cols-2">
          {summary.map((sentence) => (
            <div key={sentence} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <TrendingUp className="text-stone-500" size={18} />
              <p className="mt-3 text-sm leading-6 text-stone-700">{sentence}</p>
            </div>
          ))}
        </div>
      </ModuleCard>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Reservas" value={String(metrics.reservations.total)} detail="Total periodo" tone="dark" />
        <StatCard title="Clientes nuevos" value={String(metrics.customers.new)} detail="CRM" />
        <StatCard title="Campanas enviadas" value={String(metrics.marketing.campaignsSent)} detail="Marketing" />
        <StatCard title="Puntos emitidos" value={String(metrics.loyalty.pointsIssued)} detail="Fidelizacion" />
        <StatCard title="Merma estimada" value={currency.format(metrics.inventory.estimatedWaste)} detail="Alertas abiertas" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ModuleCard title="Reservas" description="Estados principales del periodo.">
          <DataTable
            columns={["Metrica", "Valor"]}
            rows={[
              ["Total reservas", metrics.reservations.total],
              ["Confirmadas", metrics.reservations.confirmed],
              ["Completadas", metrics.reservations.completed],
              ["Canceladas", metrics.reservations.cancelled],
              ["No-shows", metrics.reservations.noShows],
            ].map(([label, value]) => [label, String(value)])}
          />
        </ModuleCard>

        <ModuleCard title="Clientes" description="Crecimiento y salud del CRM.">
          <DataTable
            columns={["Metrica", "Valor"]}
            rows={[
              ["Clientes nuevos", metrics.customers.new],
              ["Clientes recurrentes", metrics.customers.recurring],
              ["Clientes inactivos", metrics.customers.inactive],
              ["Clientes VIP", metrics.customers.vip],
            ].map(([label, value]) => [label, String(value)])}
          />
        </ModuleCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ModuleCard title="Fidelizacion" description="Puntos, canjes y niveles.">
          <DataTable
            columns={["Metrica", "Valor"]}
            rows={[
              ["Puntos emitidos", metrics.loyalty.pointsIssued],
              ["Puntos canjeados", metrics.loyalty.pointsRedeemed],
              ["Recompensas canjeadas", metrics.loyalty.rewardsRedeemed],
              ["Bronze", metrics.loyalty.tiers.bronze],
              ["Silver", metrics.loyalty.tiers.silver],
              ["Gold", metrics.loyalty.tiers.gold],
              ["Black", metrics.loyalty.tiers.black],
            ].map(([label, value]) => [label, String(value)])}
          />
        </ModuleCard>

        <ModuleCard title="Marketing" description="Campanas y tasa simulada de canje.">
          <DataTable
            columns={["Metrica", "Valor"]}
            rows={[
              ["Campanas enviadas", metrics.marketing.campaignsSent],
              ["Clientes alcanzados", metrics.marketing.customersReached],
              ["Campanas canjeadas", metrics.marketing.campaignsRedeemed],
              ["Tasa simulada de canje", `${metrics.marketing.redemptionRate}%`],
            ].map(([label, value]) => [label, String(value)])}
          />
        </ModuleCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ModuleCard title="Inventario y merma" description="Riesgo operativo y movimientos.">
          <DataTable
            columns={["Metrica", "Valor"]}
            rows={[
              ["Alertas abiertas", metrics.inventory.openAlerts],
              ["Alertas urgentes", metrics.inventory.urgentAlerts],
              ["Merma estimada", currency.format(metrics.inventory.estimatedWaste)],
              ["Movimientos de merma", metrics.inventory.wasteMovements],
            ].map(([label, value]) => [label, String(value)])}
          />
        </ModuleCard>

        <ModuleCard title="RRHH" description="Equipo, turnos y checadas.">
          <DataTable
            columns={["Metrica", "Valor"]}
            rows={[
              ["Empleados activos", metrics.hr.activeEmployees],
              ["Turnos completados", metrics.hr.completedShifts],
              ["Entradas registradas", metrics.hr.clockEntries],
              ["Salidas pendientes", metrics.hr.pendingClockOuts],
            ].map(([label, value]) => [label, String(value)])}
          />
        </ModuleCard>
      </section>

      <ModuleCard title="Exportaciones" description="CSV simple para analisis externo.">
        <div className="flex flex-wrap gap-3">
          {[
            ["Clientes", "customers"],
            ["Reservas", "reservations"],
            ["Reporte basico", "report"],
          ].map(([label, type]) => (
            <Link
              key={type}
              href={`/app/reportes/export?type=${type}&period=${period}`}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-800 transition hover:border-stone-300" prefetch={false}>
              <Download size={15} />
              {label}
            </Link>
          ))}
        </div>
      </ModuleCard>

      <div className="flex gap-2">
        <StatusBadge status="basic" />
        <StatusBadge status="business" />
      </div>
    </div>
  );
}
