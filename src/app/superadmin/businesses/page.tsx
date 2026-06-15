import Link from "next/link";
import { getSuperadminBusinessesData } from "@/lib/data";
import { DataTable, EmptyState, ModuleCard, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SuperadminBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const businesses = await getSuperadminBusinessesData(params.q);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">Negocios</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Gestion de negocios</h1>
      </div>

      <ModuleCard title="Buscar negocios" description="Nombre, slug o tipo.">
        <form className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Buscar negocio"
            className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400"
          />
          <button className="h-11 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white">Buscar</button>
        </form>
      </ModuleCard>

      <ModuleCard title="Tenants" description="Negocios registrados en Royalty Hospitality OS.">
        {businesses.length ? (
          <DataTable
            columns={["Nombre", "Slug", "Tipo", "Plan", "Estado", "Usuarios", "Creado", "Acciones"]}
            rows={businesses.map((business) => [
              business.name,
              business.slug,
              business.type ?? "-",
              <StatusBadge key="plan" status={business.plan} />,
              <StatusBadge key="status" status={business.status} />,
              String(business.business_users?.length ?? 0),
              new Date(business.created_at).toLocaleDateString("es-MX"),
              <Link key="detail" href={`/superadmin/businesses/${business.id}`} className="font-medium text-stone-950 hover:underline" prefetch={false}>
                Ver detalle
              </Link>,
            ])}
          />
        ) : (
          <EmptyState title="Sin negocios" description="No hay tenants que coincidan con la busqueda." />
        )}
      </ModuleCard>
    </div>
  );
}
