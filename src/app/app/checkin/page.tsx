import Image from "next/image";
import Link from "next/link";
import {
  redeemRewardAction,
  registerConsumptionAction,
} from "@/app/app/actions";
import { EmptyState, ModuleCard, SectionHeader, StatusBadge } from "@/components/ui";
import { getCheckInData } from "@/lib/data";
import { createQrDataUrl } from "@/lib/qr";
import { hasModule } from "@/lib/plans";
import { UpgradeModuleScreen } from "@/components/upgrade-module-screen";
import { formatEventType } from "@/lib/formatters";

export const dynamic = "force-dynamic";

type CheckInCustomer = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  loyalty_code: string | null;
  last_visit_at: string | null;
  loyalty_accounts?: { points_balance: number; tier: string }[] | { points_balance: number; tier: string } | null;
  wallet_accounts?: { balance: number; currency: string; status: string }[] | { balance: number; currency: string; status: string } | null;
};

function firstRelation<T>(value: T[] | T | null | undefined, fallback: T) {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default async function StaffCheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string; success?: string }>;
}) {
  const params = await searchParams;

  if (!(await hasModule("loyalty"))) {
    return <UpgradeModuleScreen moduleKey="loyalty" />;
  }

  const { current, customers, rewards } = await getCheckInData(params.q);
  const results = await Promise.all(
    (customers as CheckInCustomer[]).map(async (customer) => {
      const account = firstRelation(customer.loyalty_accounts, { points_balance: 0, tier: "bronze" });

      return {
        customer,
        account,
        qrDataUrl: await createQrDataUrl(`${current.business.slug}:${customer.loyalty_code ?? customer.id}`),
      };
    }),
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Staff"
        title="Check-in de clientes"
        description="Busca al cliente por telefono, codigo de socio o QR para registrar consumos y canjear recompensas."
      />

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

      <ModuleCard title="Buscar cliente" description="Puedes pegar el contenido del QR o buscar por telefono/codigo.">
        <form className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder={`${current.business.slug}:ABC123, telefono o codigo`}
            className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400"
          />
          <button className="h-11 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800">
            Buscar
          </button>
          <button type="button" className="h-11 rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700">
            Escanear QR
          </button>
        </form>
      </ModuleCard>

      {results.length ? (
        <div className="grid gap-4">
          {results.map(({ customer, account, qrDataUrl }) => (
            <section key={customer.id} className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm xl:grid-cols-[0.8fr_0.6fr_1.3fr]">
              <div>
                <p className="text-xl font-semibold text-stone-950">{customer.full_name}</p>
                <p className="mt-1 text-sm text-stone-500">{customer.phone ?? "Sin telefono"}</p>
                <p className="mt-1 text-xs text-stone-500">Codigo de socio: {customer.loyalty_code ?? "-"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge status={account.tier} />
                  <span className="rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-medium text-stone-700">
                    {account.points_balance} puntos
                  </span>
                </div>
                <Link href={`/app/clientes/${customer.id}`} className="mt-4 inline-flex text-sm font-medium text-stone-950 hover:underline">
                  Ver detalle interno
                </Link>
              </div>

              <div className="flex items-center justify-center rounded-lg border border-stone-200 bg-stone-50 p-3">
                <Image
                  src={qrDataUrl}
                  alt={`QR de ${customer.full_name}`}
                  width={144}
                  height={144}
                  unoptimized
                  className="size-36"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <form action={registerConsumptionAction} className="grid gap-3">
                  <input type="hidden" name="customer_id" value={customer.id} />
                  <input type="hidden" name="return_to" value="/app/checkin" />
                  <input required min={1} type="number" name="amount" placeholder="Monto del consumo" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
                  <input name="comment" placeholder="Comentario opcional" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
                  <button className="h-10 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
                    Registrar consumo
                  </button>
                </form>

                <form action={redeemRewardAction} className="grid gap-3">
                  <input type="hidden" name="customer_id" value={customer.id} />
                  <input type="hidden" name="return_to" value="/app/checkin" />
                  <select required name="reward_id" className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
                    <option value="">Recompensa disponible</option>
                    {rewards.map((reward) => (
                      <option key={reward.id} value={reward.id}>
                        {reward.name} - {reward.points_required} puntos
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
        <EmptyState title="Sin cliente seleccionado" description="Busca por telefono, codigo de socio o pega el contenido del QR." />
      )}
    </div>
  );
}
