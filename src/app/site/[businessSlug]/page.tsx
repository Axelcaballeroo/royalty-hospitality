import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, Image as ImageIcon, MapPin, MessageCircle, Phone } from "lucide-react";
import { getPublicBusinessBySlug } from "@/lib/data";

const experienceItems = ["Menu", "Eventos", "Promociones", "Galeria"];
const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}): Promise<Metadata> {
  const { businessSlug } = await params;
  const data = await getPublicBusinessBySlug(businessSlug);

  if (!data?.business || !data.business.website_enabled) {
    return {
      title: "Sitio no disponible",
    };
  }

  return {
    title: `${data.business.name} | Reservas y experiencia`,
    description:
      data.business.public_description ??
      `Reserva y conoce la experiencia de ${data.business.name}.`,
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
  const location = [business.address, business.city, business.country]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="min-h-screen bg-stone-50 text-stone-950">
      <section
        className="relative min-h-[82vh] px-5 py-5 text-white"
        style={{
          backgroundColor: primary,
          backgroundImage: business.cover_url
            ? `linear-gradient(90deg, ${primary}ee, ${primary}99), url(${business.cover_url})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            {business.logo_url ? (
              <span
                role="img"
                aria-label={`${business.name} logo`}
                className="size-11 rounded-lg bg-cover bg-center"
                style={{ backgroundImage: `url(${business.logo_url})` }}
              />
            ) : (
              <span className="flex size-11 items-center justify-center rounded-lg bg-white/15 text-sm font-semibold">
                {business.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="text-sm font-semibold">{business.name}</span>
          </div>
          <Link
            href={`/site/${business.slug}/reservas`}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium"
            style={{ color: primary }}
          >
            Reservar
            <CalendarCheck size={16} />
          </Link>
        </nav>

        <div className="mx-auto flex min-h-[68vh] max-w-6xl flex-col justify-end pb-10 pt-24">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/70">
            {business.type ?? "Hospitality"}
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight md:text-7xl">
            {business.name}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78">
            {business.public_description ??
              "Una experiencia creada para recibirte con hospitalidad, detalle y buena energia."}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/site/${business.slug}/reservas`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-medium"
              style={{ color: primary }}
            >
              Reservar ahora
              <CalendarCheck size={17} />
            </Link>
            {business.whatsapp_url ? (
              <a
                href={business.whatsapp_url}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/30 px-5 text-sm font-medium text-white"
              >
                Contactar
                <MessageCircle size={17} />
              </a>
            ) : business.phone ? (
              <a
                href={`tel:${business.phone}`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/30 px-5 text-sm font-medium text-white"
              >
                Contactar
                <Phone size={17} />
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-10 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Experiencia</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {experienceItems.map((item) => (
              <div key={item} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <ImageIcon size={18} style={{ color: secondary }} />
                <p className="mt-4 text-sm font-semibold">{item}</p>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  Seccion preparada para contenido publico del negocio.
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Ubicacion y contacto</h2>
            {location ? (
              <p className="mt-4 flex gap-2 text-sm leading-6 text-stone-600">
                <MapPin size={17} style={{ color: secondary }} />
                {location}
              </p>
            ) : null}
            {business.phone ? (
              <p className="mt-3 flex gap-2 text-sm text-stone-600">
                <Phone size={17} style={{ color: secondary }} />
                {business.phone}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {business.instagram_url ? <a className="rounded-lg border border-stone-200 px-3 py-2 text-sm" href={business.instagram_url}>Instagram</a> : null}
              {business.facebook_url ? <a className="rounded-lg border border-stone-200 px-3 py-2 text-sm" href={business.facebook_url}>Facebook</a> : null}
              {business.whatsapp_url ? <a className="rounded-lg border border-stone-200 px-3 py-2 text-sm" href={business.whatsapp_url}>WhatsApp</a> : null}
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Horarios</h2>
            <div className="mt-4 space-y-2 text-sm text-stone-600">
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
