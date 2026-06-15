import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gift, QrCode, Star } from "lucide-react";
import { clubAccountLoginAction } from "@/app/club/actions";
import { getClubAccountByPhoneAndCode, getPublicBusinessBySlug } from "@/lib/data";
import { formatEventType, formatStatus, formatTransactionType } from "@/lib/formatters";
import { loyaltyTiers } from "@/lib/loyalty";
import { createQrDataUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";

function tierLabel(tier: string) {
  if (tier === "black") return "VIP";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function nextTierInfo(tier: string, points: number) {
  const index = loyaltyTiers.findIndex((item) => item.key === tier);
  const next = loyaltyTiers[index + 1];

  if (!next) {
    return { label: "Ya estas en nivel VIP.", missing: 0, progress: 100 };
  }

  const currentMin = loyaltyTiers[index]?.min ?? 0;
  const span = next.min - currentMin;
  const progress = Math.min(100, Math.max(0, Math.round(((points - currentMin) / span) * 100)));

  return {
    label: `Te faltan ${Math.max(0, next.min - points)} puntos para subir a ${tierLabel(next.key)}.`,
    missing: Math.max(0, next.min - points),
    progress,
  };
}

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
  const secondary = business.brand_secondary_color || "#10b981";

  if (!query.phone || !query.code) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-950 px-5 py-8 text-white">
        <form action={clubAccountLoginAction} className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-6 text-stone-950 shadow-[0_30px_100px_rgba(0,0,0,0.28)]">
          <input type="hidden" name="business_slug" value={business.slug} />
          <Link href={`/club/${business.slug}`} className="text-sm font-semibold text-stone-500 hover:text-stone-950">
            Volver al club
          </Link>
          <h1 className="mt-6 text-3xl font-semibold">Mi Club</h1>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Ingresa con tu telefono y codigo para ver tus puntos, beneficios y QR.
          </p>
          {query.error ? (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {decodeURIComponent(query.error)}
            </p>
          ) : null}
          <input required name="phone" placeholder="Telefono" className="mt-6 h-12 w-full rounded-2xl border border-stone-200 px-4 text-sm outline-none focus:border-stone-400" />
          <input required name="code" placeholder="Codigo de miembro" className="mt-3 h-12 w-full rounded-2xl border border-stone-200 px-4 text-sm uppercase outline-none focus:border-stone-400" />
          <button className="mt-5 h-12 w-full rounded-2xl text-sm font-semibold text-white" style={{ backgroundColor: primary }}>
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
      <main className="flex min-h-screen items-center justify-center bg-stone-950 px-5 py-8 text-white">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-6 text-center text-stone-950 shadow-[0_30px_100px_rgba(0,0,0,0.28)]">
          <h1 className="text-3xl font-semibold">No encontramos tu cuenta</h1>
          <p className="mt-3 text-sm leading-6 text-stone-500">
            Revisa tu telefono y codigo, o registrate de nuevo si aun no eres miembro.
          </p>
          <Link href={`/club/${business.slug}/registro`} className="mt-6 inline-flex h-11 items-center rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white">
            Registrarme
          </Link>
        </div>
      </main>
    );
  }

  const account = data.account ?? { points_balance: 0, tier: "bronze" };
  const points = account.points_balance;
  const tierProgress = nextTierInfo(account.tier, points);
  const nextReward = data.rewards.find((reward) => reward.points_required > points) ?? data.rewards[0];
  const availableRewards = data.rewards.filter((reward) => points >= reward.points_required);
  const rewardProgress = nextReward
    ? Math.min(100, Math.round((points / Math.max(1, nextReward.points_required)) * 100))
    : 0;
  const qrDataUrl = await createQrDataUrl(`${business.slug}:${data.customer.loyalty_code ?? data.customer.id}`);
  const history = [
    ...data.reservations.map((reservation) => ({
      id: `reservation-${reservation.id}`,
      label: "Visita / reserva",
      detail: `${reservation.date} ${reservation.time.slice(0, 5)} · ${formatStatus(reservation.status)}`,
      createdAt: `${reservation.date}T${reservation.time}`,
    })),
    ...data.transactions.map((transaction) => ({
      id: `points-${transaction.id}`,
      label: formatTransactionType(transaction.type),
      detail: `${transaction.points > 0 ? "+" : ""}${transaction.points} puntos${transaction.description ? ` · ${transaction.description}` : ""}`,
      createdAt: transaction.created_at,
    })),
    ...data.events.map((event) => ({
      id: `event-${event.id}`,
      label: formatEventType(event.type),
      detail: event.description ?? event.title,
      createdAt: event.created_at,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <main className="min-h-screen bg-stone-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-5">
        {query.registered ? (
          <p className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Bienvenido. Tu cuenta, tus puntos y tu QR personal ya estan listos.
          </p>
        ) : null}
        {query.existing ? (
          <p className="rounded-2xl border border-sky-300/30 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
            Ya formas parte del club. Te llevamos a tu cuenta.
          </p>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.25)]" style={{ backgroundColor: primary }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/70">{business.name}</p>
                <h1 className="mt-4 text-4xl font-semibold md:text-5xl">Mi Club</h1>
                <p className="mt-3 text-xl font-semibold">{data.customer.full_name}</p>
              </div>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white/15">
                <Star size={21} />
              </span>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-5xl font-semibold">{points}</p>
                <p className="mt-2 text-sm text-white/70">Tus puntos</p>
              </div>
              <div>
                <p className="text-3xl font-semibold">{tierLabel(account.tier)}</p>
                <p className="mt-2 text-sm text-white/70">Tu nivel</p>
              </div>
              <div>
                <p className="text-3xl font-semibold">{availableRewards.length}</p>
                <p className="mt-2 text-sm text-white/70">Beneficios disponibles</p>
              </div>
            </div>
            <div className="mt-8 rounded-3xl bg-white/10 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>{tierProgress.label}</span>
                <span>{tierProgress.progress}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white" style={{ width: `${tierProgress.progress}%` }} />
              </div>
            </div>
            {nextReward ? (
              <div className="mt-4 rounded-3xl bg-white p-4 text-stone-950">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Proximo beneficio</p>
                    <p className="mt-2 text-lg font-semibold">{nextReward.name}</p>
                  </div>
                  <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-semibold text-white">
                    {nextReward.points_required} pts
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full" style={{ width: `${rewardProgress}%`, backgroundColor: secondary }} />
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-950 shadow-[0_30px_100px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-stone-500">QR personal</p>
                <h2 className="mt-2 text-2xl font-semibold">Muestralo al llegar</h2>
              </div>
              <QrCode size={24} className="text-stone-500" />
            </div>
            <Image
              src={qrDataUrl}
              alt="Mi QR personal"
              width={240}
              height={240}
              unoptimized
              className="mx-auto mt-6 size-60 rounded-3xl border border-stone-200 bg-white p-3"
            />
            <p className="mt-5 text-center text-sm leading-6 text-stone-500">
              El staff puede escanearlo para identificarte y registrar tu consumo.
            </p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-950">
            <Gift className="text-stone-500" size={24} />
            <h2 className="mt-5 text-2xl font-semibold">Proximo beneficio</h2>
            {nextReward ? (
              <>
                <p className="mt-3 text-lg font-semibold">{nextReward.name}</p>
                <p className="mt-1 text-sm text-stone-500">
                  {points >= nextReward.points_required
                    ? "Ya puedes pedirlo en tu proxima visita."
                    : `Te faltan ${nextReward.points_required - points} puntos.`}
                </p>
                <div className="mt-4 rounded-2xl bg-stone-100 p-4 text-sm text-stone-600">
                  {nextReward.description ?? `${nextReward.points_required} puntos`}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-stone-500">Pronto apareceran beneficios para canjear.</p>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-950">
            <h2 className="text-2xl font-semibold">Tus beneficios</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {data.rewards.length ? data.rewards.map((reward) => {
                const unlocked = points >= reward.points_required;
                return (
                  <div key={reward.id} className={["rounded-3xl border p-4", unlocked ? "border-emerald-200 bg-emerald-50" : "border-stone-200 bg-stone-50"].join(" ")}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-stone-950">{reward.name}</p>
                      <span className={["rounded-full px-3 py-1 text-xs font-semibold", unlocked ? "bg-emerald-700 text-white" : "bg-white text-stone-500"].join(" ")}>
                        {unlocked ? "Disponible" : `${reward.points_required} pts`}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-stone-500">{reward.points_required} puntos</p>
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                      {unlocked ? "Disponible para canjear." : `Te faltan ${reward.points_required - points} puntos.`}
                    </p>
                    {reward.description ? (
                      <p className="mt-3 text-sm leading-6 text-stone-500">{reward.description}</p>
                    ) : null}
                  </div>
                );
              }) : (
                <p className="text-sm text-stone-500">El restaurante pronto agregara beneficios.</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-950">
          <h2 className="text-2xl font-semibold">Tu historial</h2>
          <p className="mt-2 text-sm text-stone-500">Visitas, consumos, puntos ganados y beneficios canjeados.</p>
          <div className="mt-5 grid gap-3">
            {history.length ? history.slice(0, 18).map((item) => (
              <div key={item.id} className="flex flex-col gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-stone-950">{item.label}</p>
                  <p className="mt-1 text-sm text-stone-600">{item.detail}</p>
                </div>
                <p className="text-xs text-stone-400">{new Date(item.createdAt).toLocaleString("es-MX")}</p>
              </div>
            )) : (
              <p className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-stone-500">
                Tu historial aparecera despues de tu primera visita.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold">Como seguir sumando</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {["Reserva", "Muestra tu QR", "Consume", "Suma puntos", "Regresa por beneficios"].map((step, index) => (
              <div key={step} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <span className="flex size-9 items-center justify-center rounded-2xl text-sm font-semibold text-stone-950" style={{ backgroundColor: secondary }}>
                  {index + 1}
                </span>
                <p className="mt-3 text-sm font-semibold text-white">{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
