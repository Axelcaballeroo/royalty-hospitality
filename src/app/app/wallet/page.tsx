import { UpgradeModuleScreen } from "@/components/upgrade-module-screen";
import { ModuleCard, StatusBadge } from "@/components/ui";
import { hasModule } from "@/lib/plans";

export default async function WalletPage() {
  if (!(await hasModule("wallet_placeholder"))) {
    return <UpgradeModuleScreen moduleKey="wallet_placeholder" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
          Wallet
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-950">
          Wallet placeholder
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          Modulo preparado para saldos, pagos y beneficios futuros. No hay pagos reales implementados todavia.
        </p>
      </div>
      <ModuleCard title="Proximamente" description="La infraestructura comercial ya reconoce este modulo por plan.">
        <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 p-4">
          <span className="text-sm font-medium text-stone-700">Estado del modulo</span>
          <StatusBadge status="scheduled" />
        </div>
      </ModuleCard>
    </div>
  );
}
