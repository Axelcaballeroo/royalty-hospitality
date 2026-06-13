import { updateBusinessSettingsAction } from "@/app/app/actions";
import { ModuleCard, SectionHeader, StatCard, StatusBadge } from "@/components/ui";
import { getBusinessSettingsData, getLoyaltyData } from "@/lib/data";
import { formatEventType } from "@/lib/formatters";
import { loyaltyTiers } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

const fieldClass =
  "h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400";

export default async function PointsProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const [{ current, settings }, loyalty] = await Promise.all([
    getBusinessSettingsData(),
    getLoyaltyData(),
  ]);
  const pointsPerCurrency = settings?.points_per_currency ?? 1;
  const pesosPerPoint = pointsPerCurrency > 0 ? 1 / pointsPerCurrency : 10;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Clientes"
        title="Programa de puntos"
        description="Configura una mecanica simple para que cada consumo alimente visitas, historial y recompensas."
      />

      {params.error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formatEventType(params.error)}</p> : null}
      {params.success ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{formatEventType(params.success)}</p> : null}

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Clientes con puntos" value={String(loyalty.summary.registeredCustomers)} detail="Inscritos al programa" tone="dark" />
        <StatCard title="Puntos emitidos" value={String(loyalty.summary.pointsIssued)} detail="Historico acumulado" />
        <StatCard title="Puntos canjeados" value={String(loyalty.summary.pointsRedeemed)} detail="Beneficios usados" />
        <StatCard title="Regla actual" value={`${Math.round(pesosPerPoint)}`} detail="pesos por punto" />
        <StatCard title="Recompensas" value={String(loyalty.rewards.length)} detail="Beneficios configurados" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ModuleCard title="Configuracion del programa" description="Inspirado en programas simples: compra, acumula, vuelve y canjea.">
          <form action={updateBusinessSettingsAction} className="grid gap-3">
            <input type="hidden" name="return_to" value="/app/programa-puntos" />
            <input type="hidden" name="currency" value={settings?.currency ?? "MXN"} />
            <input type="hidden" name="timezone" value={settings?.timezone ?? current.business.timezone} />
            <input type="hidden" name="reservation_interval_minutes" value={settings?.reservation_interval_minutes ?? 30} />
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Nombre del programa
              <input name="program_name" defaultValue={`Club ${current.business.name}`} className={fieldClass} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Pesos por punto
              <input
                required
                name="points_per_currency"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={pointsPerCurrency}
                className={fieldClass}
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Mensaje de bienvenida
              <textarea
                name="welcome_message"
                defaultValue={`Bienvenido al club de ${current.business.name}. Acumula puntos en cada visita y canjea beneficios.`}
                className="min-h-24 rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
              />
            </label>
            <button className="h-11 rounded-xl bg-stone-950 text-sm font-semibold text-white transition hover:bg-stone-800">
              Guardar programa
            </button>
          </form>
        </ModuleCard>

        <ModuleCard title="Niveles del club" description="Los niveles ayudan al equipo a identificar clientes frecuentes.">
          <div className="grid gap-3">
            {loyaltyTiers.slice(0, 3).map((tier) => (
              <div key={tier.key} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <StatusBadge status={tier.key} />
                <span className="text-sm font-semibold text-stone-700">{tier.min}+ puntos</span>
              </div>
            ))}
          </div>
        </ModuleCard>
      </section>
    </div>
  );
}
