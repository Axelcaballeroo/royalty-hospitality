import Link from "next/link";
import { Plus, WalletCards } from "lucide-react";
import {
  createWalletAccountAction,
  updateWalletStatusAction,
  walletAdjustmentAction,
  walletPurchaseAction,
  walletTopupAction,
} from "@/app/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { UpgradeModuleScreen } from "@/components/upgrade-module-screen";
import { DataTable, EmptyState, ModuleCard, StatCard, StatusBadge } from "@/components/ui";
import { getWalletData } from "@/lib/data";
import { hasModule } from "@/lib/plans";
import { formatCurrency, walletStatuses } from "@/lib/wallet";
import { formatEventType, formatStatus, formatTransactionType } from "@/lib/formatters";

export const dynamic = "force-dynamic";

const fieldClass =
  "h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400";

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  if (!(await hasModule("wallet_placeholder"))) {
    return <UpgradeModuleScreen moduleKey="wallet_placeholder" />;
  }

  const params = await searchParams;
  const { accounts, transactions, customers, metrics } = await getWalletData();
  const activeAccountsWithBalance = accounts.filter(
    (account) => account.status === "active" && Number(account.balance) > 0,
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
          Wallet
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-950">
          Monedero virtual interno
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          Ledger manual para recargas, bonos, consumos y ajustes. Sin pagos reales ni pasarela conectada.
        </p>
      </div>

      {params.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formatEventType(params.error)}
        </p>
      ) : null}
      {params.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {formatEventType(params.success)}
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Saldo total" value={formatCurrency(metrics.totalBalance)} detail="Wallets del tenant" tone="dark" />
        <StatCard title="Wallets activas" value={String(metrics.activeWallets)} detail="Clientes con monedero" />
        <StatCard title="Recargas mes" value={formatCurrency(metrics.topups)} detail="Topups manuales" />
        <StatCard title="Consumos mes" value={formatCurrency(metrics.purchases)} detail="Consumos registrados" />
        <StatCard title="Bonos mes" value={formatCurrency(metrics.bonuses)} detail="Bonos otorgados" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ModuleCard title="Crear wallet" description="Crea cuenta sin saldo para un cliente.">
          <form action={createWalletAccountAction} className="grid gap-3">
            <select required name="customer_id" className={fieldClass}>
              <option value="">Seleccionar cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name} / {customer.phone ?? customer.email ?? "sin contacto"}
                </option>
              ))}
            </select>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
              <Plus size={16} />
              Crear wallet
            </button>
          </form>
        </ModuleCard>

        <ModuleCard title="Recarga manual" description="Suma saldo y bono opcional con referencia interna.">
          <form action={walletTopupAction} className="grid gap-3">
            <select required name="customer_id" className={fieldClass}>
              <option value="">Seleccionar cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name}
                </option>
              ))}
            </select>
            <div className="grid gap-3 sm:grid-cols-3">
              <input required name="amount" type="number" min="0.01" step="0.01" placeholder="Monto" className={fieldClass} />
              <input name="bonus" type="number" min="0" step="0.01" placeholder="Bono opcional" className={fieldClass} />
              <input name="reference" placeholder="Referencia" className={fieldClass} />
            </div>
            <input name="comment" placeholder="Comentario" className={fieldClass} />
            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
              Registrar recarga
            </button>
          </form>
        </ModuleCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ModuleCard title="Consumo con wallet" description="Resta saldo y suma puntos 1 MXN = 1 punto.">
          <form action={walletPurchaseAction} className="grid gap-3">
            <select required name="customer_id" className={fieldClass}>
              <option value="">Seleccionar cliente</option>
              {activeAccountsWithBalance.map((account) => (
                <option key={account.customer_id} value={account.customer_id}>
                  {account.customers?.full_name ?? "Cliente"} - {formatCurrency(Number(account.balance), account.currency)}
                </option>
              ))}
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input required name="amount" type="number" min="0.01" step="0.01" placeholder="Monto consumido" className={fieldClass} />
              <input name="reference" placeholder="Ticket / referencia" className={fieldClass} />
            </div>
            <input name="comment" placeholder="Comentario" className={fieldClass} />
            <ConfirmSubmitButton
              className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800"
              message="Registrar consumo con wallet?"
            >
              Registrar consumo
            </ConfirmSubmitButton>
          </form>
        </ModuleCard>

        <ModuleCard title="Ajuste manual" description="Suma o resta saldo con motivo obligatorio.">
          <form action={walletAdjustmentAction} className="grid gap-3">
            <select required name="customer_id" className={fieldClass}>
              <option value="">Seleccionar wallet</option>
              {accounts.map((account) => (
                <option key={account.customer_id} value={account.customer_id}>
                  {account.customers?.full_name ?? "Cliente"} - {formatCurrency(Number(account.balance), account.currency)}
                </option>
              ))}
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input required name="amount" type="number" step="0.01" placeholder="Monto (+ o -)" className={fieldClass} />
              <input name="reference" placeholder="Referencia" className={fieldClass} />
            </div>
            <input required name="reason" placeholder="Motivo obligatorio" className={fieldClass} />
            <ConfirmSubmitButton
              className="h-11 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-800 transition hover:border-stone-300"
              message="Aplicar ajuste manual de wallet?"
            >
              Ajustar wallet
            </ConfirmSubmitButton>
          </form>
        </ModuleCard>
      </section>

      <ModuleCard title="Wallets de clientes" description="Saldo, estado, ultima transaccion y acciones.">
        {accounts.length ? (
          <DataTable
            columns={["Cliente", "Saldo", "Estado", "Ultima transaccion", "Acciones"]}
            rows={accounts.map((account) => {
              const lastTransaction = account.wallet_transactions?.[0];
              return [
                account.customers ? (
                  <Link key="customer" href={`/app/clientes/${account.customer_id}`} className="font-medium text-stone-950 hover:underline">
                    {account.customers.full_name}
                  </Link>
                ) : "Cliente",
                formatCurrency(Number(account.balance), account.currency),
                <StatusBadge key="status" status={account.status} />,
                lastTransaction
                  ? `${formatTransactionType(lastTransaction.type)} / ${formatCurrency(Number(lastTransaction.amount), account.currency)}`
                  : "-",
                <form key="status" action={updateWalletStatusAction} className="flex gap-2">
                  <input type="hidden" name="customer_id" value={account.customer_id} />
                  <select name="status" defaultValue={account.status} className="h-9 rounded-lg border border-stone-200 bg-white px-2 text-xs outline-none">
                    {walletStatuses.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                  <button className="h-9 rounded-lg border border-stone-200 px-2 text-xs font-medium text-stone-700">
                    Guardar
                  </button>
                </form>,
              ];
            })}
          />
        ) : (
          <EmptyState title="Sin wallets" description="Crea la primera wallet para operar recargas y consumos internos." />
        )}
      </ModuleCard>

      <ModuleCard title="Movimientos recientes" description="Ledger interno de wallet_transactions.">
        {transactions.length ? (
          <DataTable
            columns={["Cliente", "Tipo", "Monto", "Referencia", "Descripcion"]}
            rows={transactions.map((transaction) => [
              transaction.customers?.full_name ?? "Cliente",
              <StatusBadge key="type" status={transaction.type} />,
              formatCurrency(Number(transaction.amount)),
              transaction.reference ?? "-",
              transaction.description ?? "-",
            ])}
          />
        ) : (
          <EmptyState title="Sin movimientos" description="Las recargas, bonos, consumos y ajustes apareceran aqui." />
        )}
      </ModuleCard>

      <ModuleCard title="Sin pagos reales" description="Esta version es solo registro interno manual.">
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <WalletCards className="text-stone-500" size={18} />
          <p className="mt-3 text-sm leading-6 text-stone-600">
            No se conecta pasarela de pago ni se mueve dinero real automaticamente. Cada movimiento requiere registro manual del equipo.
          </p>
        </div>
      </ModuleCard>
    </div>
  );
}
