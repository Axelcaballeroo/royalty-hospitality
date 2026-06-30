import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  adjustLoyaltyPointsAction,
  createInternalCommentAction,
  createInternalNoteAction,
  createInternalTaskAction,
  createWalletAccountAction,
  redeemRewardAction,
  updateWalletStatusAction,
  updateCustomerAction,
  updateTaskStatusAction,
  walletAdjustmentAction,
  walletPurchaseAction,
  walletTopupAction,
} from "@/app/app/actions";
import { getCustomerDetail } from "@/lib/data";
import { createQrDataUrl } from "@/lib/qr";
import { DataPanel, DataTable, EmptyState, ModuleCard, StatusBadge } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { PublicLinkActions } from "@/components/public-link-actions";
import { formatCurrency } from "@/lib/wallet";
import { formatEventType, formatRoleName, formatStatus } from "@/lib/formatters";
import { CustomerConsumptions } from "@/components/customer-consumptions";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const messages = await searchParams;
  const {
    customer,
    events,
    reservations,
    consumptions,
    crmSummary,
    notes,
    tasks,
    comments,
    businessUsers,
    loyaltyAccount,
    loyaltyTransactions,
    rewards,
    campaignRecipients,
    walletAccount,
    walletTransactions,
    current,
  } =
    await getCustomerDetail(id);

  if (!customer) {
    notFound();
  }

  const qrDataUrl = await createQrDataUrl(customer.loyalty_code ?? customer.id);
  const clubLink = `/club/${current.business.slug}`;
  const showWalletMvp = false;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/clientes" className="text-sm font-medium text-stone-500 hover:text-stone-950" prefetch={false}>
          Volver a clientes
        </Link>
        <h1 className="mt-3 text-4xl font-semibold text-stone-950">
          Perfil 360: {customer.full_name}
        </h1>
        <p className="mt-2 text-base text-stone-500">
          {customer.phone ?? "Sin telefono"} / {customer.email ?? "Sin email"}
        </p>
      </div>
      {messages.error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formatEventType(messages.error)}</p> : null}
      {messages.success ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{formatEventType(messages.success)}</p> : null}

      <nav className="flex gap-2 overflow-x-auto border-b border-stone-200 pb-3" aria-label="Secciones del cliente">
        {["Datos", "Reservas", "Consumos", "Notas", "Actividad"].map((label) => (
          <a key={label} href={`#${label.toLowerCase()}`} className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-stone-950">{label}</a>
        ))}
      </nav>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DataPanel title="Total consumido" value={formatCurrency(crmSummary.totalSpent)} detail="Consumo acumulado" />
        <DataPanel title="Visitas totales" value={String(crmSummary.totalVisits)} detail="Cuentas cerradas" />
        <DataPanel title="Ticket promedio" value={formatCurrency(crmSummary.averageTicket)} detail="Por visita" />
        <DataPanel title="Última visita" value={crmSummary.lastVisitAt ? new Date(crmSummary.lastVisitAt).toLocaleDateString("es-MX") : "Sin visita"} detail="Actividad reciente" />
        <DataPanel title="Reservas realizadas" value={String(crmSummary.reservations)} detail="Historial" />
        <DataPanel title="No-shows" value={String(crmSummary.noShows)} detail="Reservas" />
        <DataPanel title="Descuentos recibidos" value={formatCurrency(crmSummary.discounts)} detail="Consumos POS" />
        <DataPanel title="Cortesías recibidas" value={formatCurrency(crmSummary.courtesies)} detail="Consumos POS" />
      </section>

      <section id="consumos" className="scroll-mt-24">
        <ModuleCard title="Consumos" description="Visitas y tickets cerrados desde el Punto de Venta.">
          <CustomerConsumptions
            customerId={customer.id}
            consumptions={consumptions}
            business={{
              name: current.business.name,
              address: [current.business.address, current.business.city, current.business.country].filter(Boolean).join(", "),
              phone: current.business.phone ?? undefined,
            }}
          />
        </ModuleCard>
      </section>

      <ModuleCard title="Acceso al Club" description="Cliente ya puede acceder al Club con su telefono y codigo.">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-semibold text-stone-950">Codigo de club</p>
            <p className="mt-2 text-2xl font-semibold text-stone-950">{customer.loyalty_code ?? "Sin codigo"}</p>
            <p className="mt-2 break-all text-sm text-stone-500">{clubLink}</p>
            <div className="mt-4">
              <PublicLinkActions href={clubLink} />
            </div>
          </div>
          <Image
            src={qrDataUrl}
            alt="QR del club del cliente"
            width={144}
            height={144}
            unoptimized
            className="size-36 rounded-lg border border-stone-200 bg-white p-2"
          />
        </div>
      </ModuleCard>

      <section id="fidelizacion" className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <ModuleCard title="Fidelizacion" description="Cuenta de puntos, nivel actual y ajuste manual.">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="rounded-lg bg-stone-950 p-5 text-white">
              <p className="text-sm text-stone-400">Puntos actuales</p>
              <p className="mt-3 text-4xl font-semibold">
                {loyaltyAccount?.points_balance ?? 0}
              </p>
              <p className="mt-2 text-xs text-stone-400">
                {customer.loyalty_code ?? "Sin codigo"}
              </p>
              <div className="mt-4">
                <StatusBadge status={loyaltyAccount?.tier ?? "bronze"} />
              </div>
            </div>
            <Image
              src={qrDataUrl}
              alt="QR personal del cliente"
              width={160}
              height={160}
              unoptimized
              className="size-40 rounded-lg border border-stone-200 bg-white p-2"
            />
          </div>
          <form action={adjustLoyaltyPointsAction} className="mt-4 grid gap-3">
            <input type="hidden" name="customer_id" value={customer.id} />
            <input type="hidden" name="return_to" value={`/app/clientes/${customer.id}`} />
            <input required type="number" name="points" placeholder="Puntos (+ o -)" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <input required name="reason" placeholder="Motivo obligatorio" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <button className="h-10 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
              Ajustar puntos
            </button>
          </form>
        </ModuleCard>

        <ModuleCard title="Recompensas disponibles" description="Canjea beneficios si el cliente tiene puntos suficientes.">
          {rewards.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {rewards.map((reward) => {
                const canRedeem = (loyaltyAccount?.points_balance ?? 0) >= reward.points_required;

                return (
                  <div key={reward.id} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                    <p className="text-sm font-semibold text-stone-950">{reward.name}</p>
                    <p className="mt-1 text-xs text-stone-500">{reward.points_required} puntos</p>
                    {reward.description ? (
                      <p className="mt-2 text-sm leading-6 text-stone-600">{reward.description}</p>
                    ) : null}
                    <form action={redeemRewardAction} className="mt-4">
                      <input type="hidden" name="customer_id" value={customer.id} />
                      <input type="hidden" name="reward_id" value={reward.id} />
                      <input type="hidden" name="return_to" value={`/app/clientes/${customer.id}`} />
                      <button
                        disabled={!canRedeem}
                        className="h-9 w-full rounded-lg bg-stone-950 px-3 text-xs font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                      >
                        Canjear
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Sin recompensas" description="Crea beneficios en Fidelizacion para permitir canjes." />
          )}
        </ModuleCard>
      </section>

      <ModuleCard title="Historial de puntos" description="Movimientos de loyalty_transactions del cliente.">
        {loyaltyTransactions.length ? (
          <DataTable
            columns={["Tipo", "Puntos", "Descripcion", "Fecha"]}
            rows={loyaltyTransactions.map((transaction) => [
              <StatusBadge key="type" status={transaction.type} />,
              String(transaction.points),
              transaction.description ?? "-",
              new Date(transaction.created_at).toLocaleDateString("es-MX"),
            ])}
          />
        ) : (
          <EmptyState title="Sin movimientos de puntos" description="Las visitas completadas, ajustes y canjes apareceran aqui." />
        )}
      </ModuleCard>

      <ModuleCard title="Marketing" description="Campanas recibidas y estados manuales.">
        {campaignRecipients.length ? (
          <DataTable
            columns={["Campana", "Canal", "Estado", "Fecha"]}
            rows={campaignRecipients.map((recipient) => {
              const campaign = Array.isArray(recipient.campaigns)
                ? recipient.campaigns[0]
                : recipient.campaigns;

              return [
                campaign?.name ?? "Campana",
                campaign?.channel ?? "-",
                <StatusBadge key="status" status={recipient.status} />,
                recipient.sent_at ? new Date(recipient.sent_at).toLocaleDateString("es-MX") : "-",
              ];
            })}
          />
        ) : (
          <EmptyState title="Sin campanas recibidas" description="Cuando envies campanas simuladas, apareceran aqui." />
        )}
      </ModuleCard>

      {showWalletMvp ? (
      <section id="wallet" className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <ModuleCard title="Wallet" description="Monedero interno del cliente, sin pagos reales.">
          {walletAccount ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-stone-950 p-5 text-white">
                <p className="text-sm text-stone-400">Saldo actual</p>
                <p className="mt-3 text-4xl font-semibold">
                  {formatCurrency(Number(walletAccount.balance), walletAccount.currency)}
                </p>
                <div className="mt-4">
                  <StatusBadge status={walletAccount.status} />
                </div>
              </div>
              <form action={updateWalletStatusAction} className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input type="hidden" name="customer_id" value={customer.id} />
                <input type="hidden" name="return_to" value={`/app/clientes/${customer.id}`} />
                <select name="status" defaultValue={walletAccount.status} className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
                  <option value="active">{formatStatus("active")}</option>
                  <option value="frozen">{formatStatus("frozen")}</option>
                  <option value="closed">{formatStatus("closed")}</option>
                </select>
                <ConfirmSubmitButton
                  className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-800 transition hover:border-stone-300"
                  message="Cambiar estado de wallet?"
                >
                  Guardar estado
                </ConfirmSubmitButton>
              </form>
            </div>
          ) : (
            <form action={createWalletAccountAction} className="grid gap-3">
              <input type="hidden" name="customer_id" value={customer.id} />
              <input type="hidden" name="return_to" value={`/app/clientes/${customer.id}`} />
              <EmptyState title="Sin wallet" description="Crea una wallet para operar recargas, bonos y consumos internos." />
              <button className="h-10 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
                Crear wallet
              </button>
            </form>
          )}
        </ModuleCard>

        <ModuleCard title="Operaciones wallet" description="Recargar, consumir, otorgar bono o ajustar saldo.">
          <div className="grid gap-4 lg:grid-cols-2">
            <form action={walletTopupAction} className="grid gap-3">
              <input type="hidden" name="customer_id" value={customer.id} />
              <input type="hidden" name="return_to" value={`/app/clientes/${customer.id}`} />
              <input required name="amount" type="number" min="0.01" step="0.01" placeholder="Recarga" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="bonus" type="number" min="0" step="0.01" placeholder="Bono opcional" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="reference" placeholder="Referencia" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="comment" placeholder="Comentario" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <button className="h-10 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
                Recargar saldo
              </button>
            </form>
            <form action={walletPurchaseAction} className="grid gap-3">
              <input type="hidden" name="customer_id" value={customer.id} />
              <input type="hidden" name="return_to" value={`/app/clientes/${customer.id}`} />
              <input required name="amount" type="number" min="0.01" step="0.01" placeholder="Consumo" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="reference" placeholder="Ticket / referencia" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="comment" placeholder="Comentario" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <ConfirmSubmitButton
                className="h-10 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800"
                message="Registrar consumo con wallet?"
              >
                Aplicar consumo
              </ConfirmSubmitButton>
            </form>
            <form action={walletAdjustmentAction} className="grid gap-3 lg:col-span-2">
              <input type="hidden" name="customer_id" value={customer.id} />
              <input type="hidden" name="return_to" value={`/app/clientes/${customer.id}`} />
              <div className="grid gap-3 sm:grid-cols-3">
                <input required name="amount" type="number" step="0.01" placeholder="Ajuste (+ o -)" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
                <input name="reference" placeholder="Referencia" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
                <input required name="reason" placeholder="Motivo obligatorio" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              </div>
              <ConfirmSubmitButton
                className="h-10 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-800 transition hover:border-stone-300"
                message="Aplicar ajuste manual?"
              >
                Ajuste manual
              </ConfirmSubmitButton>
            </form>
          </div>
        </ModuleCard>
      </section>
      ) : null}

      {showWalletMvp ? (
      <ModuleCard title="Historial wallet" description="Movimientos recientes del monedero.">
        {walletTransactions.length ? (
          <DataTable
            columns={["Tipo", "Monto", "Referencia", "Descripcion", "Fecha"]}
            rows={walletTransactions.map((transaction) => [
              <StatusBadge key="type" status={transaction.type} />,
              formatCurrency(Number(transaction.amount)),
              transaction.reference ?? "-",
              transaction.description ?? "-",
              new Date(transaction.created_at).toLocaleDateString("es-MX"),
            ])}
          />
        ) : (
          <EmptyState title="Sin movimientos wallet" description="Las recargas, bonos, consumos y ajustes apareceran aqui." />
        )}
      </ModuleCard>
      ) : null}

      <section id="datos" className="grid scroll-mt-24 gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <ModuleCard title="Datos principales" description="Editar ficha del cliente.">
          <form action={updateCustomerAction} className="grid gap-3">
            <input type="hidden" name="id" value={customer.id} />
            <input required name="full_name" defaultValue={customer.full_name} className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="phone" defaultValue={customer.phone ?? ""} className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input type="email" name="email" defaultValue={customer.email ?? ""} className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            </div>
            <input type="date" name="birthday" defaultValue={customer.birthday ?? ""} className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <input name="tags" defaultValue={customer.tags.join(", ")} className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <textarea name="notes" defaultValue={customer.notes ?? ""} className="min-h-24 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">Guardar cambios</button>
          </form>
        </ModuleCard>

        <div id="actividad" className="scroll-mt-24">
        <ModuleCard title="Actividad" description="Reservas, visitas y acciones del POS.">
          {events.length ? (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm font-semibold text-stone-950">{event.title}</p>
                  <p className="mt-1 text-xs text-stone-500">{new Date(event.created_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })} · {formatEventType(event.type)}</p>
                  {event.description ? <p className="mt-2 text-sm text-stone-600">{event.description}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin timeline" description="Los eventos apareceran al crear reservas, notas y tareas." />
          )}
        </ModuleCard>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div id="reservas" className="scroll-mt-24">
        <ModuleCard title="Reservas del cliente" description="Historial operacional.">
          {reservations.length ? (
            <div className="divide-y divide-stone-200">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-sm font-semibold text-stone-950">{reservation.date} · {reservation.time.slice(0, 5)}</p><p className="mt-1 text-xs text-stone-500">{reservation.party_size} personas · {reservation.source}</p></div>
                    <StatusBadge status={reservation.status} />
                  </div>
                  {reservation.pos_sale_id ? <p className="mt-2 text-xs font-semibold text-emerald-700">Consumo conectado · {formatCurrency(Number(reservation.pos_total ?? 0))} · {reservation.pos_payment_method}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin reservas" description="Este cliente aun no tiene reservas." />
          )}
        </ModuleCard>
        </div>

        <div id="notas" className="scroll-mt-24">
        <ModuleCard title="Notas internas" description="Relacionadas al cliente o reserva.">
          <form action={createInternalNoteAction} className="mb-4 grid gap-3">
            <input type="hidden" name="customer_id" value={customer.id} />
            <select name="reservation_id" className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
              <option value="">Sin reserva asociada</option>
              {reservations.map((reservation) => (
                <option key={reservation.id} value={reservation.id}>
                  {reservation.date} {reservation.time.slice(0, 5)}
                </option>
              ))}
            </select>
            <input required name="title" placeholder="Titulo" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <textarea required name="content" placeholder="Contenido" className="min-h-20 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
            <button className="h-10 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">Agregar nota</button>
          </form>
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                <p className="text-sm font-semibold text-stone-950">{note.title}</p>
                <p className="mt-1 text-sm text-stone-600">{note.content}</p>
              </div>
            ))}
          </div>
        </ModuleCard>
        </div>

        <ModuleCard title="Tareas internas" description="Seguimiento asignable al equipo.">
          <form action={createInternalTaskAction} className="mb-4 grid gap-3">
            <input type="hidden" name="customer_id" value={customer.id} />
            <select name="assigned_to" className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
              <option value="">Sin responsable</option>
              {businessUsers.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {formatRoleName(user.role)} - {user.user_id.slice(0, 8)}
                </option>
              ))}
            </select>
            <input required name="title" placeholder="Tarea" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <textarea name="description" placeholder="Descripcion" className="min-h-20 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
            <div className="grid grid-cols-2 gap-3">
              <select name="priority" defaultValue="medium" className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
                {["low", "medium", "high", "urgent"].map((priority) => <option key={priority} value={priority}>{formatStatus(priority)}</option>)}
              </select>
              <input type="datetime-local" name="due_date" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            </div>
            <button className="h-10 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">Crear tarea</button>
          </form>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                <p className="text-sm font-semibold text-stone-950">{task.title}</p>
                <div className="mt-2 flex gap-2">
                  <StatusBadge status={task.priority} />
                  <StatusBadge status={task.status} />
                </div>
                <form action={updateTaskStatusAction} className="mt-3 flex gap-2">
                  <input type="hidden" name="task_id" value={task.id} />
                  <input type="hidden" name="customer_id" value={customer.id} />
                  <select name="status" defaultValue={task.status} className="h-9 rounded-lg border border-stone-200 bg-white px-2 text-xs outline-none">
                    {["pending", "in_progress", "completed", "cancelled"].map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
                  </select>
                  <button className="h-9 rounded-lg border border-stone-200 px-3 text-xs font-medium text-stone-700">Actualizar</button>
                </form>
              </div>
            ))}
          </div>
        </ModuleCard>
      </section>

      <ModuleCard title="Comentarios del equipo" description="Comenta una nota o tarea del cliente.">
        <form action={createInternalCommentAction} className="grid gap-3 lg:grid-cols-[1fr_1fr_2fr_auto]">
          <input type="hidden" name="customer_id" value={customer.id} />
          <select name="task_id" className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
            <option value="">Sin tarea</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>{task.title}</option>
            ))}
          </select>
          <select name="note_id" className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
            <option value="">Sin nota</option>
            {notes.map((note) => (
              <option key={note.id} value={note.id}>{note.title}</option>
            ))}
          </select>
          <input required name="comment" placeholder="Comentario" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
          <button className="h-10 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800">Comentar</button>
        </form>
        <div className="mt-4 grid gap-3">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
              {comment.comment}
            </div>
          ))}
        </div>
      </ModuleCard>
    </div>
  );
}
