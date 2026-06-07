import { notFound } from "next/navigation";
import Image from "next/image";
import { clubAccountLoginAction } from "@/app/club/actions";
import { getClubAccountByPhoneAndCode, getPublicBusinessBySlug } from "@/lib/data";
import { createQrDataUrl } from "@/lib/qr";
import { DataTable, EmptyState, ModuleCard, StatusBadge } from "@/components/ui";
import { formatCurrency } from "@/lib/wallet";

export const dynamic = "force-dynamic";

export default async function ClubAccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{
    phone?: string;
    code?: string;
    error?: string;
    registered?: string;
    existing?: string;
  }>;
}) {
  const { businessSlug } = await params;
  const query = await searchParams;
  const publicData = await getPublicBusinessBySlug(businessSlug);

  if (!publicData?.business) {
    notFound();
  }

  const business = publicData.business;
  const primary = business.brand_primary_color || "#1c1917";

  if (!query.phone || !query.code) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5 py-8">
        <form action={clubAccountLoginAction} className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <input type="hidden" name="business_slug" value={business.slug} />
          <h1 className="text-2xl font-semibold text-stone-950">Mi cuenta del club</h1>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Ingresa con tu telefono y codigo de fidelizacion.
          </p>
          {query.error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {decodeURIComponent(query.error)}
            </p>
          ) : null}
          <input required name="phone" placeholder="Telefono" className="mt-6 h-11 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
          <input required name="code" placeholder="Codigo, ej. MART-1938" className="mt-3 h-11 w-full rounded-lg border border-stone-200 px-3 text-sm uppercase outline-none focus:border-stone-400" />
          <button className="mt-5 h-11 w-full rounded-lg text-sm font-medium text-white" style={{ backgroundColor: primary }}>
            Ver mi cuenta
          </button>
        </form>
      </main>
    );
  }

  const data = await getClubAccountByPhoneAndCode({
    businessSlug,
    phone: query.phone,
    code: query.code,
  });

  if (!data?.customer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5 py-8">
        <div className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-stone-950">No encontramos tu cuenta</h1>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Revisa tu telefono y codigo de fidelizacion.
          </p>
        </div>
      </main>
    );
  }

  const account = data.account ?? { points_balance: 0, tier: "bronze" };
  const wallet = data.walletAccount;
  const qrDataUrl = await createQrDataUrl(data.customer.loyalty_code ?? data.customer.id);

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {query.registered ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Registro completado. Bienvenido al club.
          </p>
        ) : null}
        {query.existing ? (
          <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
            Ya formas parte del club.
          </p>
        ) : null}
        <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-lg p-6 text-white shadow-sm" style={{ backgroundColor: primary }}>
            <p className="text-sm text-white/70">{business.name}</p>
            <h1 className="mt-4 text-4xl font-semibold">{data.customer.full_name}</h1>
            <p className="mt-2 text-sm text-white/75">{data.customer.loyalty_code}</p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div>
                <p className="text-4xl font-semibold">{account.points_balance}</p>
                <p className="mt-1 text-sm text-white/70">puntos</p>
              </div>
              <div>
                <StatusBadge status={account.tier} />
              </div>
            </div>
            <div className="mt-6 rounded-lg bg-white/10 p-4">
              <p className="text-sm text-white/70">Saldo wallet</p>
              <p className="mt-2 text-2xl font-semibold">
                {wallet ? formatCurrency(Number(wallet.balance), wallet.currency) : formatCurrency(0)}
              </p>
              <p className="mt-1 text-xs text-white/65">
                Solo consulta. Las recargas son internas por ahora.
              </p>
            </div>
          </div>
          <ModuleCard title="QR personal" description="Muestralo al staff para identificar tu cuenta.">
            <Image
              src={qrDataUrl}
              alt="QR de fidelizacion"
              width={224}
              height={224}
              unoptimized
              className="mx-auto size-56 rounded-lg border border-stone-200 bg-white p-3"
            />
          </ModuleCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ModuleCard title="Recompensas" description="Beneficios activos del negocio.">
            {data.rewards.length ? (
              <div className="grid gap-3">
                {data.rewards.map((reward) => (
                  <div key={reward.id} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                    <p className="text-sm font-semibold text-stone-950">{reward.name}</p>
                    <p className="mt-1 text-xs text-stone-500">{reward.points_required} puntos</p>
                    {reward.description ? <p className="mt-2 text-sm text-stone-600">{reward.description}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Sin recompensas" description="El negocio aun no tiene beneficios activos." />
            )}
          </ModuleCard>
          <ModuleCard title="Historial de puntos" description="Tus ultimos movimientos.">
            {data.transactions.length ? (
              <DataTable
                columns={["Tipo", "Puntos", "Descripcion"]}
                rows={data.transactions.map((transaction) => [
                  <StatusBadge key="type" status={transaction.type} />,
                  String(transaction.points),
                  transaction.description ?? "-",
                ])}
              />
            ) : (
              <EmptyState title="Sin movimientos" description="Tus puntos apareceran cuando registres consumos o visites el negocio." />
            )}
          </ModuleCard>
        </section>

        <ModuleCard title="Historial wallet" description="Movimientos recientes de tu monedero.">
          {data.walletTransactions.length ? (
            <DataTable
              columns={["Tipo", "Monto", "Descripcion"]}
              rows={data.walletTransactions.map((transaction) => [
                <StatusBadge key="type" status={transaction.type} />,
                formatCurrency(Number(transaction.amount), wallet?.currency ?? "MXN"),
                transaction.description ?? "-",
              ])}
            />
          ) : (
            <EmptyState title="Sin movimientos wallet" description="Cuando uses tu monedero, los movimientos apareceran aqui." />
          )}
        </ModuleCard>
      </div>
    </main>
  );
}
