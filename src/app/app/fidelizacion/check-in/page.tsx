import Link from "next/link";
import Image from "next/image";
import {
  redeemRewardAction,
  registerConsumptionAction,
} from "@/app/app/actions";
import { getCheckInData } from "@/lib/data";
import { createQrDataUrl } from "@/lib/qr";
import { EmptyState, ModuleCard, StatusBadge } from "@/components/ui";
import { UpgradeModuleScreen } from "@/components/upgrade-module-screen";
import { hasModule } from "@/lib/plans";

export const dynamic = "force-dynamic";

type CheckInCustomer = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  loyalty_code: string | null;
  last_visit_at: string | null;
  loyalty_accounts?: { points_balance: number; tier: string }[] | { points_balance: number; tier: string } | null;
};

function getAccount(customer: CheckInCustomer) {
  if (Array.isArray(customer.loyalty_accounts)) {
    return customer.loyalty_accounts[0] ?? { points_balance: 0, tier: "bronze" };
  }

  return customer.loyalty_accounts ?? { points_balance: 0, tier: "bronze" };
}

export default async function LoyaltyCheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string; success?: string }>;
}) {
  const params = await searchParams;
  if (!(await hasModule("loyalty"))) {
    return <UpgradeModuleScreen moduleKey="loyalty" />;
  }

  const { customers, rewards } = await getCheckInData(params.q);
  const customersWithQr = await Promise.all(
    (customers as CheckInCustomer[]).map(async (customer) => ({
      customer,
      account: getAccount(customer),
      qrDataUrl: await createQrDataUrl(customer.loyalty_code ?? customer.id),
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/fidelizacion" className="text-sm font-medium text-stone-500 hover:text-stone-950" prefetch={false}>
          Volver a fidelizacion
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-stone-950">
          Check-in de fidelizacion
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          Busca por telefono, nombre o codigo para identificar clientes, registrar consumo y canjear recompensas.
        </p>
      </div>

      {params.error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p> : null}
      {params.success ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{params.success}</p> : null}

      <ModuleCard title="Busqueda rapida" description="Telefono, nombre o loyalty_code.">
        <form className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Buscar cliente"
            className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400"
          />
          <button className="h-11 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800">
            Buscar
          </button>
        </form>
      </ModuleCard>

      {customersWithQr.length ? (
        <div className="grid gap-4">
          {customersWithQr.map(({ customer, account, qrDataUrl }) => (
            <section key={customer.id} className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm xl:grid-cols-[0.8fr_0.7fr_1.3fr]">
              <div>
                <p className="text-lg font-semibold text-stone-950">{customer.full_name}</p>
                <p className="mt-1 text-sm text-stone-500">{customer.phone ?? "Sin telefono"}</p>
                <p className="mt-1 text-xs text-stone-500">{customer.loyalty_code ?? "Sin codigo"}</p>
                <div className="mt-4 flex gap-2">
                  <StatusBadge status={account.tier} />
                  <span className="rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-medium text-stone-700">
                    {account.points_balance} pts
                  </span>
                </div>
                <p className="mt-4 text-xs text-stone-500">
                  Ultima visita: {customer.last_visit_at ? new Date(customer.last_visit_at).toLocaleDateString("es-MX") : "-"}
                </p>
              </div>

              <div className="flex items-center justify-center rounded-lg border border-stone-200 bg-stone-50 p-3">
                <Image
                  src={qrDataUrl}
                  alt={`QR ${customer.full_name}`}
                  width={160}
                  height={160}
                  unoptimized
                  className="size-40"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <form action={registerConsumptionAction} className="grid gap-3">
                  <input type="hidden" name="customer_id" value={customer.id} />
                  <input type="hidden" name="return_to" value="/app/fidelizacion/check-in" />
                  <input required min={1} type="number" name="amount" placeholder="Monto consumido" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
                  <input name="comment" placeholder="Comentario opcional" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
                  <button className="h-10 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
                    Registrar consumo
                  </button>
                </form>

                <form action={redeemRewardAction} className="grid gap-3">
                  <input type="hidden" name="customer_id" value={customer.id} />
                  <input type="hidden" name="return_to" value="/app/fidelizacion/check-in" />
                  <select required name="reward_id" className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
                    <option value="">Recompensa</option>
                    {rewards.map((reward) => (
                      <option key={reward.id} value={reward.id}>
                        {reward.name} - {reward.points_required} pts
                      </option>
                    ))}
                  </select>
                  <button className="h-10 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-800 transition hover:border-stone-300">
                    Canjear recompensa
                  </button>
                </form>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin clientes encontrados" description="Busca por telefono, nombre o codigo para iniciar check-in." />
      )}
    </div>
  );
}
