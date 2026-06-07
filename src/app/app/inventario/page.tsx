import Link from "next/link";
import { AlertTriangle, Boxes, RefreshCw } from "lucide-react";
import {
  createInventoryEntryAction,
  createInventoryItemAction,
  createInventoryMovementAction,
  refreshWasteAlertsAction,
} from "@/app/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DataTable, EmptyState, ModuleCard, StatCard, StatusBadge } from "@/components/ui";
import { getInventoryData } from "@/lib/data";
import { inventoryMovementTypes, inventoryUnits } from "@/lib/inventory";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("es-MX", {
  currency: "MXN",
  style: "currency",
});

const fieldClass =
  "h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const { items, batches, alerts, movements, metrics } = await getInventoryData();
  const expiringBatches = batches.filter((batch) =>
    ["near_expiration", "urgent", "expired"].includes(batch.status),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
            Inventario
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-950">
            Inventario V1 y merma basica
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            Control operativo de productos, lotes, movimientos FEFO y alertas para convertir riesgo de merma en accion comercial.
          </p>
        </div>
        <form action={refreshWasteAlertsAction}>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800">
            <RefreshCw size={16} />
            Revisar vencimientos
          </button>
        </form>
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Productos activos" value={String(metrics.activeItems)} detail="Catalogo operativo" tone="dark" />
        <StatCard title="Bajo stock" value={String(metrics.lowStock)} detail="Stock igual o menor al minimo" />
        <StatCard title="Lotes por vencer" value={String(metrics.expiringBatches)} detail="Near, urgent o expired" />
        <StatCard title="Alertas abiertas" value={String(metrics.openAlerts)} detail="Riesgo de merma" />
        <StatCard title="Perdida estimada" value={currency.format(metrics.estimatedLoss)} detail="Alertas abiertas" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ModuleCard title="Nuevo producto" description="Crea el SKU operativo con unidad y stock minimo.">
          <form action={createInventoryItemAction} className="grid gap-3">
            <input required name="name" placeholder="Nombre del producto" className={fieldClass} />
            <div className="grid gap-3 sm:grid-cols-3">
              <input name="category" placeholder="Categoria" className={fieldClass} />
              <select required name="unit" defaultValue="kg" className={fieldClass}>
                {inventoryUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <input name="min_stock" type="number" min="0" step="0.01" placeholder="Stock minimo" className={fieldClass} />
            </div>
            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
              Crear producto
            </button>
          </form>
        </ModuleCard>

        <ModuleCard title="Registrar entrada" description="Cada entrada crea un lote con costo, vencimiento y movimiento.">
          <form action={createInventoryEntryAction} className="grid gap-3">
            <select required name="item_id" className={fieldClass}>
              <option value="">Seleccionar producto</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} / {item.unit}
                </option>
              ))}
            </select>
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

      <ModuleCard title="Registrar salida, merma o ajuste" description="Sin lote especifico se descuenta automaticamente por FEFO.">
        <form action={createInventoryMovementAction} className="grid gap-3 xl:grid-cols-[1fr_1fr_0.8fr_0.8fr_1.2fr_auto]">
          <select required name="item_id" className={fieldClass}>
            <option value="">Producto</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} / stock {item.stock}
              </option>
            ))}
          </select>
          <select name="batch_id" className={fieldClass}>
            <option value="">FEFO automatico</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.inventory_items?.name ?? "Producto"} / {batch.quantity} / vence {batch.expiration_date ?? "sin fecha"}
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
            message="Registrar este movimiento de inventario?"
          >
            Registrar
          </ConfirmSubmitButton>
        </form>
      </ModuleCard>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ModuleCard title="Catalogo y stock" description="Stock calculado desde lotes disponibles.">
          {items.length ? (
            <DataTable
              columns={["Producto", "Categoria", "Stock", "Minimo", "Estado", "Detalle"]}
              rows={items.map((item) => [
                item.name,
                item.category ?? "General",
                `${item.stock} ${item.unit}`,
                `${item.min_stock} ${item.unit}`,
                item.stock <= Number(item.min_stock) ? (
                  <StatusBadge key="low" status="urgent" />
                ) : (
                  <StatusBadge key="ok" status={item.status} />
                ),
                <Link key="detail" href={`/app/inventario/${item.id}`} className="font-medium text-stone-950 hover:underline">
                  Abrir
                </Link>,
              ])}
            />
          ) : (
            <EmptyState title="Sin productos" description="Crea el primer producto para comenzar a registrar entradas y salidas." />
          )}
        </ModuleCard>

        <ModuleCard title="Alertas de merma" description="Lotes con riesgo o merma registrada.">
          {alerts.length ? (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const message = encodeURIComponent(
                  `Hola {{nombre}}, hoy tenemos una promocion especial de ${alert.inventory_items?.name ?? "la casa"} en {{negocio}}. Reserva o visitanos antes de que termine el dia.`,
                );
                const name = encodeURIComponent(`Anti-merma ${alert.inventory_items?.name ?? "producto"}`);
                return (
                  <div key={alert.id} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-stone-950">{alert.inventory_items?.name ?? "Producto"}</p>
                        <p className="mt-1 text-sm leading-6 text-stone-600">{alert.message}</p>
                      </div>
                      <StatusBadge status={alert.risk_level} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                      <span>{currency.format(Number(alert.estimated_loss))} estimados</span>
                      <Link
                        href={`/app/marketing?type=waste_reduction&segment=all_customers&name=${name}&message=${message}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 font-medium text-stone-800 transition hover:border-stone-300"
                      >
                        <AlertTriangle size={14} />
                        Crear campana anti-merma
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Sin alertas abiertas" description="Revisa vencimientos para detectar lotes proximos a vencer." />
          )}
        </ModuleCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ModuleCard title="Lotes por vencer" description="FEFO prioriza los lotes con fecha mas cercana.">
          {expiringBatches.length ? (
            <DataTable
              columns={["Producto", "Cantidad", "Vence", "Costo", "Estado"]}
              rows={expiringBatches.map((batch) => [
                batch.inventory_items?.name ?? "Producto",
                `${batch.quantity} ${batch.inventory_items?.unit ?? ""}`,
                batch.expiration_date ?? "Sin fecha",
                currency.format(Number(batch.cost)),
                <StatusBadge key="status" status={batch.status} />,
              ])}
            />
          ) : (
            <EmptyState title="Sin vencimientos criticos" description="Los lotes activos no tienen alertas de vencimiento registradas." />
          )}
        </ModuleCard>

        <ModuleCard title="Movimientos recientes" description="Entradas, salidas, ajustes y mermas.">
          {movements.length ? (
            <DataTable
              columns={["Producto", "Tipo", "Cantidad", "Motivo", "Fecha"]}
              rows={movements.map((movement) => [
                movement.inventory_items?.name ?? "Producto",
                <StatusBadge key="type" status={movement.type} />,
                `${movement.quantity} ${movement.inventory_items?.unit ?? ""}`,
                movement.reason ?? "-",
                new Date(movement.created_at).toLocaleDateString("es-MX"),
              ])}
            />
          ) : (
            <EmptyState title="Sin movimientos" description="Las entradas y salidas apareceran aqui." />
          )}
        </ModuleCard>
      </section>

      <ModuleCard title="Principio operativo" description="El modulo queda listo para cocina, compras y marketing.">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["FEFO", "La salida automatica toma primero el lote con vencimiento mas cercano."],
            ["Merma", "Cada merma puede crear alerta con perdida estimada."],
            ["Marketing", "Las alertas abiertas pueden prefijar una campana anti-merma."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <Boxes className="text-stone-500" size={18} />
              <p className="mt-3 text-sm font-semibold text-stone-950">{title}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
            </div>
          ))}
        </div>
      </ModuleCard>
    </div>
  );
}
