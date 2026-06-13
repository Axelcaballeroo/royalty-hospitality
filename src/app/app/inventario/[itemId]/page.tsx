import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  createInventoryEntryAction,
  createInventoryMovementAction,
  updateInventoryItemAction,
} from "@/app/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DataTable, EmptyState, ModuleCard, StatCard, StatusBadge } from "@/components/ui";
import { getInventoryItemDetail } from "@/lib/data";
import { inventoryMovementTypes, inventoryUnits } from "@/lib/inventory";
import { UpgradeModuleScreen } from "@/components/upgrade-module-screen";
import { hasModule } from "@/lib/plans";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("es-MX", {
  currency: "MXN",
  style: "currency",
});

const fieldClass =
  "h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400";

export default async function InventoryItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ itemId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { itemId } = await params;
  const query = await searchParams;
  if (!(await hasModule("inventory"))) {
    return <UpgradeModuleScreen moduleKey="inventory" />;
  }

  const { item, batches, movements, alerts, stock } = await getInventoryItemDetail(itemId);

  if (!item) {
    return (
      <div className="space-y-6">
        <Link href="/app/inventario" className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-stone-950">
          <ArrowLeft size={16} />
          Volver a inventario
        </Link>
        <EmptyState title="Producto no encontrado" description="No existe en el negocio actual o fue eliminado." />
      </div>
    );
  }

  const activeBatches = batches.filter((batch) => Number(batch.quantity) > 0);
  const returnTo = `/app/inventario/${item.id}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/app/inventario" className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-stone-950">
            <ArrowLeft size={16} />
            Volver a inventario
          </Link>
          <p className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
            Producto
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-950">{item.name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            Ficha operativa con lotes, movimientos, alertas y ajustes por producto.
          </p>
        </div>
        <StatusBadge status={item.status} />
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
        <StatCard title="Stock actual" value={`${stock} ${item.unit}`} detail="Desde lotes activos" tone="dark" />
        <StatCard title="Stock minimo" value={`${item.min_stock} ${item.unit}`} detail="Umbral operativo" />
        <StatCard title="Lotes activos" value={String(activeBatches.length)} detail="Con existencia" />
        <StatCard title="Alertas" value={String(alerts.filter((alert) => alert.status === "open").length)} detail="Abiertas" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ModuleCard title="Editar producto" description="Actualiza datos principales sin tocar el historial.">
          <form action={updateInventoryItemAction} className="grid gap-3">
            <input type="hidden" name="item_id" value={item.id} />
            <input required name="name" defaultValue={item.name} className={fieldClass} />
            <div className="grid gap-3 sm:grid-cols-3">
              <input name="category" defaultValue={item.category ?? ""} placeholder="Categoria" className={fieldClass} />
              <select required name="unit" defaultValue={item.unit} className={fieldClass}>
                {inventoryUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <input name="min_stock" type="number" min="0" step="0.01" defaultValue={item.min_stock} className={fieldClass} />
            </div>
            <select name="status" defaultValue={item.status} className={fieldClass}>
              <option value="active">activo</option>
              <option value="inactive">inactivo</option>
            </select>
            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
              Guardar cambios
            </button>
          </form>
        </ModuleCard>

        <ModuleCard title="Nueva entrada" description="Agrega un lote de este producto.">
          <form action={createInventoryEntryAction} className="grid gap-3">
            <input type="hidden" name="item_id" value={item.id} />
            <input type="hidden" name="return_to" value={returnTo} />
            <div className="grid gap-3 sm:grid-cols-3">
              <input required name="quantity" type="number" min="0.01" step="0.01" placeholder="Cantidad" className={fieldClass} />
              <input name="expiration_date" type="date" className={fieldClass} />
              <input name="cost" type="number" min="0" step="0.01" placeholder="Costo unitario" className={fieldClass} />
            </div>
            <input name="reason" placeholder="Motivo o proveedor" className={fieldClass} />
            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
              Registrar entrada
            </button>
          </form>
        </ModuleCard>
      </section>

      <ModuleCard title="Movimiento rapido" description="Selecciona lote o deja FEFO automatico.">
        <form action={createInventoryMovementAction} className="grid gap-3 xl:grid-cols-[1fr_0.8fr_0.8fr_1.2fr_auto]">
          <input type="hidden" name="item_id" value={item.id} />
          <input type="hidden" name="return_to" value={returnTo} />
          <select name="batch_id" className={fieldClass}>
            <option value="">FEFO automatico</option>
            {activeBatches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.quantity} {item.unit} / vence {batch.expiration_date ?? "sin fecha"}
              </option>
            ))}
          </select>
          <select required name="type" defaultValue="sale" className={fieldClass}>
            {inventoryMovementTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input required name="quantity" type="number" min="0.01" step="0.01" placeholder="Cantidad" className={fieldClass} />
          <input name="reason" placeholder="Motivo" className={fieldClass} />
          <ConfirmSubmitButton
            className="h-11 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
            message="Registrar este movimiento?"
          >
            Registrar
          </ConfirmSubmitButton>
        </form>
      </ModuleCard>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ModuleCard title="Lotes" description="Cantidad, costo y vencimiento por lote.">
          {batches.length ? (
            <DataTable
              columns={["Cantidad", "Inicial", "Vence", "Costo", "Estado"]}
              rows={batches.map((batch) => [
                `${batch.quantity} ${item.unit}`,
                `${batch.initial_quantity} ${item.unit}`,
                batch.expiration_date ?? "Sin fecha",
                currency.format(Number(batch.cost)),
                <StatusBadge key="status" status={batch.status} />,
              ])}
            />
          ) : (
            <EmptyState title="Sin lotes" description="Registra una entrada para crear el primer lote." />
          )}
        </ModuleCard>

        <ModuleCard title="Alertas" description="Riesgo de merma para este producto.">
          {alerts.length ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-6 text-stone-600">{alert.message}</p>
                    <StatusBadge status={alert.risk_level} />
                  </div>
                  <p className="mt-3 text-xs text-stone-500">
                    {currency.format(Number(alert.estimated_loss))} / {alert.status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin alertas" description="Las alertas de vencimiento o merma apareceran aqui." />
          )}
        </ModuleCard>
      </section>

      <ModuleCard title="Movimientos" description="Historial completo del producto.">
        {movements.length ? (
          <DataTable
            columns={["Tipo", "Cantidad", "Motivo", "Fecha"]}
            rows={movements.map((movement) => [
              <StatusBadge key="type" status={movement.type} />,
              `${movement.quantity} ${item.unit}`,
              movement.reason ?? "-",
              new Date(movement.created_at).toLocaleString("es-MX"),
            ])}
          />
        ) : (
          <EmptyState title="Sin movimientos" description="Las entradas y salidas del producto apareceran aqui." />
        )}
      </ModuleCard>
    </div>
  );
}
