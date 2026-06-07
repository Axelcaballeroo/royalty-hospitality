import { ModuleCard, StatusBadge } from "@/components/ui";
import { moduleCatalog } from "@/lib/plans";

export default function SuperadminModulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">Modulos</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Catalogo modular</h1>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(moduleCatalog).map(([moduleKey, module]) => (
          <ModuleCard key={moduleKey} title={module.name} description={module.description}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-stone-500">{moduleKey}</span>
              <StatusBadge status={module.requiredPlan} />
            </div>
            <div className="mt-4 space-y-2">
              {module.benefits.map((benefit) => (
                <div key={benefit} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                  {benefit}
                </div>
              ))}
            </div>
          </ModuleCard>
        ))}
      </section>
    </div>
  );
}
