import Link from "next/link";
import { CheckCircle2, ClipboardList, Megaphone, QrCode } from "lucide-react";
import {
  createInternalTaskAction,
  createWasteReductionCampaignAction,
  updateReservationStatusAction,
} from "@/app/app/actions";
import { ActionCard, EmptyState, ModuleCard, SectionHeader, StatCard, StatusBadge } from "@/components/ui";
import { getOperationData } from "@/lib/data";
import { formatEventType } from "@/lib/formatters";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("es-MX", {
  currency: "MXN",
  style: "currency",
});

export default async function OperationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const data = await getOperationData();

  const alertCount =
    data.wasteAlerts.length +
    data.urgentBatches.length +
    data.lowStockItems.length +
    data.pendingReservations.length +
    data.vipReservations.length +
    data.recentNoShows.length +
    data.openClockEntries.length +
    data.overdueTasks.length +
    data.birthdayCustomers.length +
    data.inactiveCustomers.length;
  const estimatedSales = Number(data.closure?.estimated_sales ?? 0);
  const averageTicket = data.stats.expectedCustomers
    ? estimatedSales / data.stats.expectedCustomers
    : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={data.current.business.name}
        title="Operacion de hoy"
        description="Resumen rapido de tu restaurante para tomar accion."
        actions={
          <>
            <Link
              href="/app/cierre"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              <ClipboardList size={16} />
              Abrir cierre del dia
            </Link>
            <Link
              href="/app/reservas"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-800 transition hover:border-stone-300"
            >
              Nueva reserva
            </Link>
            <Link
              href="/app/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-800 transition hover:border-stone-300"
            >
              Ver Dashboard Ejecutivo
            </Link>
          </>
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Reservas hoy" value={String(data.stats.reservationsToday)} detail="Mesas en agenda" tone="dark" />
        <StatCard title="Clientes esperados" value={String(data.stats.expectedCustomers)} detail="Covers estimados" />
        <StatCard title="Ventas estimadas" value={currency.format(estimatedSales)} detail="Desde cierre del dia" />
        <StatCard title="Ticket promedio" value={currency.format(averageTicket)} detail="Estimado por cliente" />
      </section>

      <ModuleCard title="Acciones rapidas" description="Atajos para resolver la operacion sin navegar entre modulos.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <ActionCard title="Nueva reserva" description="Agrega una mesa y conecta al cliente." href="/app/reservas" action="Crear" />
          <ActionCard title="Registrar consumo" description="Suma puntos o registra check-in." href="/app/checkin" action="Abrir" />
          <ActionCard title="Crear campana" description="Activa una accion comercial." href="/app/marketing" action="Crear" />
          <ActionCard title="Agregar merma" description="Registra perdida o salida FEFO." href="/app/inventario" action="Registrar" />
          <ActionCard title="Registrar cortesia" description="Carga una cortesia al cierre." href="/app/cierre" action="Agregar" />
          <ActionCard title="Abrir cierre del dia" description="Guarda resumen e incidencias." href="/app/cierre" action="Abrir" />
        </div>
      </ModuleCard>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Confirmadas" value={String(data.reservations.filter((reservation) => reservation.status === "confirmed").length)} detail="Reservas listas" />
        <StatCard title="En sala ahora" value={String(data.stats.employeesWorking)} detail="Equipo con entrada" />
        <StatCard title="Clientes inactivos" value={String(data.stats.inactiveCustomers)} detail="Recuperables a 30 dias" />
        <StatCard title="Cumpleanos" value={String(data.stats.birthdays)} detail="Este mes" />
        <StatCard title="Cortesias hoy" value={String(data.stats.courtesiesToday)} detail={currency.format(data.courtesyTotal)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ModuleCard title="Alertas de hoy" description={`${alertCount} senales conectadas a reservas, CRM, inventario y RRHH.`}>
          {alertCount ? (
            <div className="space-y-3">
              {data.wasteAlerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">Merma: {alert.inventory_items?.name ?? "Producto"}</p>
                      <p className="mt-1 text-sm leading-6 text-stone-700">{alert.message}</p>
                    </div>
                    <StatusBadge status={alert.risk_level} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={createWasteReductionCampaignAction}>
                      <input type="hidden" name="alert_id" value={alert.id} />
                      <input type="hidden" name="item_name" value={alert.inventory_items?.name ?? "producto"} />
                      <input type="hidden" name="return_to" value="/app/operacion" />
                      <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-stone-950 px-3 text-sm font-medium text-white">
                        <Megaphone size={15} />
                        Crear campana anti-merma
                      </button>
                    </form>
                    <Link href="/app/inventario" className="inline-flex h-10 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-800">
                      Registrar merma
                    </Link>
                  </div>
                </div>
              ))}

              {data.lowStockItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-stone-950">Stock bajo: {item.name}</p>
                  <p className="mt-1 text-sm text-stone-700">
                    Stock {item.stock} {item.unit}, minimo {item.min_stock} {item.unit}.
                  </p>
                  <Link href="/app/inventario" className="mt-3 inline-flex h-10 items-center rounded-lg bg-white px-3 text-sm font-medium text-stone-800">
                    Revisar inventario
                  </Link>
                </div>
              ))}

              {data.urgentBatches.map((batch) => (
                <div key={batch.id} className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">
                        Producto por vencer: {batch.inventory_items?.name ?? "Producto"}
                      </p>
                      <p className="mt-1 text-sm text-stone-700">
                        {batch.quantity} {batch.inventory_items?.unit ?? ""} / vence {batch.expiration_date ?? "sin fecha"}.
                      </p>
                    </div>
                    <StatusBadge status={batch.status} />
                  </div>
                  <Link href="/app/inventario?view=vencimientos" className="mt-3 inline-flex h-10 items-center rounded-lg bg-white px-3 text-sm font-medium text-stone-800">
                    Ver productos por vencer
                  </Link>
                </div>
              ))}

              {data.pendingReservations.map((reservation) => (
                <div key={reservation.id} className="rounded-lg border border-stone-200 bg-white p-4">
                  <p className="text-sm font-semibold text-stone-950">
                    Reserva pendiente: {reservation.customers?.full_name ?? "Cliente"}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    {reservation.date} {reservation.time.slice(0, 5)} / {reservation.party_size} personas
                  </p>
                  <form action={updateReservationStatusAction} className="mt-3">
                    <input type="hidden" name="reservation_id" value={reservation.id} />
                    <input type="hidden" name="customer_id" value={reservation.customer_id} />
                    <input type="hidden" name="return_to" value="/app/operacion" />
                    <button name="status" value="confirmed" className="inline-flex h-10 items-center gap-2 rounded-lg bg-stone-950 px-3 text-sm font-medium text-white">
                      <CheckCircle2 size={15} />
                      Confirmar reserva
                    </button>
                  </form>
                </div>
              ))}

              {data.vipReservations.map((reservation) => (
                <div key={`vip-${reservation.id}`} className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-stone-950">VIP con reserva: {reservation.customers?.full_name ?? "Cliente"}</p>
                  <p className="mt-1 text-sm text-stone-700">{reservation.time.slice(0, 5)} / {reservation.party_size} personas</p>
                  <Link href={`/app/clientes/${reservation.customer_id}`} className="mt-3 inline-flex h-10 items-center rounded-lg bg-white px-3 text-sm font-medium text-stone-800">
                    Ver cliente
                  </Link>
                </div>
              ))}

              {data.recentNoShows.map((reservation) => (
                <div key={`noshow-${reservation.id}`} className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-stone-950">No-show reciente: {reservation.customers?.full_name ?? "Cliente"}</p>
                  <p className="mt-1 text-sm text-stone-700">{reservation.date} {reservation.time.slice(0, 5)}</p>
                  <form action={createInternalTaskAction} className="mt-3">
                    <input type="hidden" name="title" value={`Dar seguimiento a no-show de ${reservation.customers?.full_name ?? "cliente"}`} />
                    <input type="hidden" name="description" value="Contactar al cliente y recuperar la relacion." />
                    <input type="hidden" name="priority" value="medium" />
                    <input type="hidden" name="status" value="pending" />
                    <input type="hidden" name="customer_id" value={reservation.customer_id} />
                    <input type="hidden" name="reservation_id" value={reservation.id} />
                    <input type="hidden" name="return_to" value="/app/operacion" />
                    <button className="inline-flex h-10 items-center rounded-lg bg-white px-3 text-sm font-medium text-stone-800">
                      Crear tarea interna
                    </button>
                  </form>
                </div>
              ))}

              {data.birthdayCustomers.slice(0, 4).map((customer) => (
                <div key={`birthday-${customer.id}`} className="rounded-lg border border-violet-200 bg-violet-50 p-4">
                  <p className="text-sm font-semibold text-stone-950">Cumpleanos del mes: {customer.full_name}</p>
                  <p className="mt-1 text-sm text-stone-700">{customer.phone ?? customer.email ?? "Sin contacto"}</p>
                  <Link href="/app/marketing?segment=birthday_month&type=birthday" className="mt-3 inline-flex h-10 items-center rounded-lg bg-white px-3 text-sm font-medium text-stone-800">
                    Crear campana
                  </Link>
                </div>
              ))}

              {data.inactiveCustomers.length ? (
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                  <p className="text-sm font-semibold text-stone-950">
                    {data.inactiveCustomers.length} clientes pueden recuperarse
                  </p>
                  <p className="mt-1 text-sm text-stone-700">
                    No han vuelto en mas de 30 dias. Puedes activar una campana de regreso.
                  </p>
                  <Link href="/app/marketing?segment=inactive_60d&type=inactive_customers" className="mt-3 inline-flex h-10 items-center rounded-lg bg-white px-3 text-sm font-medium text-stone-800">
                    Crear campana
                  </Link>
                </div>
              ) : null}

              {data.openClockEntries.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                  <p className="text-sm font-semibold text-stone-950">Salida pendiente: {entry.employees?.full_name ?? "Empleado"}</p>
                  <p className="mt-1 text-sm text-stone-700">Entrada {new Date(entry.clock_in).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</p>
                  <Link href="/app/rrhh/checador" className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-white px-3 text-sm font-medium text-stone-800">
                    <QrCode size={15} />
                    Ir a check-in
                  </Link>
                </div>
              ))}

              {data.overdueTasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <p className="text-sm font-semibold text-stone-950">Tarea vencida: {task.title}</p>
                  <p className="mt-1 text-sm text-stone-700">{task.due_date ? new Date(task.due_date).toLocaleString("es-MX") : "Sin fecha"}</p>
                  <Link href="/app/crm-interno" className="mt-3 inline-flex h-10 items-center rounded-lg bg-white px-3 text-sm font-medium text-stone-800">
                    Abrir CRM interno
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin alertas criticas" description="La operacion de hoy no tiene alertas pendientes." />
          )}
        </ModuleCard>

        <div className="space-y-4">
          <ModuleCard title="Reservas de hoy" description="Agenda inmediata del restaurante.">
            {data.reservations.length ? (
              <div className="space-y-2">
                {data.reservations.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-stone-950">{reservation.time.slice(0, 5)} / {reservation.customers?.full_name ?? "Cliente"}</p>
                      <p className="text-xs text-stone-500">{reservation.party_size} personas</p>
                    </div>
                    <StatusBadge status={reservation.status} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Sin reservas hoy" description="Cuando entren reservas, apareceran aqui." />
            )}
          </ModuleCard>

          <ModuleCard title="Cortesias del dia" description={currency.format(data.courtesyTotal)}>
            {data.courtesies.length ? (
              <div className="space-y-2">
                {data.courtesies.map((courtesy) => (
                  <div key={courtesy.id} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <p className="text-sm font-semibold text-stone-950">{courtesy.item_name}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {courtesy.quantity} / {courtesy.reason} / {currency.format(Number(courtesy.estimated_value))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Sin cortesias" description="Registra cortesias desde el cierre del dia." />
            )}
          </ModuleCard>

          <ModuleCard title="Campanas sugeridas" description="Acciones comerciales listas para revisar.">
            <div className="space-y-2">
              {data.wasteAlerts.length ? (
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                  <p className="text-sm font-semibold text-stone-950">Promocionar producto por vencer</p>
                  <p className="mt-1 text-xs text-stone-500">Crea una campana anti-merma desde las alertas.</p>
                </div>
              ) : null}
              {data.campaigns.map((campaign) => (
                <Link key={campaign.id} href={`/app/marketing/${campaign.id}`} className="block rounded-lg border border-stone-200 bg-stone-50 p-3">
                  <p className="text-sm font-semibold text-stone-950">{campaign.name}</p>
                  <p className="mt-1 text-xs text-stone-500">{formatEventType(campaign.type)}</p>
                </Link>
              ))}
              {!data.wasteAlerts.length && !data.campaigns.length ? (
                <EmptyState title="Sin sugerencias" description="Las campanas sugeridas apareceran con inventario o segmentos listos." />
              ) : null}
            </div>
          </ModuleCard>
        </div>
      </section>
    </div>
  );
}
