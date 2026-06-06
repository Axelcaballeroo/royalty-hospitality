import Link from "next/link";
import { createCustomerAction } from "@/app/app/actions";
import { getCustomersData } from "@/lib/data";
import { DataTable, EmptyState, ModuleCard, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const { customers } = await getCustomersData();

  const rows = customers.map((customer) => [
    <Link key="name" href={`/app/clientes/${customer.id}`} className="font-medium text-stone-950 hover:underline">
      {customer.full_name}
    </Link>,
    customer.phone ?? "-",
    customer.email ?? "-",
    customer.tags.length ? customer.tags.join(", ") : "-",
    String(customer.total_visits),
    customer.last_visit_at ? new Date(customer.last_visit_at).toLocaleDateString("es-MX") : "-",
    <StatusBadge key="status" status={customer.status} />,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
          Clientes CRM
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-950">
          Clientes
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          CRUD funcional con timeline, notas internas, tareas y comentarios en el detalle.
        </p>
      </div>
      {params.error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p> : null}
      {params.success ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{params.success}</p> : null}

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <ModuleCard title="Crear cliente" description="Nombre requerido y telefono o email obligatorio.">
          <form action={createCustomerAction} className="grid gap-3">
            <input required name="full_name" placeholder="Nombre completo" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="phone" placeholder="Telefono" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input type="email" name="email" placeholder="Email" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            </div>
            <input name="tags" placeholder="Tags separados por coma" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <textarea name="notes" placeholder="Notas iniciales" className="min-h-24 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">Crear cliente</button>
          </form>
        </ModuleCard>
        <ModuleCard title="Lista de clientes" description="Datos filtrados por business_id.">
          {customers.length ? (
            <DataTable columns={["Nombre", "Telefono", "Email", "Tags", "Visitas", "Ultima visita", "Estado"]} rows={rows} />
          ) : (
            <EmptyState title="Sin clientes" description="Crea el primer cliente para iniciar el historial CRM." />
          )}
        </ModuleCard>
      </section>
    </div>
  );
}
