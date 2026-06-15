import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Megaphone, Package, Users } from "lucide-react";
import { AssistantQuickActions } from "@/components/assistant-quick-actions";
import { getDashboardData } from "@/lib/data";
import { ModuleCard, SectionHeader, StatCard, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("es-MX", {
  currency: "MXN",
  maximumFractionDigits: 0,
  style: "currency",
});

function InsightCard({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warning" | "success" }) {
  const toneClass = {
    neutral: "border-stone-200 bg-white text-stone-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
  };

  return (
    <div className={["rounded-2xl border p-4 text-sm leading-6", toneClass[tone]].join(" ")}>
      {children}
    </div>
  );
}

function RecommendedAction({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_12px_40px_rgba(28,25,23,0.04)] transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_18px_55px_rgba(28,25,23,0.08)]"
    >
      <span>
        <span className="text-sm font-semibold text-stone-950">{title}</span>
        <span className="mt-2 block text-sm leading-6 text-stone-500">{description}</span>
      </span>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-stone-950">
        {action}
        <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function SummaryBlock({
  icon,
  title,
  rows,
  href,
}: {
  icon: ReactNode;
  title: string;
  rows: { label: string; value: string }[];
  href: string;
}) {
  return (
    <ModuleCard title={title} description="Resumen ejecutivo del mes.">
      <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
        {icon}
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 rounded-xl bg-stone-50 px-4 py-3">
            <span className="text-sm text-stone-500">{row.label}</span>
            <span className="text-sm font-semibold text-stone-950">{row.value}</span>
          </div>
        ))}
      </div>
      <Link href={href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-stone-950 hover:underline">
        Ver detalle
        <ArrowRight size={15} />
      </Link>
    </ModuleCard>
  );
}

export default async function DashboardPage() {
  const { current, stats } = await getDashboardData();
  const opportunities =
    stats.inactiveCustomers +
    stats.birthdayCustomers +
    stats.openWasteAlerts +
    stats.urgentBatches;
  const pendingClosures = stats.pendingReservations || stats.openWasteAlerts || stats.pendingTasks ? 1 : 0;
  const customerMomentum =
    stats.customersNew > 0
      ? "Tus clientes activos crecieron este mes."
      : "Aun hay espacio para acelerar nuevos registros de clientes.";
  const salesSignal =
    stats.estimatedSales > 0
      ? "Ya tienes ventas estimadas registradas en cierres del mes."
      : "Los cierres del dia ayudaran a medir ventas con mas claridad.";

  const insights = [
    { text: customerMomentum, tone: stats.customersNew > 0 ? "success" : "neutral" },
    {
      text: stats.openWasteAlerts || stats.urgentBatches
        ? "Hay productos proximos a vencer que pueden convertirse en promocion."
        : "Inventario no muestra perdidas urgentes abiertas.",
      tone: stats.openWasteAlerts || stats.urgentBatches ? "warning" : "success",
    },
    {
      text: stats.inactiveCustomers
        ? `${stats.inactiveCustomers} clientes inactivos pueden recuperarse con una campana.`
        : "La base de clientes no muestra recuperaciones urgentes.",
      tone: stats.inactiveCustomers ? "warning" : "success",
    },
    {
      text: stats.pendingTasks
        ? "El equipo tiene tareas pendientes sin cerrar."
        : "El equipo no tiene tareas internas pendientes relevantes.",
      tone: stats.pendingTasks ? "warning" : "success",
    },
    { text: salesSignal, tone: stats.estimatedSales > 0 ? "success" : "neutral" },
  ] as const;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={current.business.name}
        title="Dashboard ejecutivo"
        description="Vista estrategica de clientes, ventas, operacion y perdidas."
        actions={
          <Link
            href="/app/operacion"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
          >
            Ir al Centro Operativo
          </Link>
        }
      />

      {!current.business.onboarding_completed ? (
        <Link
          href="/app/onboarding"
          className="block rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800 transition hover:border-amber-300"
        >
          Completa la configuracion inicial para que el dashboard lea mejor tu negocio.
        </Link>
      ) : null}

      <AssistantQuickActions compact />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Ventas estimadas" value={currency.format(stats.estimatedSales)} detail="Este mes" tone="dark" />
        <StatCard title="Clientes nuevos" value={String(stats.customersNew)} detail="Este mes" />
        <StatCard title="Reservas completadas" value={String(stats.completedReservations)} detail="Este mes" />
        <StatCard title="Perdida estimada" value={currency.format(stats.estimatedWasteLoss)} detail="En riesgo" />
      </section>

      <ModuleCard title="Royalty Insights" description="Lectura humana para entender donde ganas, donde pierdes y que revisar.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {insights.map((insight) => (
            <InsightCard key={insight.text} tone={insight.tone}>
              {insight.text}
            </InsightCard>
          ))}
        </div>
      </ModuleCard>

      <ModuleCard title="Acciones recomendadas" description="Siguientes pasos claros, sin entrar al detalle operativo diario.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <RecommendedAction
            title="Crear campaña para clientes inactivos"
            description={`${stats.inactiveCustomers} clientes pueden volver con una accion puntual.`}
            href="/app/marketing?segment=inactive_60d"
            action="Crear campaña"
          />
          <RecommendedAction
            title="Revisar productos por vencer"
            description={`${stats.urgentBatches} productos requieren atencion de inventario.`}
            href="/app/inventario?view=vencimientos"
            action="Revisar"
          />
          <RecommendedAction
            title="Revisar cierre del dia"
            description="Confirma ventas, no-shows, cortesias e incidencias."
            href="/app/operacion?tab=cierre"
            action="Abrir cierre"
          />
          <RecommendedAction
            title="Ver desempeño de clientes"
            description="Analiza nuevos, inactivos, puntos y actividad."
            href="/app/clientes"
            action="Ver clientes"
          />
          <RecommendedAction
            title="Ver operacion de hoy"
            description="Entra al flujo diario solo cuando necesites operar."
            href="/app/operacion"
            action="Abrir centro"
          />
        </div>
      </ModuleCard>

      <section className="grid gap-4 xl:grid-cols-4">
        <SummaryBlock
          icon={<Users size={20} />}
          title="Clientes"
          href="/app/clientes"
          rows={[
            { label: "Total clientes", value: String(stats.customersTotal) },
            { label: "Nuevos", value: String(stats.customersNew) },
            { label: "Inactivos", value: String(stats.inactiveCustomers) },
            { label: "Puntos emitidos", value: String(stats.pointsIssued) },
          ]}
        />
        <SummaryBlock
          icon={<BarChart3 size={20} />}
          title="Operacion"
          href="/app/operacion"
          rows={[
            { label: "Reservas hoy", value: String(stats.reservationsToday) },
            { label: "No-shows", value: String(stats.noShows) },
            { label: "Clientes en sala", value: String(stats.customersInRoom) },
            { label: "Cierres pendientes", value: String(pendingClosures) },
          ]}
        />
        <SummaryBlock
          icon={<Package size={20} />}
          title="Inventario"
          href="/app/inventario"
          rows={[
            { label: "Productos activos", value: String(stats.activeInventoryProducts) },
            { label: "Por vencer", value: String(stats.urgentBatches) },
            { label: "Stock bajo", value: String(stats.lowStockItems) },
            { label: "Perdida estimada", value: currency.format(stats.estimatedWasteLoss) },
          ]}
        />
        <SummaryBlock
          icon={<Megaphone size={20} />}
          title="Marketing"
          href="/app/marketing"
          rows={[
            { label: "Campañas enviadas", value: String(stats.campaignsSent) },
            { label: "Oportunidades", value: String(opportunities) },
            { label: "Clientes recuperables", value: String(stats.inactiveCustomers) },
            { label: "Clientes alcanzados", value: String(stats.customersReached) },
          ]}
        />
      </section>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
        <span className="font-semibold text-stone-950">Estado ejecutivo:</span>
        <StatusBadge status={stats.estimatedWasteLoss > 0 || stats.pendingTasks > 0 ? "medium" : "ok"} />
        <span>
          {stats.estimatedWasteLoss > 0 || stats.pendingTasks > 0
            ? "Hay puntos para revisar esta semana."
            : "No hay señales criticas en la lectura ejecutiva."}
        </span>
      </div>
    </div>
  );
}
