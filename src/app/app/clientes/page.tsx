import Link from "next/link";
import { createCustomerAction } from "@/app/app/actions";
import { getCustomersData } from "@/lib/data";
import { DataTable, EmptyState, ModuleCard, PrimaryButton, SectionHeader, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
    q?: string;
    status?: string;
    tag?: string;
  }>;
}) {
  const params = await searchParams;
  const { customers } = await getCustomersData({
    q: params.q,
    status: params.status,
    tag: params.tag,
  });
  const tags = Array.from(new Set(customers.flatMap((customer) => customer.tags))).sort();

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
      <SectionHeader
        eyebrow="Clientes CRM"
        title="Clientes"
        description="CRUD funcional con timeline, notas internas, tareas y comentarios en el detalle."
        actions={
          <a
            href="#nuevo-cliente"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2"
          >
            Nuevo cliente
          </a>
        }
      />
      {params.error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p> : null}
      {params.success ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{params.success}</p> : null}

      <ModuleCard title="Buscar y filtrar" description="Filtra por nombre, telefono, email, status o tag.">
        <form className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_auto]">
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Buscar cliente"
            className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400"
          />
          <select
            name="status"
            defaultValue={params.status ?? "all"}
            className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400"
          >
            <option value="all">Todos los status</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
          <input
            name="tag"
            list="customer-tags"
            defaultValue={params.tag ?? ""}
            placeholder="Tag"
            className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400"
          />
          <datalist id="customer-tags">
            {tags.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
          <button className="h-11 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2">
            Aplicar
          </button>
        </form>
      </ModuleCard>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <ModuleCard title="Crear cliente" description="Nombre requerido y telefono o email obligatorio.">
          <form id="nuevo-cliente" action={createCustomerAction} className="grid gap-3">
            <input required name="full_name" placeholder="Nombre completo" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="phone" placeholder="Telefono" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input type="email" name="email" placeholder="Email" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            </div>
            <input type="date" name="birthday" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <input name="tags" placeholder="Tags separados por coma" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <textarea name="notes" placeholder="Notas iniciales" className="min-h-24 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
            <PrimaryButton>Crear cliente</PrimaryButton>
          </form>
        </ModuleCard>
        <ModuleCard title="Lista de clientes" description="Datos filtrados por business_id.">
          {customers.length ? (
            <DataTable caption="Lista de clientes CRM" columns={["Nombre", "Telefono", "Email", "Tags", "Visitas", "Ultima visita", "Estado"]} rows={rows} />
          ) : (
            <EmptyState title="Sin clientes" description="Crea el primer cliente para iniciar el historial CRM." />
          )}
        </ModuleCard>
      </section>
    </div>
  );
}
