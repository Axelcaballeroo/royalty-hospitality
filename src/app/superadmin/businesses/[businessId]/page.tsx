import Link from "next/link";
import { notFound } from "next/navigation";
import {
  superadminToggleBusinessModuleAction,
  superadminUpdateBusinessPlanAction,
  superadminUpdateBusinessStatusAction,
} from "@/app/superadmin/actions";
import { DataTable, EmptyState, ModuleCard, StatCard, StatusBadge } from "@/components/ui";
import { getSuperadminBusinessDetail } from "@/lib/data";
import { moduleCatalog, planOrder } from "@/lib/plans";
import { formatEventType, formatPlanName, formatStatus } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export default async function SuperadminBusinessDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { businessId } = await params;
  const query = await searchParams;
  const { business, modules, users, metrics, events, logs } =
    await getSuperadminBusinessDetail(businessId);

  if (!business) {
    notFound();
  }

  const moduleRows = Object.keys(moduleCatalog).map((moduleKey) => ({
    moduleKey,
    enabled: modules.find((module) => module.module_key === moduleKey)?.enabled ?? false,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/superadmin/businesses" className="text-sm font-medium text-stone-300 hover:text-white" prefetch={false}>
          Volver a negocios
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-white">{business.name}</h1>
        <p className="mt-2 text-sm text-stone-300">{business.slug} / {business.type ?? "sin tipo"}</p>
      </div>

      {query.error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formatEventType(query.error)}</p> : null}
      {query.success ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{formatEventType(query.success)}</p> : null}

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard title="Plan" value={formatPlanName(business.plan)} detail="Manual" tone="dark" />
        <StatCard title="Estado" value={formatStatus(business.status)} detail="Tenant" />
        <StatCard title="Reservas" value={String(metrics.reservations)} detail="Total" />
        <StatCard title="Clientes" value={String(metrics.customers)} detail="Total" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <ModuleCard title="Administracion" description="Cambios manuales con auditoria.">
          <div className="grid gap-4">
            <form action={superadminUpdateBusinessPlanAction} className="grid gap-3">
              <input type="hidden" name="business_id" value={business.id} />
              <select name="plan" defaultValue={business.plan} className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
                {planOrder.map((plan) => <option key={plan} value={plan}>{formatPlanName(plan)}</option>)}
              </select>
              <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white">Cambiar plan</button>
            </form>
            <form action={superadminUpdateBusinessStatusAction} className="grid gap-3">
              <input type="hidden" name="business_id" value={business.id} />
              <select name="status" defaultValue={business.status} className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
                <option value="active">{formatStatus("active")}</option>
                <option value="inactive">{formatStatus("inactive")}</option>
                <option value="suspended">{formatStatus("suspended")}</option>
              </select>
              <button className="h-11 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-800">Cambiar estado</button>
            </form>
            <button className="h-11 rounded-lg border border-stone-200 bg-stone-50 text-sm font-medium text-stone-500">
              Entrar como soporte (placeholder)
            </button>
          </div>
        </ModuleCard>

        <ModuleCard title="Modulos" description="Activar o desactivar manualmente.">
          <div className="grid gap-2 md:grid-cols-2">
            {moduleRows.map((row) => (
              <form key={row.moduleKey} action={superadminToggleBusinessModuleAction} className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                <input type="hidden" name="business_id" value={business.id} />
                <input type="hidden" name="module_key" value={row.moduleKey} />
                <span className="text-sm font-medium text-stone-700">{moduleCatalog[row.moduleKey].name}</span>
                <label className="flex items-center gap-2 text-xs text-stone-600">
                  <input name="enabled" type="checkbox" defaultChecked={row.enabled} />
                  {row.enabled ? "Activo" : "Bloqueado"}
                </label>
                <button className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs">Guardar</button>
              </form>
            ))}
          </div>
        </ModuleCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ModuleCard title="Usuarios del negocio" description="Membresias business_users.">
          {users.length ? (
            <DataTable
              columns={["User ID", "Rol", "Estado", "Creado"]}
              rows={users.map((user) => [
                user.user_id,
                <StatusBadge key="role" status={user.role} />,
                <StatusBadge key="status" status={user.status} />,
                new Date(user.created_at).toLocaleDateString("es-MX"),
              ])}
            />
          ) : (
            <EmptyState title="Sin usuarios" description="Este negocio no tiene usuarios asociados." />
          )}
        </ModuleCard>
        <ModuleCard title="Ultimos eventos" description="customer_events recientes.">
          {events.length ? (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                  <p className="text-sm font-semibold text-stone-950">{event.title}</p>
                  <p className="mt-1 text-xs text-stone-500">{formatEventType(event.type)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin eventos" description="Aun no hay actividad reciente." />
          )}
        </ModuleCard>
      </section>

      <ModuleCard title="Auditoria admin" description="Cambios manuales registrados.">
        {logs.length ? (
          <DataTable
            columns={["Accion", "Descripcion", "Fecha"]}
            rows={logs.map((log) => [
              formatEventType(log.action),
              log.description ?? "-",
              new Date(log.created_at).toLocaleString("es-MX"),
            ])}
          />
        ) : (
          <EmptyState title="Sin auditoria" description="Los cambios superadmin apareceran aqui." />
        )}
      </ModuleCard>
    </div>
  );
}
