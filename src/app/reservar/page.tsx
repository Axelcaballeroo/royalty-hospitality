import Link from "next/link";
import { CalendarCheck, CalendarDays, Gift } from "lucide-react";
import { createPublicReservationAction } from "@/app/site/actions";
import { getDefaultPublicReservationData } from "@/lib/data";
import { formatEventType } from "@/lib/formatters";

export const dynamic = "force-dynamic";

const fieldClass =
  "h-12 rounded-2xl border border-stone-200 px-4 text-sm outline-none focus:border-stone-400";

export default async function ReservationLandingPage({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string;
    date?: string;
    error?: string;
    party_size?: string;
    phone?: string;
    success?: string;
  }>;
}) {
  const query = await searchParams;
  const selectedDate = query.date ?? new Date().toISOString().slice(0, 10);
  const partySize = Number(query.party_size ?? 2);
  const data = await getDefaultPublicReservationData({
    date: selectedDate,
    partySize: Number.isFinite(partySize) && partySize > 0 ? partySize : 2,
  });

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5">
        <section className="max-w-md rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
          <CalendarDays className="mx-auto text-stone-400" size={34} />
          <h1 className="mt-4 text-2xl font-semibold text-stone-950">Reservas no disponibles</h1>
          <p className="mt-3 text-sm leading-6 text-stone-500">
            Todavia no hay un restaurante activo con reservas publicas.
          </p>
        </section>
      </main>
    );
  }

  const { business, slots } = data;
  const primary = business.brand_primary_color || "#1c1917";

  return (
    <main className="min-h-screen bg-stone-950 px-5 py-8 text-white">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-[2rem] p-6 text-white shadow-[0_30px_100px_rgba(0,0,0,0.25)]" style={{ backgroundColor: primary }}>
          <p className="text-sm font-medium text-white/70">Reservas</p>
          <h1 className="mt-8 text-4xl font-semibold leading-tight">
            Reserva en {business.name}
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/75">
            Elige un horario disponible. Si ya eres cliente, asociaremos tu reserva automaticamente con tu perfil.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/75">
            <p>Horario automatico por disponibilidad</p>
            <p>Cliente existente por telefono</p>
            <p>Cliente nuevo creado al reservar</p>
            <p>Check-in preparado para el restaurante</p>
          </div>
          <Link href={`/site/${business.slug}`} className="mt-8 inline-flex h-11 items-center rounded-2xl border border-white/30 px-4 text-sm font-semibold text-white">
            Ver restaurante
          </Link>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-950 shadow-[0_30px_100px_rgba(0,0,0,0.25)]">
          {query.success ? (
            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-center">
              <CalendarCheck className="mx-auto text-emerald-700" size={34} />
              <h2 className="mt-4 text-2xl font-semibold text-stone-950">
                Tu reserva fue recibida.
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                El equipo del restaurante la confirmara pronto.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {query.phone && query.code ? (
                  <Link
                    href={`/site/${business.slug}/mi-club?phone=${encodeURIComponent(query.phone)}&code=${encodeURIComponent(query.code)}`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 text-sm font-semibold text-white"
                  >
                    Ver Mi Club
                    <Gift size={16} />
                  </Link>
                ) : null}
                <Link href="/reservar" className="inline-flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800">
                  Nueva reserva
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-stone-950">Datos de reserva</h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Selecciona fecha, personas y uno de los horarios disponibles.
              </p>
              {query.error ? (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formatEventType(query.error)}
                </p>
              ) : null}

              <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <input type="date" name="date" defaultValue={selectedDate} className={fieldClass} />
                <input min={1} type="number" name="party_size" defaultValue={Number.isFinite(partySize) && partySize > 0 ? partySize : 2} className={fieldClass} />
                <button className="h-12 rounded-2xl bg-stone-950 px-4 text-sm font-semibold text-white">
                  Buscar
                </button>
              </form>

              <form action={createPublicReservationAction} className="mt-6 grid gap-4">
                <input type="hidden" name="business_slug" value={business.slug} />
                <input type="hidden" name="return_to" value="/reservar" />
                <input required name="full_name" placeholder="Nombre" className={fieldClass} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input required name="phone" placeholder="Telefono" className={fieldClass} />
                  <input type="email" name="email" placeholder="Email opcional" className={fieldClass} />
                </div>
                <input type="hidden" name="date" value={selectedDate} />
                <input type="hidden" name="party_size" value={Number.isFinite(partySize) && partySize > 0 ? partySize : 2} />
                <select required name="time" className={fieldClass}>
                  <option value="">Horario disponible</option>
                  {slots.map((slot) => (
                    <option key={slot.time} value={slot.time} disabled={!slot.available}>
                      {slot.label}
                    </option>
                  ))}
                </select>
                <textarea name="special_request" placeholder="Notas" className="min-h-24 rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-400" />
                <button className="h-12 rounded-2xl text-sm font-semibold text-white transition" style={{ backgroundColor: primary }}>
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
