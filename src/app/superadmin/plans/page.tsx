import { ModuleCard, StatusBadge } from "@/components/ui";
import { moduleCatalog, planModules, planOrder } from "@/lib/plans";

export default function SuperadminPlansPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">Planes</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Planes comerciales</h1>
      </div>
      <section className="grid gap-4 xl:grid-cols-4">
        {planOrder.map((plan) => (
          <ModuleCard key={plan} title={plan} description="Modulos incluidos por plan.">
            <div className="mb-4">
              <StatusBadge status={plan} />
            </div>
            <div className="space-y-2">
              {planModules[plan].map((moduleKey) => (
                <div key={moduleKey} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                  {moduleCatalog[moduleKey]?.name ?? moduleKey}
                </div>
              ))}
            </div>
          </ModuleCard>
        ))}
      </section>
    </div>
  );
}
