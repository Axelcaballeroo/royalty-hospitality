import Link from "next/link";
import { createCourtesyAction, upsertDailyClosureAction } from "@/app/app/actions";
import { DataTable, EmptyState, ModuleCard, SectionHeader, StatCard, StatusBadge } from "@/components/ui";
import { getDailyClosureData } from "@/lib/data";
import { formatEventType } from "@/lib/formatters";

export const dynamic = "force-dynamic";

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

export default async function DailyClosurePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const data = await getDailyClosureData(params.date);
  const closure = data.closure;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={data.current.business.name}
        title="Cierre interno del dia"
        description="Registra ventas estimadas, reservas, no-shows, cortesias, incidencias, merma y notas del gerente."
        actions={
          <Link
            href="/app/operacion"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-800 transition hover:border-stone-300"
          >
            Volver a operacion
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

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard title="Fecha" value={data.date.slice(5)} detail={data.date} tone="dark" />
        <StatCard title="Reservas completadas" value={String(closure?.completed_reservations ?? data.defaults.completedReservations)} detail="Default desde reservas" />
        <StatCard title="No-shows" value={String(closure?.no_shows ?? data.defaults.noShows)} detail="Default desde reservas" />
        <StatCard title="Cortesias" value={currency.format(closure?.courtesy_total ?? data.defaults.courtesyTotal)} detail={`${data.courtesies.length} registros`} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <ModuleCard title="Formulario de cierre" description="Guarda borrador o marca el cierre como cerrado.">
          <form action={upsertDailyClosureAction} className="grid gap-3">
            <input type="date" name="date" defaultValue={data.date} className={fieldClass} />
            <textarea
              name="summary"
              defaultValue={closure?.summary ?? ""}
              placeholder="Resumen del dia"
              className="min-h-24 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <input name="estimated_sales" type="number" min="0" step="0.01" defaultValue={closure?.estimated_sales ?? 0} placeholder="Ventas estimadas" className={fieldClass} />
              <input name="completed_reservations" type="number" min="0" defaultValue={closure?.completed_reservations ?? data.defaults.completedReservations} placeholder="Reservas completadas" className={fieldClass} />
              <input name="no_shows" type="number" min="0" defaultValue={closure?.no_shows ?? data.defaults.noShows} placeholder="No-shows" className={fieldClass} />
              <input name="courtesy_total" type="number" min="0" step="0.01" defaultValue={closure?.courtesy_total ?? data.defaults.courtesyTotal} placeholder="Cortesias" className={fieldClass} />
              <input name="waste_total" type="number" min="0" step="0.01" defaultValue={closure?.waste_total ?? data.defaults.wasteTotal} placeholder="Merma registrada" className={fieldClass} />
            </div>
            <textarea
              name="incidents"
              defaultValue={closure?.incidents ?? ""}
              placeholder="Incidencias"
              className="min-h-24 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
            />
            <textarea
              name="manager_notes"
              defaultValue={closure?.manager_notes ?? ""}
              placeholder="Notas del gerente"
              className="min-h-24 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <button name="status" value="draft" className="h-11 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-800 transition hover:border-stone-300">
                Guardar borrador
              </button>
              <button name="status" value="closed" className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
                Cerrar dia
              </button>
            </div>
          </form>
        </ModuleCard>

        <ModuleCard title="Agregar cortesia" description="Registra cortesias para que queden conectadas al cierre.">
          <form action={createCourtesyAction} className="grid gap-3">
            <input type="hidden" name="return_to" value={`/app/cierre?date=${data.date}`} />
            <input type="date" name="date" defaultValue={data.date} className={fieldClass} />
            <input required name="item_name" placeholder="Cortesia o producto" className={fieldClass} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="quantity" type="number" min="1" defaultValue={1} placeholder="Cantidad" className={fieldClass} />
              <input name="estimated_value" type="number" min="0" step="0.01" placeholder="Valor estimado" className={fieldClass} />
            </div>
            <select name="reason" defaultValue="cliente VIP" className={fieldClass}>
              {courtesyReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            <select name="customer_id" className={fieldClass}>
              <option value="">Cliente opcional</option>
              {data.customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name}
                </option>
              ))}
            </select>
            <select name="employee_id" className={fieldClass}>
              <option value="">Empleado opcional</option>
              {data.employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
            <input name="authorized_by" placeholder="Autorizado por" className={fieldClass} />
            <textarea name="notes" placeholder="Notas" className="min-h-20 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
              Agregar cortesia
            </button>
          </form>
        </ModuleCard>
      </section>

      <ModuleCard title="Cortesias registradas" description="Detalle conectado al cierre operativo.">
        {data.courtesies.length ? (
          <DataTable
            columns={["Item", "Cantidad", "Valor", "Motivo", "Cliente", "Autorizo"]}
            rows={data.courtesies.map((courtesy) => [
              courtesy.item_name,
              String(courtesy.quantity),
              currency.format(Number(courtesy.estimated_value)),
              courtesy.reason,
              courtesy.customers?.full_name ?? "-",
              courtesy.authorized_by ?? "-",
            ])}
          />
        ) : (
          <EmptyState title="Sin cortesias" description="Agrega cortesias para verlas reflejadas en el cierre." />
        )}
      </ModuleCard>

      <ModuleCard title="Estado del cierre" description="Resumen operativo guardado.">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={closure?.status ?? "draft"} />
          <p className="text-sm text-stone-600">
            {closure ? `Actualizado ${new Date(closure.updated_at).toLocaleString("es-MX")}` : "Todavia no hay cierre guardado para esta fecha."}
          </p>
        </div>
      </ModuleCard>
    </div>
  );
}
