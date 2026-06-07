import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  createShiftAction,
  updateEmployeeAction,
  updateShiftAction,
} from "@/app/app/actions";
import { DataTable, EmptyState, ModuleCard, StatCard, StatusBadge } from "@/components/ui";
import { getEmployeeDetail } from "@/lib/data";
import { employeeStatuses, formatHours, getTodayDate, shiftStatuses, estimateWorkedHours } from "@/lib/hr";

export const dynamic = "force-dynamic";

const fieldClass =
  "h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400";

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { employeeId } = await params;
  const query = await searchParams;
  const { employee, upcomingShifts, clockEntries, businessUsers, weekHours } =
    await getEmployeeDetail(employeeId);
  const today = getTodayDate();

  if (!employee) {
    return (
      <div className="space-y-6">
        <Link href="/app/rrhh" className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-stone-950">
          <ArrowLeft size={16} />
          Volver a RRHH
        </Link>
        <EmptyState title="Empleado no encontrado" description="No existe en el negocio actual o fue eliminado." />
      </div>
    );
  }

  const completedEntries = clockEntries.filter((entry) => entry.clock_out).length;
  const openEntry = clockEntries.find((entry) => !entry.clock_out);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/app/rrhh" className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-stone-950">
            <ArrowLeft size={16} />
            Volver a RRHH
          </Link>
          <p className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
            Empleado
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-950">{employee.full_name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            Datos principales, turnos proximos e historial de entradas/salidas.
          </p>
        </div>
        <StatusBadge status={employee.status} />
      </div>

      {query.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {query.error}
        </p>
      ) : null}
      {query.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {query.success}
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard title="Horas semana" value={formatHours(weekHours)} detail="Estimadas" tone="dark" />
        <StatCard title="Turnos proximos" value={String(upcomingShifts.length)} detail="Programados" />
        <StatCard title="Entradas cerradas" value={String(completedEntries)} detail="Historial visible" />
        <StatCard title="Estado actual" value={openEntry ? "Trabajando" : "Fuera"} detail="Segun checador" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ModuleCard title="Editar empleado" description="Actualiza datos principales y usuario vinculado si aplica.">
          <form action={updateEmployeeAction} className="grid gap-3">
            <input type="hidden" name="employee_id" value={employee.id} />
            <input type="hidden" name="return_to" value={`/app/rrhh/${employee.id}`} />
            <input required name="full_name" defaultValue={employee.full_name} className={fieldClass} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="phone" defaultValue={employee.phone ?? ""} placeholder="Telefono" className={fieldClass} />
              <input name="email" type="email" defaultValue={employee.email ?? ""} placeholder="Email" className={fieldClass} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input name="position" defaultValue={employee.position ?? ""} placeholder="Puesto" className={fieldClass} />
              <select name="status" defaultValue={employee.status} className={fieldClass}>
                {employeeStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select name="user_id" defaultValue={employee.user_id ?? ""} className={fieldClass}>
                <option value="">Sin usuario vinculado</option>
                {businessUsers.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.role} / {user.user_id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
              Guardar empleado
            </button>
          </form>
        </ModuleCard>

        <ModuleCard title="Crear turno para empleado" description="Programa un turno directamente en esta ficha.">
          <form action={createShiftAction} className="grid gap-3">
            <input type="hidden" name="employee_id" value={employee.id} />
            <input type="hidden" name="return_to" value={`/app/rrhh/${employee.id}`} />
            <div className="grid gap-3 sm:grid-cols-3">
              <input required name="date" type="date" defaultValue={today} className={fieldClass} />
              <input required name="start_time" type="time" className={fieldClass} />
              <input required name="end_time" type="time" className={fieldClass} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="role" defaultValue={employee.position ?? ""} placeholder="Rol del turno" className={fieldClass} />
              <select name="status" defaultValue="scheduled" className={fieldClass}>
                {shiftStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
              Crear turno
            </button>
          </form>
        </ModuleCard>
      </section>

      <ModuleCard title="Turnos proximos" description="Edita estado, horario y rol.">
        {upcomingShifts.length ? (
          <div className="space-y-3">
            {upcomingShifts.map((shift) => (
              <form key={shift.id} action={updateShiftAction} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <input type="hidden" name="shift_id" value={shift.id} />
                <input type="hidden" name="employee_id" value={employee.id} />
                <input type="hidden" name="return_to" value={`/app/rrhh/${employee.id}`} />
                <div className="grid gap-3 sm:grid-cols-5">
                  <input required name="date" type="date" defaultValue={shift.date} className={fieldClass} />
                  <input required name="start_time" type="time" defaultValue={shift.start_time.slice(0, 5)} className={fieldClass} />
                  <input required name="end_time" type="time" defaultValue={shift.end_time.slice(0, 5)} className={fieldClass} />
                  <input name="role" defaultValue={shift.role ?? ""} placeholder="Rol" className={fieldClass} />
                  <select name="status" defaultValue={shift.status} className={fieldClass}>
                    {shiftStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="mt-3 h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-800 transition hover:border-stone-300">
                  Guardar turno
                </button>
              </form>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin turnos proximos" description="Crea el siguiente turno desde esta ficha." />
        )}
      </ModuleCard>

      <ModuleCard title="Historial de entradas/salidas" description="Horas estimadas por registro.">
        {clockEntries.length ? (
          <DataTable
            columns={["Entrada", "Salida", "Descanso", "Turno", "Horas", "Notas"]}
            rows={clockEntries.map((entry) => [
              new Date(entry.clock_in).toLocaleString("es-MX"),
              entry.clock_out ? new Date(entry.clock_out).toLocaleString("es-MX") : "Pendiente",
              entry.break_start
                ? entry.break_end
                  ? "Finalizado"
                  : "Activo"
                : "-",
              entry.shifts
                ? `${entry.shifts.date} ${entry.shifts.start_time.slice(0, 5)}`
                : "-",
              formatHours(estimateWorkedHours(entry)),
              entry.notes ?? "-",
            ])}
          />
        ) : (
          <EmptyState title="Sin checadas" description="El historial aparecera cuando el empleado use el checador." />
        )}
      </ModuleCard>
    </div>
  );
}
