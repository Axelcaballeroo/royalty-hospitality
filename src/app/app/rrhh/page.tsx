import Link from "next/link";
import { Clock, Plus, UserRoundCheck } from "lucide-react";
import {
  cancelShiftAction,
  createEmployeeAction,
  createShiftAction,
  updateShiftAction,
} from "@/app/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ActionCard, DataTable, EmptyState, ModuleCard, StatCard, StatusBadge } from "@/components/ui";
import { getHrData } from "@/lib/data";
import { employeeStatuses, formatHours, getTodayDate, shiftStatuses } from "@/lib/hr";
import { UpgradeModuleScreen } from "@/components/upgrade-module-screen";
import { hasModule } from "@/lib/plans";

export const dynamic = "force-dynamic";

const fieldClass =
  "h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  if (!(await hasModule("hr"))) {
    return <UpgradeModuleScreen moduleKey="hr" />;
  }

  const {
    employees,
    shiftsToday,
    upcomingShifts,
    openEntries,
    entriesToday,
    businessUsers,
    summary,
  } = await getHrData();
  const today = getTodayDate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
            Equipo
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-950">
            Equipo y operacion interna
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            Empleados, turnos, tareas internas, comentarios y checador en un solo flujo operativo.
          </p>
        </div>
        <Link
          href="/app/rrhh/checador"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          <Clock size={16} />
          Abrir checador
        </Link>
      </div>

      {params.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {params.error}
        </p>
      ) : null}
      {params.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {params.success}
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Empleados activos" value={String(summary.activeEmployees)} detail="Equipo operativo" tone="dark" />
        <StatCard title="Turnos de hoy" value={String(summary.shiftsToday)} detail={today} />
        <StatCard title="Entradas hoy" value={String(summary.entriesToday)} detail="Checadas registradas" />
        <StatCard title="Salidas pendientes" value={String(summary.pendingClockOuts)} detail="Entradas abiertas" />
        <StatCard title="Turnos perdidos" value={String(summary.missedShifts)} detail="Incidencias basicas" />
        <StatCard title="Horas semana" value={formatHours(summary.weekHours)} detail="Estimadas, sin nomina" />
      </section>

      <ModuleCard title="Flujos del equipo" description="Accesos principales para coordinar sala, cocina y administracion.">
        <div className="grid gap-3 md:grid-cols-3">
          <ActionCard title="Checador" description="Registra entradas, salidas y descansos." href="/app/rrhh/checador" action="Abrir" />
          <ActionCard title="Tareas internas" description="Coordina pendientes del equipo." href="/app/crm-interno" action="Ver tareas" />
          <ActionCard title="Comentarios" description="Da seguimiento a notas operativas." href="/app/crm-interno" action="Abrir" />
        </div>
      </ModuleCard>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ModuleCard title="Crear empleado" description="Agrega a una persona del equipo para turnos y checador.">
          <form action={createEmployeeAction} className="grid gap-3">
            <input required name="full_name" placeholder="Nombre completo" className={fieldClass} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="phone" placeholder="Telefono" className={fieldClass} />
              <input name="email" type="email" placeholder="Email" className={fieldClass} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input name="position" placeholder="Puesto" className={fieldClass} />
              <select name="status" defaultValue="active" className={fieldClass}>
                {employeeStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "active" ? "activo" : "inactivo"}
                  </option>
                ))}
              </select>
              <select name="user_id" defaultValue="" className={fieldClass}>
                <option value="">Sin usuario vinculado</option>
                {businessUsers.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.role} / {user.user_id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
              <Plus size={16} />
              Crear empleado
            </button>
          </form>
        </ModuleCard>

        <ModuleCard title="Crear turno" description="Programa turnos por empleado, fecha y rol.">
          <form action={createShiftAction} className="grid gap-3">
            <select required name="employee_id" className={fieldClass}>
              <option value="">Seleccionar empleado</option>
              {employees.filter((employee) => employee.status === "active").map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name} / {employee.position ?? "sin puesto"}
                </option>
              ))}
            </select>
            <div className="grid gap-3 sm:grid-cols-3">
              <input required name="date" type="date" defaultValue={today} className={fieldClass} />
              <input required name="start_time" type="time" className={fieldClass} />
              <input required name="end_time" type="time" className={fieldClass} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="role" placeholder="Rol del turno" className={fieldClass} />
              <select name="status" defaultValue="scheduled" className={fieldClass}>
                {shiftStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "scheduled" ? "programado" : status === "completed" ? "completado" : "cancelado"}
                  </option>
                ))}
              </select>
            </div>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
              <Plus size={16} />
              Crear turno
            </button>
          </form>
        </ModuleCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ModuleCard title="Empleados" description="Equipo del negocio actual.">
          {employees.length ? (
            <DataTable
              columns={["Empleado", "Puesto", "Contacto", "Estado", "Detalle"]}
              rows={employees.map((employee) => [
                employee.full_name,
                employee.position ?? "-",
                employee.phone ?? employee.email ?? "-",
                <StatusBadge key="status" status={employee.status} />,
                <Link key="detail" href={`/app/rrhh/${employee.id}`} className="font-medium text-stone-950 hover:underline">
                  Abrir
                </Link>,
              ])}
            />
          ) : (
            <EmptyState title="Sin empleados" description="Crea el primer empleado para usar turnos y checador." />
          )}
        </ModuleCard>

        <ModuleCard title="Trabajando ahora" description="Entradas abiertas y descansos activos.">
          {openEntries.length ? (
            <div className="space-y-3">
              {openEntries.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">{entry.employees?.full_name ?? "Empleado"}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        Entrada {new Date(entry.clock_in).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <StatusBadge status={entry.break_start && !entry.break_end ? "on_break" : "working"} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin entradas abiertas" description="Cuando el equipo cheque entrada aparecera aqui." />
          )}
        </ModuleCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ModuleCard title="Turnos de hoy" description="Agenda operativa del dia.">
          {shiftsToday.length ? (
            <DataTable
              columns={["Empleado", "Horario", "Rol", "Estado", "Accion"]}
              rows={shiftsToday.map((shift) => [
                shift.employees?.full_name ?? "Empleado",
                `${shift.start_time.slice(0, 5)} - ${shift.end_time.slice(0, 5)}`,
                shift.role ?? "-",
                <StatusBadge key="status" status={shift.status} />,
                <form key="cancel" action={cancelShiftAction}>
                  <input type="hidden" name="shift_id" value={shift.id} />
                  <input type="hidden" name="employee_id" value={shift.employee_id} />
                  <ConfirmSubmitButton
                    className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-800 transition hover:border-stone-300"
                    message="Cancelar este turno?"
                  >
                    Cancelar
                  </ConfirmSubmitButton>
                </form>,
              ])}
            />
          ) : (
            <EmptyState title="Sin turnos hoy" description="Programa turnos para ver la agenda diaria del equipo." />
          )}
        </ModuleCard>

        <ModuleCard title="Proximos turnos" description="Turnos programados para los siguientes dias.">
          {upcomingShifts.length ? (
            <div className="space-y-3">
              {upcomingShifts.map((shift) => (
                <form key={shift.id} action={updateShiftAction} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <input type="hidden" name="shift_id" value={shift.id} />
                  <input type="hidden" name="return_to" value="/app/rrhh" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select name="employee_id" defaultValue={shift.employee_id} className={fieldClass}>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.full_name}
                        </option>
                      ))}
                    </select>
                    <select name="status" defaultValue={shift.status} className={fieldClass}>
                      {shiftStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4">
                    <input required name="date" type="date" defaultValue={shift.date} className={fieldClass} />
                    <input required name="start_time" type="time" defaultValue={shift.start_time.slice(0, 5)} className={fieldClass} />
                    <input required name="end_time" type="time" defaultValue={shift.end_time.slice(0, 5)} className={fieldClass} />
                    <input name="role" defaultValue={shift.role ?? ""} placeholder="Rol" className={fieldClass} />
                  </div>
                  <button className="mt-3 h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-800 transition hover:border-stone-300">
                    Guardar turno
                  </button>
                </form>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin proximos turnos" description="Los turnos futuros apareceran en esta lista." />
          )}
        </ModuleCard>
      </section>

        <ModuleCard title="Resumen del equipo" description="Lectura operativa sin calculo de nomina.">
        <div className="grid gap-3 md:grid-cols-5">
          {[
            ["Horas semana", formatHours(summary.weekHours)],
            ["Entradas tardias", `${summary.lateEntries} registros`],
            ["Salidas pendientes", String(summary.pendingClockOuts)],
            ["Turnos completados", String(summary.completedShifts)],
            ["Turnos perdidos", String(summary.missedShifts)],
          ].map(([title, value]) => (
            <div key={title} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <UserRoundCheck className="text-stone-500" size={18} />
              <p className="mt-3 text-xs text-stone-500">{title}</p>
              <p className="mt-1 text-lg font-semibold text-stone-950">{value}</p>
            </div>
          ))}
        </div>
      </ModuleCard>

      <ModuleCard title="Entradas registradas hoy" description="Historial rapido de checadas del dia.">
        {entriesToday.length ? (
          <DataTable
            columns={["Empleado", "Entrada", "Salida", "Descanso", "Notas"]}
            rows={entriesToday.map((entry) => [
              entry.employees?.full_name ?? "Empleado",
              new Date(entry.clock_in).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
              entry.clock_out
                ? new Date(entry.clock_out).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
                : "Pendiente",
              entry.break_start
                ? entry.break_end
                  ? "Finalizado"
                  : "Activo"
                : "-",
              entry.notes ?? "-",
            ])}
          />
        ) : (
          <EmptyState title="Sin entradas hoy" description="El checador comenzara a llenar esta tabla." />
        )}
      </ModuleCard>
    </div>
  );
}
