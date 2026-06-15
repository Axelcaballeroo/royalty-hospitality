import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  PackagePlus,
  RefreshCw,
  TrendingDown,
} from "lucide-react";
import { AssistantQuickActions } from "@/components/assistant-quick-actions";
import {
  createInventoryEntryAction,
  createInventoryItemAction,
  createInventoryMovementAction,
  createWasteReductionCampaignAction,
  refreshWasteAlertsAction,
} from "@/app/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DataTable, EmptyState, ModuleCard, StatCard, StatusBadge } from "@/components/ui";
import { getInventoryData } from "@/lib/data";
import { inventoryMovementTypes, inventoryUnits } from "@/lib/inventory";
import { UpgradeModuleScreen } from "@/components/upgrade-module-screen";
import { hasModule } from "@/lib/plans";
import { formatEventType } from "@/lib/formatters";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("es-MX", {
  currency: "MXN",
  style: "currency",
});

const fieldClass =
  "h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400";

const movementLabels: Record<string, string> = {
  sale: "Salida",
  waste: "Perdida",
  adjustment: "Ajuste",
  transfer: "Movimiento",
};

function ActionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
    >
      {children}
    </Link>
  );
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: "new" | "entry" | "out" | "waste";
    error?: string;
    success?: string;
    view?: "catalogo" | "vencimientos" | "movimientos" | "alertas";
  }>;
}) {
  const params = await searchParams;
  if (!(await hasModule("inventory"))) {
    return <UpgradeModuleScreen moduleKey="inventory" />;
  }

  const { items, batches, alerts, movements, metrics } = await getInventoryData();
  const expiringBatches = batches.filter((batch) =>
    ["near_expiration", "urgent", "expired"].includes(batch.status),
  );
  const activeView = params.view ?? "alertas";
  const activeAction = params.action;
  const recommendedAlert = alerts[0];
  const recommendedBatch = expiringBatches[0];
  const recommendedItemName =
    recommendedAlert?.inventory_items?.name ??
    recommendedBatch?.inventory_items?.name ??
    "Producto";
  const recommendedQuantity = recommendedBatch
    ? `${recommendedBatch.quantity} ${recommendedBatch.inventory_items?.unit ?? ""}`.trim()
    : recommendedAlert
      ? "Revisar cantidad"
      : "Sin urgencias";
  const recommendedLoss = recommendedAlert
    ? Number(recommendedAlert.estimated_loss)
    : recommendedBatch
      ? Number(recommendedBatch.quantity) * Number(recommendedBatch.cost)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
            Inventario
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-stone-950">
            Centro de inventario
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
            Controla stock, vencimientos y perdidas desde un solo lugar.
          </p>
        </div>
        <form action={refreshWasteAlertsAction}>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800">
            <RefreshCw size={16} />
            Revisar vencimientos
          </button>
        </form>
      </div>

      {params.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formatEventType(params.error)}
        </p>
      ) : null}
      {params.success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {formatEventType(params.success)}
        </p>
      ) : null}

      <AssistantQuickActions compact />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Productos activos" value={String(metrics.activeItems)} detail="Catalogo listo" tone="dark" />
        <StatCard title="Productos por vencer" value={String(metrics.expiringBatches)} detail="Requieren atencion" />
        <StatCard title="Stock bajo" value={String(metrics.lowStock)} detail="Debajo del minimo" />
        <StatCard title="Perdida estimada" value={currency.format(metrics.estimatedLoss)} detail="Valor en riesgo" />
      </section>

      <ModuleCard title="Accion recomendada" description="El punto mas importante para decidir que hacer ahora.">
        {recommendedAlert || recommendedBatch ? (
          <div className="grid gap-5 rounded-3xl border border-orange-200 bg-orange-50 p-5 xl:grid-cols-[1fr_auto] xl:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={recommendedAlert?.risk_level ?? recommendedBatch?.status ?? "urgent"} />
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">
                  Requiere atencion
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-stone-950">
                {recommendedQuantity} de {recommendedItemName} requieren accion.
              </h2>
              <div className="mt-4 grid gap-3 text-sm text-stone-700 md:grid-cols-3">
                <p>
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Producto</span>
                  {recommendedItemName}
                </p>
                <p>
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Vencimiento</span>
                  {recommendedBatch?.expiration_date ?? "Revisar alerta"}
                </p>
                <p>
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Perdida estimada</span>
                  {currency.format(recommendedLoss)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              {recommendedAlert ? (
                <form action={createWasteReductionCampaignAction}>
                  <input type="hidden" name="alert_id" value={recommendedAlert.id} />
                  <input type="hidden" name="item_name" value={recommendedItemName} />
                  <input type="hidden" name="return_to" value="/app/inventario" />
                  <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white">
                    Crear promocion
                  </button>
                </form>
              ) : (
                <Link
                  href={`/app/marketing?type=waste_reduction&segment=customers_with_points&name=${encodeURIComponent(`Promocion ${recommendedItemName}`)}&message=${encodeURIComponent("Hoy tenemos una promocion especial en productos seleccionados. Reserva o visitanos antes de que termine el dia.")}`}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white"
                >
                  Crear promocion
                </Link>
              )}
              <Link href="/app/inventario?action=waste" className="inline-flex h-11 items-center justify-center rounded-2xl border border-orange-200 bg-white px-5 text-sm font-semibold text-stone-800">
                Registrar perdida
              </Link>
              <Link
                href={recommendedBatch ? `/app/inventario/${recommendedBatch.item_id}` : "/app/inventario?view=alertas"}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-orange-200 bg-white px-5 text-sm font-semibold text-stone-800"
              >
                Ver detalle
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-lg font-semibold text-stone-950">Inventario sin urgencias visibles.</p>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              Revisa vencimientos para detectar oportunidades antes de que se conviertan en perdida.
            </p>
          </div>
        )}
      </ModuleCard>

      <ModuleCard title="Acciones rapidas" description="Abre solo la accion que necesitas.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <ActionLink href="/app/inventario?action=new">Nuevo producto</ActionLink>
          <ActionLink href="/app/inventario?action=entry">Registrar entrada</ActionLink>
          <ActionLink href="/app/inventario?action=out">Registrar salida</ActionLink>
          <ActionLink href="/app/inventario?action=waste">Registrar perdida</ActionLink>
          <form action={refreshWasteAlertsAction}>
            <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-stone-300 hover:bg-stone-50">
              <RefreshCw size={16} />
              Revisar vencimientos
            </button>
          </form>
        </div>
      </ModuleCard>

      {activeAction ? (
        <ModuleCard
          title={
            activeAction === "new"
              ? "Nuevo producto"
              : activeAction === "entry"
                ? "Registrar entrada"
                : activeAction === "waste"
                  ? "Registrar perdida"
                  : "Registrar salida"
          }
          description="Panel de accion. Al guardar volveras al centro de inventario."
        >
          {activeAction === "new" ? (
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
              <div className="flex flex-wrap gap-2">
                <button className="h-11 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white">
                  Crear producto
                </button>
                <Link href="/app/inventario" className="inline-flex h-11 items-center rounded-2xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-800">
                  Cancelar
                </Link>
              </div>
            </form>
          ) : null}

          {activeAction === "entry" ? (
            <form action={createInventoryEntryAction} className="grid gap-3">
              <input type="hidden" name="return_to" value="/app/inventario" />
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
              <div className="flex flex-wrap gap-2">
                <button className="h-11 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white">
                  Registrar entrada
                </button>
                <Link href="/app/inventario" className="inline-flex h-11 items-center rounded-2xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-800">
                  Cancelar
                </Link>
              </div>
            </form>
          ) : null}

          {activeAction === "out" || activeAction === "waste" ? (
            <form action={createInventoryMovementAction} className="grid gap-3">
              <input type="hidden" name="return_to" value="/app/inventario" />
              <select required name="item_id" className={fieldClass}>
                <option value="">Producto</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} / stock {item.stock}
                  </option>
                ))}
              </select>
              <select name="batch_id" className={fieldClass}>
                <option value="">Priorizar productos que vencen primero</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.inventory_items?.name ?? "Producto"} / {batch.quantity} / vence {batch.expiration_date ?? "sin fecha"}
                  </option>
                ))}
              </select>
              <div className="grid gap-3 sm:grid-cols-3">
                <select required name="type" defaultValue={activeAction === "waste" ? "waste" : "sale"} className={fieldClass}>
                  {inventoryMovementTypes.map((type) => (
                    <option key={type} value={type}>
                      {movementLabels[type] ?? formatEventType(type)}
                    </option>
                  ))}
                </select>
                <input required name="quantity" type="number" min="0.01" step="0.01" placeholder="Cantidad" className={fieldClass} />
                <input name="reason" placeholder="Motivo" className={fieldClass} />
              </div>
              <p className="text-xs leading-5 text-stone-500">
                El sistema prioriza automaticamente los productos que vencen primero.
              </p>
              <div className="flex flex-wrap gap-2">
                <ConfirmSubmitButton
                  className="h-11 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white"
                  message="Registrar este movimiento?"
                >
                  Registrar
                </ConfirmSubmitButton>
                <Link href="/app/inventario" className="inline-flex h-11 items-center rounded-2xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-800">
                  Cancelar
                </Link>
              </div>
            </form>
          ) : null}
        </ModuleCard>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <ModuleCard title="Catalogo" description={`${metrics.activeItems} ${metrics.activeItems === 1 ? "producto activo" : "productos activos"}.`}>
          <Link href="/app/inventario?view=catalogo" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-950">
            Ver catalogo
            <ArrowRight size={15} />
          </Link>
        </ModuleCard>
        <ModuleCard title="Vencimientos" description={`${metrics.expiringBatches} ${metrics.expiringBatches === 1 ? "producto requiere" : "productos requieren"} atencion.`}>
          <Link href="/app/inventario?view=vencimientos" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-950">
            Ver vencimientos
            <ArrowRight size={15} />
          </Link>
        </ModuleCard>
        <ModuleCard title="Movimientos" description={`${movements.length} ${movements.length === 1 ? "movimiento reciente" : "movimientos recientes"}.`}>
          <Link href="/app/inventario?view=movimientos" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-950">
            Ver movimientos
            <ArrowRight size={15} />
          </Link>
        </ModuleCard>
      </section>

      <ModuleCard title="Paneles de detalle" description="Elige una vista secundaria para revisar datos sin saturar la pantalla.">
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            ["alertas", "Alertas de perdida"],
            ["catalogo", "Catalogo y stock"],
            ["vencimientos", "Productos por vencer"],
            ["movimientos", "Movimientos recientes"],
          ].map(([view, label]) => (
            <Link
              key={view}
              href={`/app/inventario?view=${view}`}
              className={[
                "inline-flex h-10 items-center rounded-2xl px-4 text-sm font-semibold transition",
                activeView === view
                  ? "bg-stone-950 text-white"
                  : "border border-stone-200 bg-white text-stone-700 hover:border-stone-300",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </div>

        {activeView === "alertas" ? (
          alerts.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {alerts.map((alert) => {
                const itemName = alert.inventory_items?.name ?? "Producto";
                return (
                  <div key={alert.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-stone-950">{itemName}</p>
                        <p className="mt-1 text-sm leading-6 text-stone-600">{alert.message}</p>
                      </div>
                      <StatusBadge status={alert.risk_level} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-stone-700">
                      Perdida estimada: {currency.format(Number(alert.estimated_loss))}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <form action={createWasteReductionCampaignAction}>
                        <input type="hidden" name="alert_id" value={alert.id} />
                        <input type="hidden" name="item_name" value={itemName} />
                        <input type="hidden" name="return_to" value="/app/inventario" />
                        <button className="inline-flex h-9 items-center gap-2 rounded-xl bg-stone-950 px-3 text-xs font-semibold text-white">
                          <AlertTriangle size={14} />
                          Crear promocion
                        </button>
                      </form>
                      <Link href="/app/inventario?action=waste" className="inline-flex h-9 items-center rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-800">
                        Registrar perdida
                      </Link>
                      <Link href="/app/inventario?view=alertas" className="inline-flex h-9 items-center rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-800">
                        Resolver alerta
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Sin alertas abiertas" description="Revisa vencimientos para detectar productos que requieren atencion." />
          )
        ) : null}

        {activeView === "catalogo" ? (
          items.length ? (
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
          )
        ) : null}

        {activeView === "vencimientos" ? (
          expiringBatches.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {expiringBatches.map((batch) => (
                <div key={batch.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-stone-950">{batch.inventory_items?.name ?? "Producto"}</p>
                      <p className="mt-1 text-sm text-stone-600">
                        {batch.quantity} {batch.inventory_items?.unit ?? ""} / vence {batch.expiration_date ?? "sin fecha"}
                      </p>
                    </div>
                    <StatusBadge status={batch.status} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-stone-700">
                    Valor en riesgo: {currency.format(Number(batch.quantity) * Number(batch.cost))}
                  </p>
                  <Link href={`/app/inventario/${batch.item_id}`} className="mt-4 inline-flex h-9 items-center rounded-xl bg-white px-3 text-xs font-semibold text-stone-800">
                    Ver detalle
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin vencimientos criticos" description="Los productos activos no tienen vencimientos urgentes registrados." />
          )
        ) : null}

        {activeView === "movimientos" ? (
          movements.length ? (
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
          )
        ) : null}
      </ModuleCard>

      <ModuleCard title="Ayuda rapida" description="El sistema prioriza automaticamente los productos que vencen primero.">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["Producto", "Mantiene nombre, categoria, unidad y stock minimo."],
            ["Vencimiento", "Ayuda a detectar lo que debe usarse o promocionarse pronto."],
            ["Promocion", "Convierte una alerta en una accion de marketing para el mismo dia."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              {title === "Producto" ? <PackagePlus className="text-stone-500" size={18} /> : null}
              {title === "Vencimiento" ? <ClipboardList className="text-stone-500" size={18} /> : null}
              {title === "Promocion" ? <TrendingDown className="text-stone-500" size={18} /> : null}
              <p className="mt-3 text-sm font-semibold text-stone-950">{title}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
            </div>
          ))}
        </div>
      </ModuleCard>
    </div>
  );
}
