import Link from "next/link";
import { getSuperadminDashboardData } from "@/lib/data";
import { ModuleCard, StatCard, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SuperadminPage() {
  const { metrics } = await getSuperadminDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
          Superadmin
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Gestion SaaS
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
          Control manual de negocios, planes, modulos y usuarios. Billing real queda para una fase futura.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Negocios totales" value={String(metrics.totalBusinesses)} detail="Tenants creados" tone="dark" />
        <StatCard title="Negocios activos" value={String(metrics.activeBusinesses)} detail="status active" />
        <StatCard title="Usuarios registrados" value={String(metrics.usersRegistered)} detail="Supabase Auth" />
        <StatCard title="MRR manual" value={`$${metrics.mrrPlaceholder}`} detail="Placeholder sin billing" />
        <StatCard title="Reservas totales" value={String(metrics.totalReservations)} detail="Global" />
        <StatCard title="Clientes totales" value={String(metrics.totalCustomers)} detail="Global" />
        <StatCard title="Plan basic" value={String(metrics.planCounts.basic)} detail="Tenants" />
        <StatCard title="Plan business" value={String(metrics.planCounts.business)} detail="Tenants" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ModuleCard title="Planes" description="Distribucion actual por plan.">
          <div className="grid gap-3">
            {Object.entries(metrics.planCounts).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-3">
                <StatusBadge status={plan} />
                <span className="text-sm font-semibold text-stone-950">{count}</span>
              </div>
            ))}
          </div>
        </ModuleCard>
        <ModuleCard title="Modulos mas usados" description="business_modules habilitados.">
          <div className="grid gap-3">
            {metrics.moduleUsage.map(([moduleKey, count]) => (
              <div key={moduleKey} className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-3">
                <span className="text-sm font-medium text-stone-700">{moduleKey}</span>
                <span className="text-sm font-semibold text-stone-950">{count}</span>
              </div>
            ))}
          </div>
        </ModuleCard>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/superadmin/businesses" className="rounded-lg bg-white px-4 py-3 text-sm font-medium text-stone-950" prefetch={false}>
          Gestionar negocios
        </Link>
        <Link href="/superadmin/plans" className="rounded-lg border border-white/20 px-4 py-3 text-sm font-medium text-white" prefetch={false}>
          Ver planes
        </Link>
      </div>
    </div>
  );
}
