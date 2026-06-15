import Link from "next/link";
import { ArrowLeft, Coffee, LogIn, LogOut } from "lucide-react";
import {
  clockInAction,
  clockOutAction,
  endBreakAction,
  startBreakAction,
} from "@/app/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DataTable, EmptyState, ModuleCard, StatCard, StatusBadge } from "@/components/ui";
import { getTimeClockData } from "@/lib/data";
import { estimateWorkedHours, formatHours } from "@/lib/hr";
import { UpgradeModuleScreen } from "@/components/upgrade-module-screen";
import { hasModule } from "@/lib/plans";

export const dynamic = "force-dynamic";

const fieldClass =
  "h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400";

export default async function TimeClockPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  if (!(await hasModule("hr"))) {
    return <UpgradeModuleScreen moduleKey="hr" />;
  }

  const { employees, shiftsToday, openEntries, entriesToday } = await getTimeClockData();
  const openEmployeeIds = new Set(openEntries.map((entry) => entry.employee_id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/app/rrhh" className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-stone-950" prefetch={false}>
            <ArrowLeft size={16} />
            Volver a RRHH
          </Link>
          <p className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
            Checador
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-950">
            Entradas, salidas y descansos
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            Registro manual responsive para el staff. Evita doble entrada, salida sin entrada y descansos inconsistentes.
          </p>
        </div>
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

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard title="Empleados activos" value={String(employees.length)} detail="Disponibles para checar" tone="dark" />
        <StatCard title="Trabajando" value={String(openEntries.length)} detail="Entradas abiertas" />
        <StatCard title="Turnos hoy" value={String(shiftsToday.length)} detail="Programados" />
        <StatCard title="Checadas hoy" value={String(entriesToday.length)} detail="Entradas registradas" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ModuleCard title="Registrar entrada" description="Selecciona empleado y turno opcional.">
          <form action={clockInAction} className="grid gap-3">
            <select required name="employee_id" className={fieldClass}>
              <option value="">Seleccionar empleado</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id} disabled={openEmployeeIds.has(employee.id)}>
                  {employee.full_name} {openEmployeeIds.has(employee.id) ? "/ ya checado" : ""}
                </option>
              ))}
            </select>
            <select name="shift_id" className={fieldClass}>
              <option value="">Sin turno vinculado</option>
              {shiftsToday.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.employees?.full_name ?? "Empleado"} / {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                </option>
              ))}
            </select>
            <input name="notes" placeholder="Notas opcionales" className={fieldClass} />
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
              <LogIn size={16} />
              Registrar entrada
            </button>
          </form>
        </ModuleCard>

        <ModuleCard title="Empleados trabajando" description="Acciones disponibles sobre entradas abiertas.">
          {openEntries.length ? (
            <div className="space-y-3">
              {openEntries.map((entry) => {
                const onBreak = Boolean(entry.break_start && !entry.break_end);
                return (
                  <div key={entry.id} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-stone-950">{entry.employees?.full_name ?? "Empleado"}</p>
                        <p className="mt-1 text-xs text-stone-500">
                          Entrada {new Date(entry.clock_in).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} / {formatHours(estimateWorkedHours(entry))}
                        </p>
                        {entry.shifts ? (
                          <p className="mt-1 text-xs text-stone-500">
                            Turno {entry.shifts.start_time.slice(0, 5)} - {entry.shifts.end_time.slice(0, 5)}
                          </p>
                        ) : null}
                      </div>
                      <StatusBadge status={onBreak ? "on_break" : "working"} />
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      {onBreak ? (
                        <form action={endBreakAction}>
                          <input type="hidden" name="employee_id" value={entry.employee_id} />
                          <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-800 transition hover:border-stone-300">
                            <Coffee size={15} />
                            Terminar descanso
                          </button>
                        </form>
                      ) : (
                        <form action={startBreakAction}>
                          <input type="hidden" name="employee_id" value={entry.employee_id} />
                          <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-800 transition hover:border-stone-300">
                            <Coffee size={15} />
                            Iniciar descanso
                          </button>
                        </form>
                      )}
                      <form action={clockOutAction} className="sm:col-span-2">
                        <input type="hidden" name="employee_id" value={entry.employee_id} />
                        <input name="notes" placeholder="Notas de salida" className={fieldClass} />
                        <ConfirmSubmitButton
                          className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-stone-950 px-3 text-sm font-medium text-white transition hover:bg-stone-800"
                          message="Registrar salida de este empleado?"
                        >
                          <LogOut size={15} />
                          Registrar salida
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Nadie esta trabajando ahora" description="Registra una entrada para iniciar el control del turno." />
          )}
        </ModuleCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ModuleCard title="Turnos de hoy" description="Referencia rapida para vincular entradas.">
          {shiftsToday.length ? (
            <DataTable
              columns={["Empleado", "Horario", "Rol", "Estado"]}
              rows={shiftsToday.map((shift) => [
                shift.employees?.full_name ?? "Empleado",
                `${shift.start_time.slice(0, 5)} - ${shift.end_time.slice(0, 5)}`,
                shift.role ?? "-",
                <StatusBadge key="status" status={shift.status} />,
              ])}
            />
          ) : (
            <EmptyState title="Sin turnos hoy" description="Puedes checar empleados aunque no tengan turno vinculado." />
          )}
        </ModuleCard>

        <ModuleCard title="Checadas de hoy" description="Entradas cerradas y pendientes.">
          {entriesToday.length ? (
            <DataTable
              columns={["Empleado", "Entrada", "Salida", "Horas", "Descanso"]}
              rows={entriesToday.map((entry) => [
                entry.employees?.full_name ?? "Empleado",
                new Date(entry.clock_in).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
                entry.clock_out
                  ? new Date(entry.clock_out).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
                  : "Pendiente",
                formatHours(estimateWorkedHours(entry)),
                entry.break_start
                  ? entry.break_end
                    ? "Finalizado"
                    : "Activo"
                  : "-",
              ])}
            />
          ) : (
            <EmptyState title="Sin checadas hoy" description="Las entradas del dia apareceran en esta tabla." />
          )}
        </ModuleCard>
      </section>
    </div>
  );
}
