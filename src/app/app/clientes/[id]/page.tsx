import Link from "next/link";
import { notFound } from "next/navigation";
import {
  adjustLoyaltyPointsAction,
  createInternalCommentAction,
  createInternalNoteAction,
  createInternalTaskAction,
  redeemRewardAction,
  updateCustomerAction,
  updateTaskStatusAction,
} from "@/app/app/actions";
import { getCustomerDetail } from "@/lib/data";
import { DataTable, EmptyState, ModuleCard, StatusBadge } from "@/components/ui";

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
    notes,
    tasks,
    comments,
    businessUsers,
    loyaltyAccount,
    loyaltyTransactions,
    rewards,
  } =
    await getCustomerDetail(id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/clientes" className="text-sm font-medium text-stone-500 hover:text-stone-950">
          Volver a clientes
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-stone-950">
          {customer.full_name}
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          {customer.phone ?? "Sin telefono"} / {customer.email ?? "Sin email"}
        </p>
      </div>
      {messages.error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{messages.error}</p> : null}
      {messages.success ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{messages.success}</p> : null}

      <section className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <ModuleCard title="Fidelizacion" description="Cuenta de puntos, nivel actual y ajuste manual.">
          <div className="rounded-lg bg-stone-950 p-5 text-white">
            <p className="text-sm text-stone-400">Puntos actuales</p>
            <p className="mt-3 text-4xl font-semibold">
              {loyaltyAccount?.points_balance ?? 0}
            </p>
            <div className="mt-4">
              <StatusBadge status={loyaltyAccount?.tier ?? "bronze"} />
            </div>
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

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
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

        <ModuleCard title="Timeline" description="Eventos desde customer_events.">
          {events.length ? (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm font-semibold text-stone-950">{event.title}</p>
                  <p className="mt-1 text-xs text-stone-500">{event.type}</p>
                  {event.description ? <p className="mt-2 text-sm text-stone-600">{event.description}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin timeline" description="Los eventos apareceran al crear reservas, notas y tareas." />
          )}
        </ModuleCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <ModuleCard title="Reservas del cliente" description="Historial operacional.">
          {reservations.length ? (
            <DataTable
              columns={["Fecha", "Hora", "Pax", "Estado"]}
              rows={reservations.map((reservation) => [
                reservation.date,
                reservation.time.slice(0, 5),
                String(reservation.party_size),
                <StatusBadge key="status" status={reservation.status} />,
              ])}
            />
          ) : (
            <EmptyState title="Sin reservas" description="Este cliente aun no tiene reservas." />
          )}
        </ModuleCard>

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

        <ModuleCard title="Tareas internas" description="Seguimiento asignable al equipo.">
          <form action={createInternalTaskAction} className="mb-4 grid gap-3">
            <input type="hidden" name="customer_id" value={customer.id} />
            <select name="assigned_to" className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
              <option value="">Sin responsable</option>
              {businessUsers.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.role} - {user.user_id.slice(0, 8)}
                </option>
              ))}
            </select>
            <input required name="title" placeholder="Tarea" className="h-10 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <textarea name="description" placeholder="Descripcion" className="min-h-20 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
            <div className="grid grid-cols-2 gap-3">
              <select name="priority" defaultValue="medium" className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
                {["low", "medium", "high", "urgent"].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
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
                    {["pending", "in_progress", "completed", "cancelled"].map((status) => <option key={status} value={status}>{status}</option>)}
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
