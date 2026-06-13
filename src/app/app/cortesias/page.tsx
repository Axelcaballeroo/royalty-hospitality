import Link from "next/link";
import { createCourtesyAction } from "@/app/app/actions";
import { DataTable, EmptyState, ModuleCard, SectionHeader, StatCard } from "@/components/ui";
import { getDailyClosureData } from "@/lib/data";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("es-MX", {
  currency: "MXN",
  style: "currency",
});

const fieldClass =
  "h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400";

const courtesyReasons = [
  "cliente VIP",
  "cumpleaños",
  "compensación",
  "influencer",
  "invitado de casa",
  "error de cocina",
  "otro",
];

export default async function CourtesiesPage() {
  const data = await getDailyClosureData();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Operacion"
        title="Cortesias"
        description="Registra atenciones del dia y mantenlas conectadas al cierre operativo."
        actions={
          <Link href="/app/cierre" className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800">
            Abrir cierre
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Cortesias hoy" value={String(data.courtesies.length)} detail="Registros del dia" tone="dark" />
        <StatCard title="Valor estimado" value={currency.format(data.defaults.courtesyTotal)} detail="Impacta cierre" />
        <StatCard title="Fecha" value={data.date.slice(5)} detail={data.date} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <ModuleCard title="Registrar cortesia" description="Cliente, motivo, producto y valor para control del gerente.">
          <form action={createCourtesyAction} className="grid gap-3">
            <input type="hidden" name="return_to" value="/app/cortesias" />
            <input type="date" name="date" defaultValue={data.date} className={fieldClass} />
            <input required name="item_name" placeholder="Producto o cortesia" className={fieldClass} />
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
                <option key={customer.id} value={customer.id}>{customer.full_name}</option>
              ))}
            </select>
            <input name="authorized_by" placeholder="Autorizado por" className={fieldClass} />
            <button className="h-11 rounded-xl bg-stone-950 text-sm font-semibold text-white">
              Registrar cortesia
            </button>
          </form>
        </ModuleCard>

        <ModuleCard title="Cortesias registradas" description="Tambien apareceran en Cierre del dia.">
          {data.courtesies.length ? (
            <DataTable
              columns={["Producto", "Cantidad", "Valor", "Motivo", "Cliente"]}
              rows={data.courtesies.map((courtesy) => [
                courtesy.item_name,
                String(courtesy.quantity),
                currency.format(Number(courtesy.estimated_value)),
                courtesy.reason,
                courtesy.customers?.full_name ?? "-",
              ])}
            />
          ) : (
            <EmptyState title="Sin cortesias hoy" description="Cuando registres una cortesia, quedara lista para el cierre." />
          )}
        </ModuleCard>
      </section>
    </div>
  );
}
