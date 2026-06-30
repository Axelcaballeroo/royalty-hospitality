import Link from "next/link";
import { Clock, Plus, UserRound, X } from "lucide-react";
import { createReservationAction } from "@/app/app/actions";
import { EmptyState, ModuleCard, SectionHeader, StatCard } from "@/components/ui";
import { ReservationPosActions } from "@/components/reservation-pos-actions";
import { getReservationsData } from "@/lib/data";
import { formatEventType } from "@/lib/formatters";

export const dynamic = "force-dynamic";

const fieldClass =
  "h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400";

const statusLabels: Record<string, string> = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No Show",
};

const statusStyles: Record<string, string> = {
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  completed: "border-stone-900 bg-stone-950 text-white",
  cancelled: "border-red-200 bg-red-50 text-red-700",
  no_show: "border-rose-200 bg-rose-50 text-rose-700",
};

function reservationHref(date: string, id: string) {
  return `/app/reservas?date=${date}&selected=${id}`;
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={[
        "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-semibold",
        statusStyles[status] ?? "border-stone-200 bg-stone-50 text-stone-600",
      ].join(" ")}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

function NewReservationModal({
  customers,
  date,
  defaultTime,
  slots,
}: {
  customers: Awaited<ReturnType<typeof getReservationsData>>["customers"];
  date: string;
  defaultTime: string;
  slots: Awaited<ReturnType<typeof getReservationsData>>["slots"];
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-reservation-title"
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_30px_100px_rgba(28,25,23,0.28)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Nueva Reserva
            </p>
            <h2 id="new-reservation-title" className="mt-2 text-2xl font-semibold text-stone-950">
              Captura rapida
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              Elige horario, personas y cliente. Si el telefono o email ya existe, se asocia automaticamente.
            </p>
          </div>
          <Link
            href={`/app/reservas?date=${date}`}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:text-stone-950"
            aria-label="Cerrar"
            prefetch={false}
          >
            <X size={18} />
          </Link>
        </div>

        <form action={createReservationAction} className="mt-5 grid gap-4">
          <input type="hidden" name="return_to" value={`/app/reservas?date=${date}`} />
          <input type="hidden" name="source" value="manual" />

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_9rem]">
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
              Fecha
              <input required type="date" name="date" defaultValue={date} className={fieldClass} />
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
              Hora
              <select required name="time" defaultValue={defaultTime} className={fieldClass}>
                <option value="">Horario</option>
                {slots.map((slot) => (
                  <option key={slot.time} value={slot.time} disabled={!slot.available}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
              Personas
              <input required min={1} type="number" name="party_size" defaultValue={2} className={fieldClass} />
            </label>
          </div>

          <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
            Cliente existente
            <select name="customer_id" className={fieldClass}>
              <option value="">Crear o asociar por telefono/email</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name} {customer.phone ? `- ${customer.phone}` : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-3">
            <input
              autoFocus
              name="quick_customer_name"
              placeholder="Nombre"
              className={fieldClass}
            />
            <input name="quick_customer_phone" placeholder="Telefono" className={fieldClass} />
            <input type="email" name="quick_customer_email" placeholder="Email" className={fieldClass} />
          </div>

          <details className="rounded-2xl border border-stone-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-stone-950">
              Notas opcionales
            </summary>
            <div className="mt-4 grid gap-3">
              <input name="special_request" placeholder="Solicitud especial" className={fieldClass} />
              <textarea name="notes" placeholder="Notas internas" className="min-h-20 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
            </div>
          </details>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link
              href={`/app/reservas?date=${date}`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-800"
              prefetch={false}
            >
              Cancelar
            </Link>
            <button className="inline-flex h-11 items-center justify-center rounded-xl bg-stone-950 px-5 text-sm font-semibold text-white">
              Crear reserva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    error?: string;
    new?: string;
    selected?: string;
    slot?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;
  const selectedDate = params.date ?? new Date().toISOString().slice(0, 10);
  const data = await getReservationsData({ date: selectedDate });
  const selectedReservation =
    data.reservations.find((reservation) => reservation.id === params.selected) ??
    data.reservations[0] ??
    null;
  const showNewReservation = params.new === "1";
  const defaultReservationTime =
    data.slots.find((slot) => slot.time === params.slot && slot.available)?.time ??
    data.slots.find((slot) => slot.available)?.time ??
    "";
  const returnTo = selectedReservation
    ? reservationHref(selectedDate, selectedReservation.id)
    : `/app/reservas?date=${selectedDate}`;
  const completedReservations = data.reservations.filter(
    (reservation) => reservation.status === "completed",
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={data.current.business.name}
        title="Reservas"
        description="Centro operativo de agenda: disponibilidad, mesas, estados y preparacion para check-in hacia POS."
        actions={
          <Link
            href={`/app/reservas?date=${selectedDate}&new=1`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
            prefetch={false}
          >
            <Plus size={16} />
            Nueva Reserva
          </Link>
        }
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

      {showNewReservation ? (
        <NewReservationModal
          customers={data.customers}
          date={selectedDate}
          defaultTime={defaultReservationTime}
          slots={data.slots}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard title="Reservas" value={String(data.reservations.length)} detail={selectedDate} tone="dark" />
        <StatCard title="Confirmadas" value={String(data.reservations.filter((item) => item.status === "confirmed").length)} detail="Listas para servicio" />
        <StatCard title="Completadas" value={String(completedReservations.length)} detail="Visitas cerradas en POS" />
        <StatCard title="Mesas activas" value={String(data.tables.filter((table) => table.is_active).length || 12)} detail="Disponibilidad automatica" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-6">
          <ModuleCard title="Calendario de reservas" description="Vista por horario con mesa sugerida y estado operativo.">
            <form className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="grid gap-1 text-sm font-semibold text-stone-700">
                Fecha
                <input type="date" name="date" defaultValue={selectedDate} className={fieldClass} />
              </label>
              <button className="h-11 rounded-lg bg-stone-950 px-4 text-sm font-semibold text-white">
                Ver dia
              </button>
            </form>

            <div className="overflow-hidden rounded-2xl border border-stone-200">
              <div className="grid grid-cols-[5.5rem_1fr] border-b border-stone-200 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                <span>Hora</span>
                <span>Reservas</span>
              </div>
              <div className="divide-y divide-stone-100 bg-white">
                {data.slots.length ? data.slots.map((slot) => {
                  const slotReservations = data.reservations.filter(
                    (reservation) => reservation.time.slice(0, 5) === slot.time,
                  );

                  return (
                    <div key={slot.time} className="grid min-h-20 grid-cols-[5.5rem_1fr] gap-4 px-4 py-4">
                      <div className="flex items-start gap-2 text-sm font-semibold text-stone-950">
                        <Clock size={15} className="mt-0.5 text-stone-400" />
                        {slot.time}
                      </div>
                      <div className="grid gap-3">
                        {slotReservations.length ? slotReservations.map((reservation) => (
                          <Link
                            key={reservation.id}
                            href={reservationHref(selectedDate, reservation.id)}
                            className={[
                              "grid gap-3 rounded-xl border p-4 transition hover:border-stone-400 md:grid-cols-[1fr_auto_auto]",
                              selectedReservation?.id === reservation.id
                                ? "border-stone-900 bg-stone-50"
                                : "border-stone-200 bg-white",
                            ].join(" ")}
                            prefetch={false}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-stone-950">
                                {reservation.customers?.full_name ?? "Cliente"}
                              </p>
                              <p className="mt-1 text-xs text-stone-500">
                                {reservation.party_size} personas / {reservation.source}
                              </p>
                            </div>
                            <span className="inline-flex h-7 items-center rounded-full border border-stone-200 bg-stone-50 px-2.5 text-xs font-semibold text-stone-700">
                              {reservation.tableName}
                            </span>
                            <StatusPill status={reservation.status} />
                          </Link>
                        )) : (
                          <div className="flex min-h-12 items-center justify-between rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 text-sm text-stone-500">
                            <span>{slot.available ? `${slot.availableTables} mesas disponibles` : "Sin disponibilidad"}</span>
                            {slot.available ? (
                              <Link
                                href={`/app/reservas?date=${selectedDate}&new=1&slot=${slot.time}`}
                                className="text-xs font-semibold text-stone-950 hover:underline"
                                prefetch={false}
                              >
                                Reservar
                              </Link>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-6">
                    <EmptyState title="Dia cerrado" description="No hay horarios disponibles para recibir reservas en esta fecha." />
                  </div>
                )}
              </div>
            </div>
          </ModuleCard>

        </div>

        <aside className="space-y-6">
          <ModuleCard title="Panel de reserva" description="Datos completos y estado del servicio.">
            {selectedReservation ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-stone-950">
                        {selectedReservation.customers?.full_name ?? "Cliente"}
                      </p>
                      <p className="mt-1 text-sm text-stone-500">
                        {selectedReservation.date} / {selectedReservation.time.slice(0, 5)}
                      </p>
                    </div>
                    <StatusPill status={selectedReservation.status} />
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-stone-600">
                    <p><span className="font-semibold text-stone-950">Mesa:</span> {selectedReservation.tableName}</p>
                    <p><span className="font-semibold text-stone-950">Personas:</span> {selectedReservation.party_size}</p>
                    <p><span className="font-semibold text-stone-950">Telefono:</span> {selectedReservation.customers?.phone ?? "-"}</p>
                    <p><span className="font-semibold text-stone-950">Email:</span> {selectedReservation.customers?.email ?? "-"}</p>
                    <p><span className="font-semibold text-stone-950">Origen:</span> {selectedReservation.source}</p>
                  </div>
                </div>

                <div><p className="text-sm font-semibold text-stone-950">Acciones</p><div className="mt-3"><ReservationPosActions reservation={{ id: selectedReservation.id, status: selectedReservation.status, customerId: selectedReservation.customer_id, customerName: selectedReservation.customers?.full_name ?? "Cliente", phone: selectedReservation.customers?.phone ?? undefined, partySize: selectedReservation.party_size, tableName: selectedReservation.tableName, notes: selectedReservation.notes ?? undefined, specialRequest: selectedReservation.special_request ?? undefined }} returnTo={returnTo} /></div></div>

                <div className="grid gap-3 text-sm">
                  <div>
                    <p className="font-semibold text-stone-950">Solicitud especial</p>
                    <p className="mt-1 leading-6 text-stone-500">{selectedReservation.special_request || "Sin solicitud especial."}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-stone-950">Notas internas</p>
                    <p className="mt-1 leading-6 text-stone-500">{selectedReservation.notes || "Sin notas internas."}</p>
                  </div>
                </div>

                <Link href={`/app/clientes/${selectedReservation.customer_id}`} className="inline-flex h-11 items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800" prefetch={false}>
                  <UserRound size={16} />
                  Ver cliente
                </Link>
              </div>
            ) : (
              <EmptyState title="Sin reserva seleccionada" description="Selecciona una reserva del calendario para abrir sus datos completos." />
            )}
          </ModuleCard>

          <ModuleCard title="Disponibilidad" description="Slots calculados por horario e intervalo configurado.">
            <div className="grid gap-2">
              {data.slots.slice(0, 12).map((slot) => (
                <div key={slot.time} className="flex items-center justify-between rounded-xl border border-stone-200 px-3 py-2 text-sm">
                  <span className="font-semibold text-stone-950">{slot.time}</span>
                  <span className={slot.available ? "text-emerald-700" : "text-red-700"}>
                    {slot.available ? `${slot.availableTables} mesas` : "Lleno"}
                  </span>
                </div>
              ))}
            </div>
          </ModuleCard>
        </aside>
      </div>
    </div>
  );
}
