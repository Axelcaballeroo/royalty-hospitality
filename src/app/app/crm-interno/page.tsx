import Link from "next/link";
import {
  createInternalCommentAction,
  createInternalTaskAction,
  updateTaskStatusAction,
} from "@/app/app/actions";
import { DataTable, EmptyState, ModuleCard, SectionHeader, StatCard, StatusBadge } from "@/components/ui";
import { getInternalCrmData } from "@/lib/data";
import { formatEventType, formatRoleName, formatStatus } from "@/lib/formatters";

export const dynamic = "force-dynamic";

const fieldClass =
  "h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400";

export default async function InternalCrmPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const { tasks, notes, comments, customers, reservations, businessUsers, metrics } =
    await getInternalCrmData();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Comunicacion interna"
        title="CRM Interno"
        description="Coordina tareas, notas, comentarios y seguimientos del equipo sin mezclarlo con la base comercial de clientes."
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Pendientes" value={String(metrics.pendingTasks)} detail="Tareas abiertas" tone="dark" />
        <StatCard title="Completadas" value={String(metrics.completedTasks)} detail="Tareas cerradas" />
        <StatCard title="Notas" value={String(metrics.notes)} detail="Contexto interno" />
        <StatCard title="Comentarios" value={String(metrics.comments)} detail="Actividad reciente" />
        <StatCard title="Responsables" value={String(metrics.assignedUsers)} detail="Equipo asignado" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ModuleCard title="Crear tarea interna" description="Ejemplo: Juan le asigna a Roberto preparar insumos para evento VIP.">
          <form action={createInternalTaskAction} className="grid gap-3">
            <input type="hidden" name="return_to" value="/app/crm-interno" />
            <input required name="title" placeholder="Tarea para el equipo" className={fieldClass} />
            <textarea name="description" placeholder="Descripcion y contexto operativo" className="min-h-24 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
            <div className="grid gap-3 md:grid-cols-2">
              <select name="assigned_to" className={fieldClass}>
                <option value="">Sin responsable</option>
                {businessUsers.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {formatRoleName(user.role)} - {user.user_id.slice(0, 8)}
                  </option>
                ))}
              </select>
              <input type="datetime-local" name="due_date" className={fieldClass} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <select name="customer_id" className={fieldClass}>
                <option value="">Sin cliente asociado</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.full_name}</option>
                ))}
              </select>
              <select name="reservation_id" className={fieldClass}>
                <option value="">Sin reserva asociada</option>
                {reservations.map((reservation) => {
                  const customer = Array.isArray(reservation.customers)
                    ? reservation.customers[0]
                    : reservation.customers;
                  return (
                    <option key={reservation.id} value={reservation.id}>
                      {reservation.date} {reservation.time.slice(0, 5)} - {customer?.full_name ?? "Cliente"}
                    </option>
                  );
                })}
              </select>
              <select name="priority" defaultValue="medium" className={fieldClass}>
                {["low", "medium", "high", "urgent"].map((priority) => (
                  <option key={priority} value={priority}>{formatStatus(priority)}</option>
                ))}
              </select>
            </div>
            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
              Crear tarea interna
            </button>
          </form>
        </ModuleCard>

        <ModuleCard title="Tareas asignadas" description="Seguimientos pendientes por responsable, cliente o reserva.">
          {tasks.length ? (
            <DataTable
              columns={["Tarea", "Responsable", "Relacion", "Estado", "Vence", "Accion"]}
              rows={tasks.map((task) => [
                <div key="task">
                  <p className="font-medium text-stone-950">{task.title}</p>
                  {task.description ? <p className="mt-1 text-xs text-stone-500">{task.description}</p> : null}
                </div>,
                task.assigned_to ? task.assigned_to.slice(0, 8) : "Sin responsable",
                task.customers ? (
                  <Link key="customer" href={`/app/clientes/${task.customers.id}`} className="font-medium text-stone-950 hover:underline">
                    {task.customers.full_name}
                  </Link>
                ) : task.reservations ? `${task.reservations.date} ${task.reservations.time.slice(0, 5)}` : "General",
                <div key="badges" className="flex gap-2">
                  <StatusBadge status={task.priority} />
                  <StatusBadge status={task.status} />
                </div>,
                task.due_date ? new Date(task.due_date).toLocaleString("es-MX") : "-",
                <form key="status" action={updateTaskStatusAction} className="flex gap-2">
                  <input type="hidden" name="task_id" value={task.id} />
                  <input type="hidden" name="customer_id" value={task.customers?.id ?? ""} />
                  <input type="hidden" name="return_to" value="/app/crm-interno" />
                  <select name="status" defaultValue={task.status} className="h-9 rounded-lg border border-stone-200 bg-white px-2 text-xs outline-none">
                    {["pending", "in_progress", "completed", "cancelled"].map((status) => (
                      <option key={status} value={status}>{formatStatus(status)}</option>
                    ))}
                  </select>
                  <button className="h-9 rounded-lg border border-stone-200 px-3 text-xs font-medium text-stone-700">
                    Guardar
                  </button>
                </form>,
              ])}
            />
          ) : (
            <EmptyState title="Sin tareas internas" description="Crea una tarea para coordinar al equipo." />
          )}
        </ModuleCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <ModuleCard title="Comentarios recientes" description="Actividad del equipo en tareas y notas.">
          <form action={createInternalCommentAction} className="mb-4 grid gap-3">
            <input type="hidden" name="customer_id" value="" />
            <input type="hidden" name="return_to" value="/app/crm-interno" />
            <select name="task_id" className={fieldClass}>
              <option value="">Seleccionar tarea</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </select>
            <input required name="comment" placeholder="Comentario interno" className={fieldClass} />
            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white">Comentar tarea</button>
          </form>
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                <p className="text-sm text-stone-700">{comment.comment}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {comment.internal_tasks?.title ?? comment.internal_notes?.title ?? "Actividad interna"}
                </p>
              </div>
            ))}
          </div>
        </ModuleCard>

        <ModuleCard title="Notas internas" description="Notas de contexto relacionadas con clientes o reservas.">
          {notes.length ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                  <p className="text-sm font-semibold text-stone-950">{note.title}</p>
                  <p className="mt-1 text-sm text-stone-600">{note.content}</p>
                  {note.customers ? (
                    <Link href={`/app/clientes/${note.customers.id}`} className="mt-2 inline-flex text-xs font-medium text-stone-950 hover:underline">
                      {note.customers.full_name}
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin notas internas" description="Las notas creadas desde clientes apareceran aqui." />
          )}
        </ModuleCard>

        <ModuleCard title="Actividad del equipo" description="Resumen rapido de seguimiento interno.">
          <div className="space-y-3">
            {tasks.slice(0, 8).map((task) => (
              <div key={task.id} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                <p className="text-sm font-medium text-stone-950">{task.title}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {formatStatus(task.status)} / {task.assigned_to ? `Asignada a ${task.assigned_to.slice(0, 8)}` : "Sin responsable"}
                </p>
              </div>
            ))}
            {!tasks.length ? <EmptyState title="Sin actividad" description="La actividad del equipo aparecera cuando creen tareas." /> : null}
          </div>
        </ModuleCard>
      </section>
    </div>
  );
}
