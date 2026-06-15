import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardList, Megaphone, Plus } from "lucide-react";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import {
  createCourtesyAction,
  createInternalTaskAction,
  createReservationAction,
  createWasteReductionCampaignAction,
  redeemRewardAction,
  registerConsumptionAction,
  updateReservationStatusAction,
  upsertDailyClosureAction,
} from "@/app/app/actions";
import {
  DataTable,
  EmptyState,
  ModuleCard,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
  StatCard,
  StatusBadge,
} from "@/components/ui";
import { getDailyClosureData, getOperationData } from "@/lib/data";
import { formatEventType } from "@/lib/formatters";

export const dynamic = "force-dynamic";

type OperationTab = "hoy" | "reservas" | "sala" | "alertas" | "cierre";
type OperationAction = "nueva-reserva" | "cortesia" | undefined;

const tabs: { key: OperationTab; label: string }[] = [
  { key: "hoy", label: "Hoy" },
  { key: "reservas", label: "Reservas" },
  { key: "sala", label: "Clientes en sala" },
  { key: "alertas", label: "Alertas" },
  { key: "cierre", label: "Cierre" },
];

const currency = new Intl.NumberFormat("es-MX", {
  currency: "MXN",
  style: "currency",
});

const fieldClass =
  "h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400";

const courtesyReasons = [
  "cliente VIP",
  "cumpleaños",
  "compensación",
  "influencer",
  "invitado de casa",
  "error de cocina",
  "otro",
];

function tabHref(tab: OperationTab) {
  return `/app/operacion?tab=${tab}`;
}

function getAccount(customer: {
  loyalty_accounts?: { points_balance: number; tier: string }[] | { points_balance: number; tier: string } | null;
}) {
  const account = Array.isArray(customer.loyalty_accounts)
    ? customer.loyalty_accounts[0]
    : customer.loyalty_accounts;

  return account ?? { points_balance: 0, tier: "bronze" };
}

function priorityBadge(priority: "Alta" | "Media" | "Baja") {
  const status = priority === "Alta" ? "high" : priority === "Media" ? "medium" : "low";
  return <StatusBadge status={status} />;
}

function InboxItem({
  title,
  description,
  priority,
  children,
}: {
  title: string;
  description: string;
  priority?: "Alta" | "Media" | "Baja";
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-stone-100 py-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-stone-950">{title}</p>
          {priority ? priorityBadge(priority) : null}
        </div>
        <p className="mt-1 text-sm leading-6 text-stone-500">{description}</p>
      </div>
      {children ? <div className="flex shrink-0 flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

export default async function OperationPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    action?: string;
    date?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;
  const activeTab = tabs.some((tab) => tab.key === params.tab)
    ? (params.tab as OperationTab)
    : "hoy";
  const activeAction = params.action as OperationAction;
  const [data, closureData] = await Promise.all([
    getOperationData(),
    getDailyClosureData(params.date),
  ]);

  const closure = closureData.closure;
  const estimatedSales = Number(closure?.estimated_sales ?? data.closure?.estimated_sales ?? 0);
  const activeAlerts =
    data.wasteAlerts.length +
    data.urgentBatches.length +
    data.lowStockItems.length +
    data.pendingReservations.length +
    data.recentNoShows.length +
    data.openClockEntries.length +
    data.overdueTasks.length;
  const inRoomReservations = data.reservations.filter((reservation) => reservation.status === "completed");
  const activeReservations = data.reservations.filter((reservation) => reservation.status !== "cancelled");
  const customersInRoom = inRoomReservations.reduce((sum, reservation) => sum + Number(reservation.party_size), 0);

  const pendingItems = [
    ...data.urgentBatches.slice(0, 2).map((batch) => ({
      id: `batch-${batch.id}`,
      title: `${batch.inventory_items?.name ?? "Producto"} vence pronto`,
      description: `${batch.quantity} ${batch.inventory_items?.unit ?? ""} con vencimiento ${batch.expiration_date ?? "sin fecha"}.`,
      priority: "Alta" as const,
      href: "/app/inventario?view=vencimientos",
      label: "Ver detalle",
    })),
    ...data.pendingReservations.slice(0, 2).map((reservation) => ({
      id: `reservation-${reservation.id}`,
      title: `Confirmar reserva de ${reservation.customers?.full_name ?? "cliente"}`,
      description: `${reservation.date} ${reservation.time.slice(0, 5)} / ${reservation.party_size} personas.`,
      priority: "Media" as const,
      href: tabHref("reservas"),
      label: "Abrir reservas",
    })),
    ...data.birthdayCustomers.slice(0, 1).map((customer) => ({
      id: `birthday-${customer.id}`,
      title: `Cumpleanos de ${customer.full_name}`,
      description: customer.phone ?? customer.email ?? "Cliente activo sin contacto visible.",
      priority: "Baja" as const,
      href: "/app/marketing?segment=birthday_month&type=birthday",
      label: "Crear campana",
    })),
    ...data.overdueTasks.slice(0, 2).map((task) => ({
      id: `task-${task.id}`,
      title: `Tarea pendiente: ${task.title}`,
      description: task.due_date ? new Date(task.due_date).toLocaleString("es-MX") : "Sin fecha limite.",
      priority: "Media" as const,
      href: "/app/crm-interno",
      label: "Ver tarea",
    })),
  ].slice(0, 6);

  const reservationRows = data.reservations.map((reservation) => [
    reservation.time.slice(0, 5),
    reservation.customers?.full_name ?? "Cliente",
    String(reservation.party_size),
    <StatusBadge key="status" status={reservation.status} />,
    reservation.notes ?? reservation.special_request ?? "-",
    <div key="actions" className="flex flex-wrap gap-2">
      <form action={updateReservationStatusAction}>
        <input type="hidden" name="reservation_id" value={reservation.id} />
        <input type="hidden" name="customer_id" value={reservation.customer_id} />
        <input type="hidden" name="status" value="confirmed" />
        <input type="hidden" name="return_to" value={tabHref("reservas")} />
        <button className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
          Confirmar
        </button>
      </form>
      <form action={updateReservationStatusAction}>
        <input type="hidden" name="reservation_id" value={reservation.id} />
        <input type="hidden" name="customer_id" value={reservation.customer_id} />
        <input type="hidden" name="status" value="completed" />
        <input type="hidden" name="return_to" value={tabHref("sala")} />
        <button className="rounded-md border border-stone-200 px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50">
          Check-in
        </button>
      </form>
      <form action={updateReservationStatusAction}>
        <input type="hidden" name="reservation_id" value={reservation.id} />
        <input type="hidden" name="customer_id" value={reservation.customer_id} />
        <input type="hidden" name="status" value="cancelled" />
        <input type="hidden" name="return_to" value={tabHref("reservas")} />
        <ConfirmSubmitButton
          message="Cancelar esta reserva?"
          className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
        >
          Cancelar
        </ConfirmSubmitButton>
      </form>
    </div>,
  ]);

  const courtesyRows = closureData.courtesies.map((courtesy) => [
    courtesy.item_name,
    String(courtesy.quantity),
    currency.format(Number(courtesy.estimated_value)),
    courtesy.reason,
    courtesy.customers?.full_name ?? "-",
  ]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={data.current.business.name}
        title="Centro Operativo"
        description="El flujo diario del restaurante en una sola pantalla: agenda, sala, alertas y cierre."
        actions={
          <>
            <Link
              href="/app/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-800 transition hover:border-stone-300"
            >
              Ver Dashboard Ejecutivo
            </Link>
            <Link
              href="/app/operacion?tab=reservas&action=nueva-reserva"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              <Plus size={16} />
              Nueva reserva
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

      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tabHref(tab.key)}
            className={[
              "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition",
              activeTab === tab.key
                ? "bg-stone-950 text-white"
                : "text-stone-600 hover:bg-stone-50 hover:text-stone-950",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {activeTab === "hoy" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Reservas hoy" value={String(data.stats.reservationsToday)} detail="Agenda del dia" tone="dark" />
            <StatCard title="Clientes en sala" value={String(customersInRoom)} detail={`${inRoomReservations.length} mesas con check-in`} />
            <StatCard title="Ventas estimadas" value={currency.format(estimatedSales)} detail="Dato del cierre" />
            <StatCard title="Alertas activas" value={String(activeAlerts)} detail="Pendientes operativos" />
          </section>

          <ModuleCard title="Pendientes para hoy" description="Bandeja unica con lo que requiere atencion antes del cierre.">
            {pendingItems.length ? (
              <div className="divide-y divide-stone-100">
                {pendingItems.map((item) => (
                  <InboxItem key={item.id} title={item.title} description={item.description} priority={item.priority}>
                    <Link href={item.href} className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-800">
                      {item.label}
                    </Link>
                  </InboxItem>
                ))}
              </div>
            ) : (
              <EmptyState title="Todo bajo control" description="No hay pendientes urgentes para la operacion de hoy." />
            )}
          </ModuleCard>
        </div>
      ) : null}

      {activeTab === "reservas" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-4">
            <StatCard title="Reservas" value={String(data.reservations.length)} detail="Hoy" tone="dark" />
            <StatCard title="Confirmadas" value={String(data.reservations.filter((item) => item.status === "confirmed").length)} detail="Listas para recibir" />
            <StatCard title="Pendientes" value={String(data.reservations.filter((item) => item.status === "pending").length)} detail="Por confirmar" />
            <StatCard title="Check-in" value={String(inRoomReservations.length)} detail="Clientes en sala" />
          </section>

          {activeAction === "nueva-reserva" ? (
            <ModuleCard title="Nueva reserva" description="Formulario compacto para agenda manual o cliente rapido.">
              <form action={createReservationAction} className="grid gap-3">
                <input type="hidden" name="return_to" value={tabHref("reservas")} />
                <select name="customer_id" className={fieldClass}>
                  <option value="">Cliente existente o cliente rapido</option>
                  {closureData.customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.full_name}
                    </option>
                  ))}
                </select>
                <div className="grid gap-3 sm:grid-cols-3">
                  <input required type="date" name="date" defaultValue={data.today} className={fieldClass} />
                  <input required type="time" name="time" className={fieldClass} />
                  <input required min={1} type="number" name="party_size" placeholder="Personas" className={fieldClass} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <input name="quick_customer_name" placeholder="Cliente rapido" className={fieldClass} />
                  <input name="quick_customer_phone" placeholder="Telefono" className={fieldClass} />
                  <input type="email" name="quick_customer_email" placeholder="Email" className={fieldClass} />
                </div>
                <input name="special_request" placeholder="Solicitud especial" className={fieldClass} />
                <textarea name="notes" placeholder="Notas internas" className="min-h-20 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
                <input type="hidden" name="source" value="manual" />
                <div className="flex flex-wrap gap-2">
                  <PrimaryButton>Crear reserva</PrimaryButton>
                  <Link href={tabHref("reservas")} className="inline-flex h-11 items-center rounded-xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-800">
                    Cancelar
                  </Link>
                </div>
              </form>
            </ModuleCard>
          ) : null}

          <ModuleCard
            title="Reservas del dia"
            description="Confirmar, cancelar o hacer check-in mueve al cliente al flujo correcto."
          >
            {data.reservations.length ? (
              <DataTable columns={["Hora", "Cliente", "Personas", "Estado", "Notas", "Acciones"]} rows={reservationRows} />
            ) : (
              <EmptyState
                title="Sin reservas hoy"
                description="Crea una reserva para iniciar la agenda del dia."
                action={
                  <Link href="/app/operacion?tab=reservas&action=nueva-reserva" className="inline-flex h-11 items-center rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white">
                    Nueva reserva
                  </Link>
                }
              />
            )}
          </ModuleCard>
        </div>
      ) : null}

      {activeTab === "sala" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-4">
            <StatCard title="Mesas activas" value={String(inRoomReservations.length)} detail="Con check-in" tone="dark" />
            <StatCard title="Clientes" value={String(customersInRoom)} detail="Personas en sala" />
            <StatCard title="Puntos visibles" value={String(inRoomReservations.reduce((sum, reservation) => sum + getAccount(reservation.customers ?? {}).points_balance, 0))} detail="Saldo acumulado" />
            <StatCard title="Beneficios" value={String(data.rewards.length)} detail="Disponibles para canje" />
          </section>

          <ModuleCard title="Clientes en sala" description="Vista ligera para registrar consumo y canjear beneficios sin mostrar QR ni formularios largos.">
            {inRoomReservations.length ? (
              <div className="space-y-3">
                {inRoomReservations.map((reservation) => {
                  const customer = reservation.customers;
                  const account = getAccount(customer ?? {});
                  return (
                    <div key={reservation.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-base font-semibold text-stone-950">{customer?.full_name ?? "Cliente"}</p>
                          <p className="mt-1 text-sm text-stone-500">
                            Mesa/reserva {reservation.time.slice(0, 5)} / {reservation.party_size} personas
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <StatusBadge status={account.tier} />
                            <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700">
                              {account.points_balance} puntos
                            </span>
                          </div>
                        </div>
                        <Link href={`/app/clientes/${reservation.customer_id}`} className="text-sm font-semibold text-stone-950 hover:underline">
                          Ver perfil
                        </Link>
                      </div>
                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        <form action={registerConsumptionAction} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                          <input type="hidden" name="customer_id" value={reservation.customer_id} />
                          <input type="hidden" name="return_to" value={tabHref("sala")} />
                          <input required min={1} type="number" name="amount" placeholder="Consumo acumulado" className={fieldClass} />
                          <input name="comment" placeholder="Nota" className={fieldClass} />
                          <SecondaryButton>Registrar consumo</SecondaryButton>
                        </form>
                        <form action={redeemRewardAction} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                          <input type="hidden" name="customer_id" value={reservation.customer_id} />
                          <input type="hidden" name="return_to" value={tabHref("sala")} />
                          <select required name="reward_id" className={fieldClass}>
                            <option value="">Beneficio disponible</option>
                            {data.rewards.map((reward) => (
                              <option key={reward.id} value={reward.id}>
                                {reward.name} - {reward.points_required} puntos
                              </option>
                            ))}
                          </select>
                          <SecondaryButton>Canjear recompensa</SecondaryButton>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Todavia no hay clientes en sala"
                description="Haz check-in desde Reservas para mover clientes automaticamente a esta vista."
                action={
                  <Link href={tabHref("reservas")} className="inline-flex h-11 items-center rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white">
                    Abrir reservas
                  </Link>
                }
              />
            )}
          </ModuleCard>
        </div>
      ) : null}

      {activeTab === "alertas" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-4">
            <StatCard title="Alertas" value={String(activeAlerts)} detail="Total activo" tone="dark" />
            <StatCard title="Inventario" value={String(data.wasteAlerts.length + data.urgentBatches.length + data.lowStockItems.length)} detail="Stock, vencimiento y perdida" />
            <StatCard title="Reservas" value={String(data.pendingReservations.length + data.recentNoShows.length)} detail="Pendientes y no-shows" />
            <StatCard title="Equipo" value={String(data.openClockEntries.length + data.overdueTasks.length)} detail="Salidas y tareas" />
          </section>

          <ModuleCard title="Bandeja de alertas" description="Prioridades operativas en una sola lista.">
            {activeAlerts ? (
              <div>
                {data.wasteAlerts.map((alert) => (
                  <InboxItem
                    key={`waste-${alert.id}`}
                    title={`Perdida posible: ${alert.inventory_items?.name ?? "Producto"}`}
                    description={`${alert.message} ${alert.estimated_loss ? `Perdida estimada: ${currency.format(Number(alert.estimated_loss))}.` : ""}`}
                    priority="Alta"
                  >
                    <form action={createWasteReductionCampaignAction}>
                      <input type="hidden" name="alert_id" value={alert.id} />
                      <input type="hidden" name="item_name" value={alert.inventory_items?.name ?? "producto"} />
                      <input type="hidden" name="return_to" value={tabHref("alertas")} />
                      <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-stone-950 px-3 text-xs font-semibold text-white">
                        <Megaphone size={14} />
                        Crear promocion
                      </button>
                    </form>
                    <Link href="/app/inventario?view=mermas" className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-800">
                      Registrar perdida
                    </Link>
                  </InboxItem>
                ))}

                {data.urgentBatches.map((batch) => (
                  <InboxItem
                    key={`batch-${batch.id}`}
                    title={`Producto por vencer: ${batch.inventory_items?.name ?? "Producto"}`}
                    description={`${batch.quantity} ${batch.inventory_items?.unit ?? ""} / vence ${batch.expiration_date ?? "sin fecha"}.`}
                    priority="Alta"
                  >
                    <Link href="/app/inventario?view=vencimientos" className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-800">
                      Ver vencimientos
                    </Link>
                  </InboxItem>
                ))}

                {data.lowStockItems.map((item) => (
                  <InboxItem
                    key={`stock-${item.id}`}
                    title={`Stock bajo: ${item.name}`}
                    description={`Stock ${item.stock} ${item.unit}, minimo ${item.min_stock} ${item.unit}.`}
                    priority="Media"
                  >
                    <Link href="/app/inventario" className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-800">
                      Revisar stock
                    </Link>
                  </InboxItem>
                ))}

                {data.pendingReservations.map((reservation) => (
                  <InboxItem
                    key={`pending-${reservation.id}`}
                    title={`Reserva pendiente: ${reservation.customers?.full_name ?? "Cliente"}`}
                    description={`${reservation.date} ${reservation.time.slice(0, 5)} / ${reservation.party_size} personas.`}
                    priority="Media"
                  >
                    <form action={updateReservationStatusAction}>
                      <input type="hidden" name="reservation_id" value={reservation.id} />
                      <input type="hidden" name="customer_id" value={reservation.customer_id} />
                      <input type="hidden" name="status" value="confirmed" />
                      <input type="hidden" name="return_to" value={tabHref("alertas")} />
                      <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-stone-950 px-3 text-xs font-semibold text-white">
                        <CheckCircle2 size={14} />
                        Confirmar
                      </button>
                    </form>
                  </InboxItem>
                ))}

                {data.recentNoShows.map((reservation) => (
                  <InboxItem
                    key={`noshow-${reservation.id}`}
                    title={`No-show reciente: ${reservation.customers?.full_name ?? "Cliente"}`}
                    description={`${reservation.date} ${reservation.time.slice(0, 5)}. Conviene dar seguimiento.`}
                    priority="Media"
                  >
                    <form action={createInternalTaskAction}>
                      <input type="hidden" name="title" value={`Dar seguimiento a no-show de ${reservation.customers?.full_name ?? "cliente"}`} />
                      <input type="hidden" name="description" value="Contactar al cliente y recuperar la relacion." />
                      <input type="hidden" name="priority" value="medium" />
                      <input type="hidden" name="status" value="pending" />
                      <input type="hidden" name="customer_id" value={reservation.customer_id} />
                      <input type="hidden" name="reservation_id" value={reservation.id} />
                      <input type="hidden" name="return_to" value={tabHref("alertas")} />
                      <button className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-800">
                        Crear tarea
                      </button>
                    </form>
                  </InboxItem>
                ))}

                {data.openClockEntries.map((entry) => (
                  <InboxItem
                    key={`clock-${entry.id}`}
                    title={`Salida pendiente: ${entry.employees?.full_name ?? "Empleado"}`}
                    description={`Entrada ${new Date(entry.clock_in).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}.`}
                    priority="Baja"
                  >
                    <Link href="/app/rrhh/checador" className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-800">
                      Ir a checador
                    </Link>
                  </InboxItem>
                ))}

                {data.overdueTasks.map((task) => (
                  <InboxItem
                    key={`task-${task.id}`}
                    title={`Tarea vencida: ${task.title}`}
                    description={task.due_date ? new Date(task.due_date).toLocaleString("es-MX") : "Sin fecha."}
                    priority="Media"
                  >
                    <Link href="/app/crm-interno" className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-800">
                      Ver tarea
                    </Link>
                  </InboxItem>
                ))}
              </div>
            ) : (
              <EmptyState title="Sin alertas activas" description="Inventario, reservas y equipo no tienen pendientes criticos ahora." />
            )}
          </ModuleCard>
        </div>
      ) : null}

      {activeTab === "cierre" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-4">
            <StatCard title="Reservas" value={String(activeReservations.length)} detail="Agenda no cancelada" tone="dark" />
            <StatCard title="Clientes" value={String(data.stats.expectedCustomers)} detail="Esperados hoy" />
            <StatCard title="Ventas" value={currency.format(estimatedSales)} detail="Estimadas" />
            <StatCard title="No-shows" value={String(closure?.no_shows ?? closureData.defaults.noShows)} detail="Del dia" />
          </section>

          <ModuleCard title="Resumen del dia" description="Guarda el borrador operativo o cierra el dia cuando el gerente termine.">
            <form action={upsertDailyClosureAction} className="grid gap-5">
              <input type="hidden" name="return_to" value={`${tabHref("cierre")}&date=${closureData.date}`} />
              <input type="hidden" name="date" value={closureData.date} />
              <div className="grid gap-3 md:grid-cols-5">
                <input name="estimated_sales" type="number" min="0" step="0.01" defaultValue={closure?.estimated_sales ?? 0} placeholder="Ventas estimadas" className={fieldClass} />
                <input name="completed_reservations" type="number" min="0" defaultValue={closure?.completed_reservations ?? closureData.defaults.completedReservations} placeholder="Reservas completadas" className={fieldClass} />
                <input name="no_shows" type="number" min="0" defaultValue={closure?.no_shows ?? closureData.defaults.noShows} placeholder="No-shows" className={fieldClass} />
                <input name="courtesy_total" type="number" min="0" step="0.01" defaultValue={closure?.courtesy_total ?? closureData.defaults.courtesyTotal} placeholder="Cortesias" className={fieldClass} />
                <input name="waste_total" type="number" min="0" step="0.01" defaultValue={closure?.waste_total ?? closureData.defaults.wasteTotal} placeholder="Perdida registrada" className={fieldClass} />
              </div>
              <textarea
                name="summary"
                defaultValue={closure?.summary ?? ""}
                placeholder="Resumen del dia"
                className="min-h-20 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
              />
              <div className="grid gap-4 xl:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-stone-950">Incidencias del gerente</label>
                  <textarea
                    name="incidents"
                    defaultValue={closure?.incidents ?? ""}
                    placeholder="Anota problemas, seguimientos o decisiones importantes."
                    className="mt-2 min-h-28 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-stone-950">Notas finales</label>
                  <textarea
                    name="manager_notes"
                    defaultValue={closure?.manager_notes ?? ""}
                    placeholder="Notas del gerente para manana."
                    className="mt-2 min-h-28 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  name="status"
                  value="draft"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
                >
                  Guardar borrador
                </button>
                <button
                  name="status"
                  value="closed"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-stone-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
                >
                  <ClipboardList size={16} />
                  Cerrar dia
                </button>
              </div>
            </form>
          </ModuleCard>

          <ModuleCard
            title="Cortesias"
            description={`${closureData.courtesies.length} registros / ${currency.format(closureData.defaults.courtesyTotal)} estimados.`}
          >
            {activeAction === "cortesia" ? (
              <form action={createCourtesyAction} className="mb-5 grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <input type="hidden" name="return_to" value={`${tabHref("cierre")}&date=${closureData.date}`} />
                <input type="hidden" name="date" value={closureData.date} />
                <input required name="item_name" placeholder="Producto o cortesia" className={fieldClass} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <input name="quantity" type="number" min="1" defaultValue={1} placeholder="Cantidad" className={fieldClass} />
                  <input name="estimated_value" type="number" min="0" step="0.01" placeholder="Valor estimado" className={fieldClass} />
                  <select name="reason" defaultValue="cliente VIP" className={fieldClass}>
                    {courtesyReasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <select name="customer_id" className={fieldClass}>
                    <option value="">Cliente opcional</option>
                    {closureData.customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.full_name}
                      </option>
                    ))}
                  </select>
                  <select name="employee_id" className={fieldClass}>
                    <option value="">Empleado opcional</option>
                    {closureData.employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.full_name}
                      </option>
                    ))}
                  </select>
                  <input name="authorized_by" placeholder="Autorizado por" className={fieldClass} />
                </div>
                <textarea name="notes" placeholder="Notas" className="min-h-20 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
                <div className="flex flex-wrap gap-2">
                  <PrimaryButton>Agregar cortesia</PrimaryButton>
                  <Link href={`${tabHref("cierre")}&date=${closureData.date}`} className="inline-flex h-11 items-center rounded-xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-800">
                    Cancelar
                  </Link>
                </div>
              </form>
            ) : (
              <Link href={`${tabHref("cierre")}&action=cortesia&date=${closureData.date}`} className="mb-5 inline-flex h-11 items-center rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white">
                Agregar cortesia
              </Link>
            )}

            {closureData.courtesies.length ? (
              <DataTable columns={["Producto", "Cantidad", "Valor", "Motivo", "Cliente"]} rows={courtesyRows} />
            ) : (
              <EmptyState title="Sin cortesias registradas" description="Agrega cortesias para que aparezcan en el cierre del dia." />
            )}
          </ModuleCard>
        </div>
      ) : null}
    </div>
  );
}
