import { createRewardAction } from "@/app/app/actions";
import { DataTable, EmptyState, ModuleCard, SectionHeader, StatCard, StatusBadge } from "@/components/ui";
import { getLoyaltyData } from "@/lib/data";
import { formatEventType } from "@/lib/formatters";

export const dynamic = "force-dynamic";

const examples = [
  ["Postre gratis", "120"],
  ["Bebida gratis", "150"],
  ["Descuento 10%", "250"],
  ["Entrada VIP", "500"],
];

export default async function RewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const data = await getLoyaltyData();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Clientes"
        title="Recompensas"
        description="Define beneficios concretos para que el programa de puntos se convierta en visitas repetidas."
      />

      {params.error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formatEventType(params.error)}</p> : null}
      {params.success ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{formatEventType(params.success)}</p> : null}

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard title="Recompensas" value={String(data.rewards.length)} detail="Configuradas" tone="dark" />
        <StatCard title="Activas" value={String(data.rewards.filter((reward) => reward.status === "active").length)} detail="Disponibles para canje" />
        <StatCard title="Puntos canjeados" value={String(data.summary.pointsRedeemed)} detail="Historico" />
        <StatCard title="Clientes con puntos" value={String(data.summary.registeredCustomers)} detail="Pueden volver" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <ModuleCard title="Crear recompensa" description="Ejemplos recomendados: postre gratis, bebida gratis, descuento 10% o entrada VIP.">
          <form action={createRewardAction} className="grid gap-3">
            <input type="hidden" name="return_to" value="/app/recompensas" />
            <input required name="name" placeholder="Nombre de recompensa" className="h-11 rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <textarea name="description" placeholder="Descripcion para el equipo" className="min-h-20 rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
            <input required min={1} type="number" name="points_required" placeholder="Puntos requeridos" className="h-11 rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <select name="status" defaultValue="active" className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
              <option value="active">activa</option>
              <option value="inactive">inactiva</option>
            </select>
            <button className="h-11 rounded-xl bg-stone-950 text-sm font-semibold text-white transition hover:bg-stone-800">
              Crear recompensa
            </button>
          </form>
        </ModuleCard>

        <ModuleCard title="Recompensas actuales" description="Beneficios disponibles para el club de clientes.">
          {data.rewards.length ? (
            <DataTable
              columns={["Nombre", "Puntos", "Estado", "Descripcion"]}
              rows={data.rewards.map((reward) => [
                reward.name,
                String(reward.points_required),
                <StatusBadge key="status" status={reward.status} />,
                reward.description ?? "-",
              ])}
            />
          ) : (
            <EmptyState title="Sin recompensas" description="Crea el primer beneficio para activar canjes." />
          )}
        </ModuleCard>
      </section>

      <ModuleCard title="Ideas listas" description="Usa estas recompensas como base para lanzar el MVP.">
        <div className="grid gap-3 md:grid-cols-4">
          {examples.map(([name, points]) => (
            <div key={name} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-stone-950">{name}</p>
              <p className="mt-2 text-sm text-stone-500">{points} puntos sugeridos</p>
            </div>
          ))}
        </div>
      </ModuleCard>
    </div>
  );
}
