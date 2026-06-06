import Link from "next/link";
import {
  adjustLoyaltyPointsAction,
  createRewardAction,
} from "@/app/app/actions";
import { getLoyaltyData } from "@/lib/data";
import { loyaltyTiers } from "@/lib/loyalty";
import { DataTable, EmptyState, ModuleCard, StatCard, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LoyaltyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const { accounts, rewards, transactions, customers } = await getLoyaltyData();
  const totalPoints = accounts.reduce(
    (sum, account) => sum + account.points_balance,
    0,
  );
  const activeRewards = rewards.filter((reward) => reward.status === "active");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
          Fidelizacion
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-950">
          Puntos, niveles y beneficios
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          Programa V1 multi-tenant conectado a clientes, reservas completadas y timeline CRM.
        </p>
      </div>

      {params.error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p> : null}
      {params.success ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{params.success}</p> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Puntos activos" value={String(totalPoints)} detail="Balance total de cuentas" tone="dark" />
        <StatCard title="Clientes con cuenta" value={String(accounts.length)} detail="loyalty_accounts" />
        <StatCard title="Recompensas activas" value={String(activeRewards.length)} detail="Beneficios disponibles" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <ModuleCard title="Clientes con puntos" description="Resumen de loyalty_accounts por cliente.">
          {accounts.length ? (
            <DataTable
              columns={["Cliente", "Telefono", "Puntos", "Nivel"]}
              rows={accounts.map((account) => [
                account.customers ? (
                  <Link key="customer" href={`/app/clientes/${account.customer_id}`} className="font-medium text-stone-950 hover:underline">
                    {account.customers.full_name}
                  </Link>
                ) : "Cliente",
                account.customers?.phone ?? "-",
                String(account.points_balance),
                <StatusBadge key="tier" status={account.tier} />,
              ])}
            />
          ) : (
            <EmptyState title="Sin cuentas de puntos" description="Completa una reserva o ajusta puntos para iniciar una cuenta." />
          )}
        </ModuleCard>

        <ModuleCard title="Niveles" description="Tier automatico segun points_balance.">
          <div className="grid gap-3">
            {loyaltyTiers.map((tier) => (
              <div key={tier.key} className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-3">
                <StatusBadge status={tier.key} />
                <span className="text-sm font-medium text-stone-600">{tier.min}+ puntos</span>
              </div>
            ))}
          </div>
        </ModuleCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <ModuleCard title="Crear recompensa" description="Beneficio canjeable por puntos.">
          <form action={createRewardAction} className="grid gap-3">
            <input required name="name" placeholder="Nombre de recompensa" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <textarea name="description" placeholder="Descripcion" className="min-h-20 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
            <input required min={1} type="number" name="points_required" placeholder="Puntos requeridos" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <select name="status" defaultValue="active" className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
              Crear recompensa
            </button>
          </form>
        </ModuleCard>

        <ModuleCard title="Recompensas" description="Beneficios disponibles o pausados.">
          {rewards.length ? (
            <DataTable
              columns={["Nombre", "Puntos", "Estado", "Descripcion"]}
              rows={rewards.map((reward) => [
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

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <ModuleCard title="Ajustar puntos manualmente" description="Suma o resta puntos con motivo obligatorio.">
          <form action={adjustLoyaltyPointsAction} className="grid gap-3">
            <input type="hidden" name="return_to" value="/app/fidelizacion" />
            <select required name="customer_id" className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
              <option value="">Seleccionar cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name}
                </option>
              ))}
            </select>
            <input required type="number" name="points" placeholder="Puntos (+ o -)" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <input required name="reason" placeholder="Motivo del ajuste" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
              Ajustar puntos
            </button>
          </form>
        </ModuleCard>

        <ModuleCard title="Movimientos recientes" description="Historial de loyalty_transactions.">
          {transactions.length ? (
            <DataTable
              columns={["Cliente", "Tipo", "Puntos", "Descripcion"]}
              rows={transactions.map((transaction) => [
                transaction.customers?.full_name ?? "Cliente",
                <StatusBadge key="type" status={transaction.type} />,
                String(transaction.points),
                transaction.description ?? "-",
              ])}
            />
          ) : (
            <EmptyState title="Sin movimientos" description="Los puntos ganados, ajustes y canjes apareceran aqui." />
          )}
        </ModuleCard>
      </section>
    </div>
  );
}
