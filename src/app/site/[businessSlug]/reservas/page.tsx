import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { createPublicReservationAction } from "@/app/site/actions";
import { getPublicBusinessBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PublicReservationPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { businessSlug } = await params;
  const query = await searchParams;
  const data = await getPublicBusinessBySlug(businessSlug);

  if (!data?.business || !data.business.website_enabled) {
    notFound();
  }

  const business = data.business;
  const primary = business.brand_primary_color || "#1c1917";

  if (!business.reservation_enabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5">
        <div className="max-w-md rounded-lg border border-stone-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-stone-950">Reservas no disponibles</h1>
          <p className="mt-3 text-sm leading-6 text-stone-500">
            Este negocio no tiene reservas publicas activas por el momento.
          </p>
          <Link href={`/site/${business.slug}`} className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-stone-950 px-4 text-sm font-medium text-white">
            Volver al sitio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-lg p-6 text-white shadow-sm" style={{ backgroundColor: primary }}>
          <Link href={`/site/${business.slug}`} className="text-sm font-medium text-white/70">
            Volver a {business.name}
          </Link>
          <h1 className="mt-8 text-4xl font-semibold leading-tight">
            Reserva en {business.name}
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/75">
            Tu solicitud llegara al equipo del restaurante como reserva pendiente y se conectara al CRM.
          </p>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          {query.success ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-center">
              <CalendarCheck className="mx-auto text-emerald-700" size={34} />
              <h2 className="mt-4 text-2xl font-semibold text-stone-950">
                Tu reserva fue recibida.
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                El equipo del restaurante la confirmara pronto.
              </p>
              <Link href={`/site/${business.slug}`} className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-stone-950 px-4 text-sm font-medium text-white">
                Volver al sitio
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-stone-950">Datos de reserva</h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Completa los campos requeridos. Telefono, fecha, hora y personas son obligatorios.
              </p>
              {query.error ? (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {decodeURIComponent(query.error)}
                </p>
              ) : null}
              <form action={createPublicReservationAction} className="mt-6 grid gap-4">
                <input type="hidden" name="business_slug" value={business.slug} />
                <input required name="full_name" placeholder="Nombre completo" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input required name="phone" placeholder="Telefono" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
                  <input type="email" name="email" placeholder="Email opcional" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <input required type="date" name="date" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
                  <input required type="time" name="time" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
                  <input required min={1} type="number" name="party_size" placeholder="Personas" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
                </div>
                <textarea name="special_request" placeholder="Solicitud especial" className="min-h-24 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
                <button className="h-11 rounded-lg text-sm font-medium text-white transition" style={{ backgroundColor: primary }}>
                  Enviar reserva
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
