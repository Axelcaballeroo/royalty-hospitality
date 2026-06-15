import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, Gift, MapPin, Menu, Phone, QrCode, Star } from "lucide-react";
import { getPublicBusinessBySlug } from "@/lib/data";

const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

const journeyCards = [
  { title: "Reserva", description: "Elige fecha, hora y personas.", Icon: CalendarCheck },
  { title: "Club", description: "Registrate con telefono y nombre.", Icon: QrCode },
  { title: "Puntos", description: "Suma en cada consumo.", Icon: Star },
  { title: "Beneficios", description: "Canjea y vuelve pronto.", Icon: Gift },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}): Promise<Metadata> {
  const { businessSlug } = await params;
  const data = await getPublicBusinessBySlug(businessSlug);

  if (!data?.business || !data.business.website_enabled) {
    return { title: "Sitio no disponible" };
  }

  return {
    title: `${data.business.name} | Reservas, club y beneficios`,
    description:
      data.business.public_description ??
      `Reserva, unete al club y conoce beneficios de ${data.business.name}.`,
  };
}

export default async function PublicBusinessSitePage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const data = await getPublicBusinessBySlug(businessSlug);

  if (!data?.business || !data.business.website_enabled) {
    notFound();
  }

  const { business, hours } = data;
  const primary = business.brand_primary_color || "#1c1917";
  const secondary = business.brand_secondary_color || "#10b981";
  const location = [business.address, business.city, business.country].filter(Boolean).join(", ");

  return (
    <main className="min-h-screen bg-stone-950 text-white">
      <section
        className="relative px-5 py-5"
        style={{
          backgroundColor: primary,
          backgroundImage: business.cover_url
            ? `linear-gradient(180deg, ${primary}dd, ${primary}f2), url(${business.cover_url})`
            : undefined,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href={`/site/${business.slug}`} className="flex items-center gap-3">
            {business.logo_url ? (
              <span
                role="img"
                aria-label={`${business.name} logo`}
                className="size-11 rounded-2xl border border-white/15 bg-white bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${business.logo_url})` }}
              />
            ) : (
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15 text-sm font-semibold">
                {business.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="text-sm font-semibold">{business.name}</span>
          </Link>
          <Link
            href={`/site/${business.slug}/reservas`}
            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold"
            style={{ color: primary }}
          >
            Reservar
            <CalendarCheck size={16} />
          </Link>
        </nav>

        <div className="mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end pb-10 pt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: secondary }}>
            Reserva, suma puntos y vuelve por beneficios
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight md:text-7xl">
            {business.name}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78">
            {business.public_description ??
              "Reserva tu mesa, unete al club y recibe beneficios pensados para tu proxima visita."}
          </p>
          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            <Link
              href={`/site/${business.slug}/reservas`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold"
              style={{ color: primary }}
            >
              Reservar mesa
              <CalendarCheck size={17} />
            </Link>
            <Link
              href={`/site/${business.slug}/club`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Unirme al club
              <Gift size={17} />
            </Link>
            <Link
              href={`/site/${business.slug}/menu`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Ver menu
              <Menu size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-10 md:grid-cols-4">
        {journeyCards.map(({ title, description, Icon }) => (
          <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <Icon size={22} style={{ color: secondary }} />
            <p className="mt-5 text-sm font-semibold text-white">{title}</p>
            <p className="mt-2 text-sm leading-6 text-stone-400">{description}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-12 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-950">
          <h2 className="text-3xl font-semibold">Tu experiencia empieza aqui.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
            La web conecta tu reserva con el club para que el restaurante pueda reconocerte, darte puntos y ofrecerte beneficios.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link href={`/site/${business.slug}/reservas`} className="rounded-2xl bg-stone-950 px-4 py-3 text-center text-sm font-semibold text-white">
              Reservar
            </Link>
            <Link href={`/site/${business.slug}/club`} className="rounded-2xl border border-stone-200 px-4 py-3 text-center text-sm font-semibold text-stone-800">
              Club
            </Link>
            <Link href={`/site/${business.slug}/menu`} className="rounded-2xl border border-stone-200 px-4 py-3 text-center text-sm font-semibold text-stone-800">
              Menu
            </Link>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Ubicacion y contacto</h2>
            {location ? (
              <p className="mt-4 flex gap-2 text-sm leading-6 text-stone-300">
                <MapPin size={17} style={{ color: secondary }} />
                {location}
              </p>
            ) : null}
            {business.phone ? (
              <p className="mt-3 flex gap-2 text-sm text-stone-300">
                <Phone size={17} style={{ color: secondary }} />
                {business.phone}
              </p>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Horarios</h2>
            <div className="mt-4 space-y-2 text-sm text-stone-300">
              {hours.length ? hours.map((hour) => (
                <p key={hour.day_of_week}>
                  {dayNames[hour.day_of_week]}: {hour.is_closed ? "Cerrado" : `${hour.opens_at} - ${hour.closes_at}`}
                </p>
              )) : <p>Horarios por confirmar.</p>}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
