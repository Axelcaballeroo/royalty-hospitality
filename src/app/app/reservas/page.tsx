import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import {
  createReservationAction,
  updateReservationAction,
  updateReservationStatusAction,
} from "@/app/app/actions";
import { getReservationsData } from "@/lib/data";
import { DataTable, EmptyState, ModuleCard, StatusBadge } from "@/components/ui";
import { formatEventType, formatStatus } from "@/lib/formatters";

export const dynamic = "force-dynamic";

const sources = ["manual", "web", "whatsapp", "google", "instagram"];

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
    date?: string;
    status?: string;
    source?: string;
  }>;
}) {
  const params = await searchParams;
  const { reservations, customers } = await getReservationsData({
    date: params.date,
    status: params.status,
    source: params.source,
  });

  const rows = reservations.map((reservation) => [
    reservation.date,
    reservation.time.slice(0, 5),
    reservation.customers?.full_name ?? "Cliente",
    String(reservation.party_size),
    <StatusBadge key="status" status={reservation.status} />,
    formatStatus(reservation.source),
    reservation.notes ?? "-",
    <div key="actions" className="flex flex-wrap gap-2">
      {["confirmed", "completed", "no_show"].map((status) => (
        <form key={status} action={updateReservationStatusAction}>
          <input type="hidden" name="reservation_id" value={reservation.id} />
          <input type="hidden" name="customer_id" value={reservation.customer_id} />
          <input type="hidden" name="status" value={status} />
          <button className="rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-600 hover:bg-stone-50">
            {formatStatus(status)}
          </button>
        </form>
      ))}
      <form action={updateReservationStatusAction}>
        <input type="hidden" name="reservation_id" value={reservation.id} />
        <input type="hidden" name="customer_id" value={reservation.customer_id} />
        <input type="hidden" name="status" value="cancelled" />
        <ConfirmSubmitButton
          message="Cancelar esta reserva?"
          className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
        >
          Cancelar
        </ConfirmSubmitButton>
      </form>
    </div>,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
          Reservas
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-950">
          Reservas funcionales
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          Crea reservas, usa clientes existentes o captura un cliente rapido, y registra eventos de timeline.
        </p>
      </div>
      {params.error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formatEventType(params.error)}</p> : null}
      {params.success ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{formatEventType(params.success)}</p> : null}

      <ModuleCard title="Filtros" description="Refina la lista por fecha, estado o fuente.">
        <form className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <input
            type="date"
            name="date"
            defaultValue={params.date ?? ""}
            className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400"
          />
          <select
            name="status"
            defaultValue={params.status ?? "all"}
            className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400"
          >
            <option value="all">Todos los estados</option>
            {["pending", "confirmed", "cancelled", "completed", "no_show"].map((status) => (
              <option key={status} value={status}>{formatStatus(status)}</option>
            ))}
          </select>
          <select
            name="source"
            defaultValue={params.source ?? "all"}
            className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400"
          >
            <option value="all">Todas las fuentes</option>
            {sources.map((source) => <option key={source} value={source}>{formatStatus(source)}</option>)}
          </select>
          <button className="h-11 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800">
            Aplicar
          </button>
        </form>
      </ModuleCard>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <ModuleCard title="Crear reserva" description="Fecha, hora y personas son requeridos.">
          <form action={createReservationAction} className="grid gap-3">
            <select name="customer_id" className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
              <option value="">Cliente existente o cliente rapido</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.full_name}</option>
              ))}
            </select>
            <div className="grid gap-3 sm:grid-cols-3">
              <input required type="date" name="date" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input required type="time" name="time" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input required min={1} type="number" name="party_size" placeholder="Personas" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input name="quick_customer_name" placeholder="Cliente rapido" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="quick_customer_phone" placeholder="Telefono" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input type="email" name="quick_customer_email" placeholder="Email" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            </div>
            <select name="source" defaultValue="manual" className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
              {sources.map((source) => <option key={source} value={source}>{formatStatus(source)}</option>)}
            </select>
            <input name="special_request" placeholder="Solicitud especial" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <textarea name="notes" placeholder="Notas" className="min-h-20 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">Crear reserva</button>
          </form>
        </ModuleCard>

        <ModuleCard title="Lista de reservas" description="Estados visuales, acciones y relacion con cliente.">
          {reservations.length ? (
            <DataTable columns={["Fecha", "Hora", "Cliente", "Pax", "Estado", "Fuente", "Notas", "Acciones"]} rows={rows} />
          ) : (
            <EmptyState title="Sin reservas" description="Crea la primera reserva para iniciar el flujo operacional." />
          )}
        </ModuleCard>
      </section>

      {reservations.length ? (
        <ModuleCard title="Editar reserva rapida" description="Selecciona una reserva y actualiza fecha, hora, personas o notas.">
          <form action={updateReservationAction} className="grid gap-3 lg:grid-cols-6">
            <select required name="reservation_id" className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400 lg:col-span-2">
              {reservations.map((reservation) => (
                <option key={reservation.id} value={reservation.id}>
                  {reservation.date} {reservation.time.slice(0, 5)} - {reservation.customers?.full_name}
                </option>
              ))}
            </select>
            <input required type="date" name="date" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <input required type="time" name="time" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <input required min={1} type="number" name="party_size" placeholder="Pax" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">Guardar</button>
            <input name="special_request" placeholder="Solicitud especial" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400 lg:col-span-2" />
            <input name="notes" placeholder="Notas" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400 lg:col-span-4" />
          </form>
        </ModuleCard>
      ) : null}
    </div>
  );
}
