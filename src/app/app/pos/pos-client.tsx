"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Gift,
  Minus,
  Percent,
  Package,
  Plus,
  Printer,
  ReceiptText,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { SectionHeader } from "@/components/ui";
import {
  initialPosCatalog,
  initialTables,
  makeLineId,
  posCatalogEvent,
  posStateEvent,
  readPosCatalog,
  readPosSales,
  readPosTables,
  writePosSales,
  writePosTables,
} from "@/lib/pos-shared";
import type {
  OrderItemStatus,
  PaymentPart,
  PaymentMethod,
  PosCatalog,
  PosCategory,
  PosTable,
  Product,
  Sale,
  TableStatus,
} from "@/lib/pos-shared";

type ModalType = "open" | "quick" | "order" | "cashier" | null;
type PosStep = "order" | "payment";
type AccountModal = "discount" | "courtesy" | null;
type CompletedPayment = { payments: PaymentPart[]; isCourtesy: boolean };

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

function subtotal(table: PosTable) {
  return table.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function discountAmount(table: PosTable) {
  if (!table.discount) return 0;
  const base = subtotal(table);
  const calculated = table.discount.type === "percent"
    ? Math.round((base * table.discount.value) / 100)
    : table.discount.value;
  return Math.min(base, Math.max(0, calculated));
}

function courtesyAmount(table: PosTable) {
  if (!table.courtesy) return 0;
  if (table.courtesy.type === "full") return Math.max(0, subtotal(table) - discountAmount(table));
  return Math.min(table.courtesy.amount, Math.max(0, subtotal(table) - discountAmount(table)));
}

function total(table: PosTable) {
  return Math.max(0, subtotal(table) - discountAmount(table) - courtesyAmount(table));
}

function tableStatus(table: PosTable): TableStatus {
  if (!table.openedAt) return "free";
  if (table.readyToPay) return "checkout";
  return "occupied";
}

function elapsed(openedAt: string | null) {
  if (!openedAt) return "--";
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(openedAt).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours} h ${rest} min`;
}

function statusLabel(status: TableStatus) {
  if (status === "free") return "Mesa libre";
  if (status === "checkout") return "Por cobrar";
  return "Mesa ocupada";
}

function statusClasses(status: TableStatus) {
  if (status === "free") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "checkout") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-stone-900 bg-stone-950 text-white";
}

export function PosClient() {
  const [tables, setTables] = useState<PosTable[]>(initialTables);
  const [selectedTableId, setSelectedTableId] = useState(initialTables[1].id);
  const [catalog, setCatalog] = useState<PosCatalog>(initialPosCatalog);
  const [activeCategory, setActiveCategory] = useState(initialPosCatalog.categories[0].id);
  const [modal, setModal] = useState<ModalType>(null);
  const [posStep, setPosStep] = useState<PosStep>("order");
  const [toast, setToast] = useState("");
  const [sales, setSales] = useState<Sale[]>([]);
  const [accountModal, setAccountModal] = useState<AccountModal>(null);
  const [completedPayment, setCompletedPayment] = useState<CompletedPayment | null>(null);

  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? tables[0];
  const posCategories = catalog.categories
    .filter((category) => category.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const selectedCategory = posCategories.some((category) => category.id === activeCategory)
    ? activeCategory
    : posCategories[0]?.id ?? "";
  const categoryProducts = catalog.products.filter(
    (product) => product.categoryId === selectedCategory && product.visible && product.available,
  );

  useEffect(() => {
    const syncTables = () => {
      setTables(readPosTables());
      setSales(readPosSales());
      setCatalog(readPosCatalog());
    };

    syncTables();
    const interval = window.setInterval(syncTables, 1000);
    window.addEventListener("storage", syncTables);
    window.addEventListener(posStateEvent, syncTables);
    window.addEventListener(posCatalogEvent, syncTables);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", syncTables);
      window.removeEventListener(posStateEvent, syncTables);
      window.removeEventListener(posCatalogEvent, syncTables);
    };
  }, []);

  const metrics = useMemo(() => {
    const openTables = tables.filter((table) => table.openedAt);
    return {
      pending: openTables.reduce((sum, table) => sum + total(table), 0),
      open: openTables.filter((table) => !table.quickType).length,
      finished: sales.length,
    };
  }, [sales.length, tables]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function updateTables(updater: (current: PosTable[]) => PosTable[]) {
    setTables((current) => {
      const next = updater(current);
      writePosTables(next);
      return next;
    });
  }

  function openTableMap(table: PosTable) {
    setSelectedTableId(table.id);
    if (!table.openedAt) {
      setModal("open");
      return;
    }
    setPosStep("order");
    setModal("order");
  }

  function beginOpenTable(tableId?: string) {
    const firstFree = tables.find((table) => !table.openedAt);
    setSelectedTableId(tableId ?? firstFree?.id ?? selectedTableId);
    setModal("open");
  }

  function openTable(tableId: string, people: number, customer: string) {
    updateTables((current) =>
      current.map((table) =>
        table.id === tableId
          ? {
              ...table,
              customer,
              people,
              openedAt: new Date().toISOString(),
              items: [],
              discount: null,
              courtesy: null,
              readyToPay: false,
              quickType: undefined,
            }
          : table,
      ),
    );
    setSelectedTableId(tableId);
    setPosStep("order");
    setModal("order");
    showToast("Mesa abierta");
  }

  function addProduct(product: Product) {
    const nextStatus: OrderItemStatus = product.sendToKitchen ? "pending" : "served";
    updateTables((current) =>
      current.map((table) => {
        if (table.id !== selectedTable.id || !table.openedAt) return table;
        const existing = table.items.find((item) => item.id === product.id && item.status === nextStatus);
        const items = existing
          ? table.items.map((item) =>
              item.lineId === existing.lineId
                ? { ...item, quantity: item.quantity + 1, status: nextStatus, updatedAt: new Date().toISOString() }
                : item,
            )
          : [
              ...table.items,
              {
                ...product,
                lineId: makeLineId(table.id, product.id),
                quantity: 1,
                status: nextStatus,
                updatedAt: new Date().toISOString(),
              },
            ];
        return { ...table, items, readyToPay: false };
      }),
    );
    showToast(`Producto agregado: ${product.name}`);
  }

  function changeQuantity(productId: string, change: number) {
    updateTables((current) =>
      current.map((table) => {
        if (table.id !== selectedTable.id) return table;
        const items = table.items
          .map((item) => {
            if (item.lineId !== productId) return item;
            const status: OrderItemStatus = item.sendToKitchen ? "pending" : "served";
            return {
              ...item,
              quantity: item.quantity + change,
              status,
              updatedAt: new Date().toISOString(),
            };
          })
          .filter((item) => item.quantity > 0);
        return { ...table, items, readyToPay: false };
      }),
    );
  }

  function removeProduct(productId: string) {
    updateTables((current) =>
      current.map((table) =>
        table.id === selectedTable.id
          ? { ...table, items: table.items.filter((item) => item.lineId !== productId), readyToPay: false }
          : table,
      ),
    );
  }

  function sendToKitchen() {
    if (!selectedTable.openedAt || selectedTable.items.length === 0) return;
    updateTables((current) =>
      current.map((table) =>
        table.id === selectedTable.id
          ? {
              ...table,
              items: table.items.map((item) => ({
                ...item,
                status: item.status === "pending" ? "sent" : item.status,
                sentAt: item.status === "pending" ? new Date().toISOString() : item.sentAt,
                updatedAt: new Date().toISOString(),
              })),
              readyToPay: false,
            }
          : table,
      ),
    );
    showToast("Orden enviada a cocina");
  }

  function markServed(productId: string) {
    updateTables((current) =>
      current.map((table) =>
        table.id === selectedTable.id
          ? {
              ...table,
              items: table.items.map((item) =>
                item.lineId === productId ? { ...item, status: "served", updatedAt: new Date().toISOString() } : item,
              ),
            }
          : table,
      ),
    );
  }

  function startPayment() {
    if (!selectedTable.openedAt || selectedTable.items.length === 0) return;
    if (selectedTable.items.some((item) => item.sendToKitchen && item.status === "pending")) {
      showToast("Envía los productos pendientes a cocina antes de cobrar");
      return;
    }
    updateTables((current) =>
      current.map((table) => (table.id === selectedTable.id ? { ...table, readyToPay: true } : table)),
    );
    setPosStep("payment");
  }

  function applyDiscount(type: "percent" | "fixed", value: number, reason: string, authorizedBy: string) {
    updateTables((current) =>
      current.map((table) =>
        table.id === selectedTable.id
          ? { ...table, discount: { type, value, reason, authorizedBy: authorizedBy || undefined } }
          : table,
      ),
    );
    setAccountModal(null);
    showToast("Descuento aplicado");
  }

  function applyCourtesy(courtesy: NonNullable<PosTable["courtesy"]>) {
    updateTables((current) =>
      current.map((table) => (table.id === selectedTable.id ? { ...table, courtesy } : table)),
    );
    setAccountModal(null);
    showToast(courtesy.type === "full" ? "Cuenta marcada como cortesía" : "Cortesía aplicada");
  }

  function registerPayment(payments: PaymentPart[]) {
    updateTables((current) =>
      current.map((table) =>
        table.id === selectedTable.id
          ? {
              ...table,
              items: table.items.map((item) => ({ ...item, status: "paid", updatedAt: new Date().toISOString() })),
            }
          : table,
      ),
    );
    setCompletedPayment({ payments, isCourtesy: false });
    showToast("Pago registrado");
  }

  function prepareCourtesyClose() {
    updateTables((current) =>
      current.map((table) =>
        table.id === selectedTable.id
          ? {
              ...table,
              items: table.items.map((item) => ({ ...item, status: "paid", updatedAt: new Date().toISOString() })),
            }
          : table,
      ),
    );
    setCompletedPayment({ payments: [], isCourtesy: true });
  }

  function closeOrder() {
    if (!completedPayment) return;
    const table = selectedTable;
    const paymentMethod: PaymentMethod = completedPayment.isCourtesy
      ? "Mixto"
      : completedPayment.payments.length > 1
        ? "Mixto"
        : completedPayment.payments[0]?.method ?? "Mixto";
    const sale: Sale = {
      id: `sale-${Date.now()}`,
      tableName: table.name,
      items: table.items.map((item) => ({ ...item, status: "paid" })),
      gross: subtotal(table),
      discount: discountAmount(table),
      courtesy: courtesyAmount(table),
      total: total(table),
      paymentMethod,
      payments: completedPayment.payments,
      isCourtesy: completedPayment.isCourtesy,
      closedAt: new Date().toISOString(),
    };
    setSales((current) => {
      const next = [sale, ...current];
      writePosSales(next);
      return next;
    });
    updateTables((current) =>
      table.quickType
        ? current.filter((item) => item.id !== table.id)
        : current.map((item) =>
            item.id === table.id
              ? {
                  ...item,
                  customer: "",
                  people: 0,
                  openedAt: null,
                  items: [],
                  discount: null,
                  courtesy: null,
                  readyToPay: false,
                  quickType: undefined,
                }
              : item,
          ),
    );
    setCompletedPayment(null);
    setPosStep("order");
    setModal(null);
    showToast("Mesa liberada");
  }

  function openQuickSale(type: string) {
    const quickId = `quick-${Date.now()}`;
    const quickOrder: PosTable = {
      id: quickId,
      name: type,
      customer: "Venta rápida",
      people: type === "Comer aquí" ? 1 : 0,
      openedAt: new Date().toISOString(),
      items: [],
      discount: null,
      courtesy: null,
      readyToPay: false,
      quickType: type,
    };
    updateTables((current) => [...current.filter((table) => !table.quickType), quickOrder]);
    setSelectedTableId(quickId);
    setPosStep("order");
    setModal("order");
    showToast("Venta rápida abierta");
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed right-5 top-5 z-[70] flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 shadow-xl">
          <CheckCircle2 size={20} />
          {toast}
        </div>
      ) : null}

      <SectionHeader
        eyebrow="POS"
        title="Punto de Venta"
        description="Mapa de mesas para abrir, cobrar y operar sin pasos tecnicos."
        actions={
          <>
            <ActionButton onClick={() => beginOpenTable()} icon={<Plus size={22} />}>
              Abrir mesa
            </ActionButton>
            <ActionButton onClick={() => setModal("quick")} icon={<Sparkles size={22} />} light>
              Venta rápida
            </ActionButton>
            <ActionButton onClick={() => setModal("cashier")} icon={<ReceiptText size={22} />} light>
              Cierre de caja
            </ActionButton>
            <Link
              href="/app/pos/products"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 text-base font-semibold text-stone-900 shadow-sm transition hover:bg-stone-50"
            >
              <Package size={22} />
              Configurar productos
            </Link>
          </>
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        <MiniMetric label="Pendiente por cobrar" value={money.format(metrics.pending)} />
        <MiniMetric label="Mesas abiertas" value={String(metrics.open)} />
        <MiniMetric label="Ventas finalizadas" value={String(metrics.finished)} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tables.filter((table) => !table.quickType).map((table) => (
          <TableCard key={table.id} table={table} onClick={() => openTableMap(table)} />
        ))}
      </section>

      {modal === "open" ? (
        <OpenTableModal
          table={selectedTable}
          onClose={() => setModal(null)}
          onOpen={(people, customer) => openTable(selectedTable.id, people, customer)}
        />
      ) : null}

      {modal === "quick" ? <QuickSaleModal onClose={() => setModal(null)} onSelect={openQuickSale} /> : null}

      {modal === "order" ? (
        <FullscreenPos
          table={selectedTable}
          step={posStep}
          activeCategory={selectedCategory}
          posCategories={posCategories}
          categoryProducts={categoryProducts}
          onCategoryChange={setActiveCategory}
          onBack={() => {
            if (selectedTable.quickType) {
              updateTables((current) => current.filter((table) => table.id !== selectedTable.id));
            }
            setPosStep("order");
            setModal(null);
          }}
          onAddProduct={addProduct}
          onChangeQuantity={changeQuantity}
          onRemoveProduct={removeProduct}
          onMarkServed={markServed}
          onSendKitchen={sendToKitchen}
          onStartPayment={startPayment}
          onOpenDiscount={() => setAccountModal("discount")}
          onOpenCourtesy={() => setAccountModal("courtesy")}
          onBackToOrder={() => setPosStep("order")}
          onPay={registerPayment}
          onCourtesyClose={prepareCourtesyClose}
        />
      ) : null}

      {accountModal === "discount" ? (
        <DiscountModal table={selectedTable} onClose={() => setAccountModal(null)} onApply={applyDiscount} />
      ) : null}

      {accountModal === "courtesy" ? (
        <CourtesyModal table={selectedTable} onClose={() => setAccountModal(null)} onApply={applyCourtesy} />
      ) : null}

      {completedPayment ? (
        <PaymentCompleteModal
          isCourtesy={completedPayment.isCourtesy}
          isQuickSale={Boolean(selectedTable.quickType)}
          onCloseOrder={closeOrder}
        />
      ) : null}

      {modal === "cashier" ? (
        <CashierModal sales={sales} pending={metrics.pending} onClose={() => setModal(null)} />
      ) : null}
    </div>
  );
}

function ActionButton({
  children,
  icon,
  light = false,
  onClick,
}: {
  children: ReactNode;
  icon: ReactNode;
  light?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-6 text-base font-semibold shadow-sm transition",
        light
          ? "border border-stone-200 bg-white text-stone-900 hover:bg-stone-50"
          : "bg-stone-950 text-white hover:bg-stone-800",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-stone-950">{value}</p>
    </div>
  );
}

function TableCard({ table, onClick }: { table: PosTable; onClick: () => void }) {
  const status = tableStatus(table);

  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-56 rounded-3xl border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold text-stone-950">{table.name}</p>
          <p className="mt-2 text-sm font-semibold text-stone-500">{table.customer || "Sin cliente"}</p>
        </div>
        <span className={["rounded-full border px-3 py-1 text-sm font-semibold", statusClasses(status)].join(" ")}>
          {statusLabel(status)}
        </span>
      </div>
      <div className="mt-8 grid grid-cols-3 gap-3">
        <CardFact icon={<Users size={18} />} label="Personas" value={String(table.people || 0)} />
        <CardFact icon={<Banknote size={18} />} label="Total" value={table.openedAt ? money.format(total(table)) : "$0"} />
        <CardFact icon={<Clock size={18} />} label="Tiempo" value={elapsed(table.openedAt)} />
      </div>
    </button>
  );
}

function CardFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-3">
      <div className="text-stone-500">{icon}</div>
      <p className="mt-2 text-xs font-semibold text-stone-500">{label}</p>
      <p className="mt-1 truncate text-base font-semibold text-stone-950">{value}</p>
    </div>
  );
}

function ProductImage({ product }: { product: Product }) {
  return (
    <span className={["block h-32 bg-gradient-to-br p-4", product.tone].join(" ")}>
      <span className="grid h-full place-items-center rounded-3xl bg-white/45">
        <span className="text-5xl font-semibold text-stone-950/65">
          {product.name
            .split(" ")
            .slice(0, 2)
            .map((word) => word[0])
            .join("")}
        </span>
      </span>
    </span>
  );
}

function OrderStatusBadge({ status }: { status: OrderItemStatus }) {
  const labels: Record<OrderItemStatus, string> = {
    pending: "🟡 Pendiente",
    sent: "🔵 En cocina",
    preparing: "🟣 Preparando",
    ready: "🟢 Listo para servir",
    served: "✅ Servido",
    paid: "⚫ Cobrado",
  };
  const classes: Record<OrderItemStatus, string> = {
    pending: "border-amber-200 bg-amber-50 text-amber-800",
    sent: "border-sky-200 bg-sky-50 text-sky-800",
    preparing: "border-indigo-200 bg-indigo-50 text-indigo-800",
    ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
    served: "border-emerald-200 bg-emerald-50 text-emerald-800",
    paid: "border-stone-300 bg-stone-100 text-stone-800",
  };

  return (
    <span className={["mt-2 inline-flex h-8 items-center rounded-full border px-3 text-sm font-semibold", classes[status]].join(" ")}>
      {labels[status]}
    </span>
  );
}

function FullscreenPos({
  table,
  step,
  activeCategory,
  posCategories,
  categoryProducts,
  onCategoryChange,
  onBack,
  onAddProduct,
  onChangeQuantity,
  onRemoveProduct,
  onMarkServed,
  onSendKitchen,
  onStartPayment,
  onOpenDiscount,
  onOpenCourtesy,
  onBackToOrder,
  onPay,
  onCourtesyClose,
}: {
  table: PosTable;
  step: PosStep;
  activeCategory: string;
  posCategories: PosCategory[];
  categoryProducts: Product[];
  onCategoryChange: (categoryId: string) => void;
  onBack: () => void;
  onAddProduct: (product: Product) => void;
  onChangeQuantity: (productId: string, change: number) => void;
  onRemoveProduct: (productId: string) => void;
  onMarkServed: (productId: string) => void;
  onSendKitchen: () => void;
  onStartPayment: () => void;
  onOpenDiscount: () => void;
  onOpenCourtesy: () => void;
  onBackToOrder: () => void;
  onPay: (payments: PaymentPart[]) => void;
  onCourtesyClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-3 transition-opacity">
      <div className="flex h-[95vh] max-h-[95vh] w-[95vw] flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <header className="flex flex-col gap-4 border-b border-stone-200 bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-14 items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-5 text-base font-semibold text-stone-950 transition hover:bg-white"
            >
              <ArrowLeft size={22} />
              Volver a mesas
            </button>
            <div>
              <h2 className="text-4xl font-semibold text-stone-950">{table.name}</h2>
              <p className="mt-1 text-sm font-semibold text-stone-500">{table.customer || "Cliente opcional"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className={["inline-flex h-12 items-center rounded-2xl border px-4 text-base font-semibold", statusClasses(tableStatus(table))].join(" ")}>
              {table.courtesy?.type === "full" ? "Cortesía" : statusLabel(tableStatus(table))}
            </span>
            <span className="inline-flex h-12 items-center gap-2 rounded-2xl bg-stone-100 px-4 text-base font-semibold text-stone-800">
              <Users size={20} />
              {table.people || 0} personas
            </span>
            <span className="inline-flex h-12 items-center gap-2 rounded-2xl bg-stone-100 px-4 text-base font-semibold text-stone-800">
              <Clock size={20} />
              {elapsed(table.openedAt)}
            </span>
          </div>
        </header>

        {step === "order" ? (
          <OrderStep
            table={table}
            activeCategory={activeCategory}
            posCategories={posCategories}
            categoryProducts={categoryProducts}
            onCategoryChange={onCategoryChange}
            onAddProduct={onAddProduct}
            onChangeQuantity={onChangeQuantity}
            onRemoveProduct={onRemoveProduct}
            onMarkServed={onMarkServed}
            onSendKitchen={onSendKitchen}
            onStartPayment={onStartPayment}
            onOpenDiscount={onOpenDiscount}
            onOpenCourtesy={onOpenCourtesy}
          />
        ) : null}

        {step === "payment" ? (
          <PaymentStep table={table} onBack={onBackToOrder} onPay={onPay} onCourtesyClose={onCourtesyClose} />
        ) : null}
      </div>
    </div>
  );
}

function OrderStep({
  table,
  activeCategory,
  posCategories,
  categoryProducts,
  onCategoryChange,
  onAddProduct,
  onChangeQuantity,
  onRemoveProduct,
  onMarkServed,
  onSendKitchen,
  onStartPayment,
  onOpenDiscount,
  onOpenCourtesy,
}: {
  table: PosTable;
  activeCategory: string;
  posCategories: PosCategory[];
  categoryProducts: Product[];
  onCategoryChange: (categoryId: string) => void;
  onAddProduct: (product: Product) => void;
  onChangeQuantity: (productId: string, change: number) => void;
  onRemoveProduct: (productId: string) => void;
  onMarkServed: (productId: string) => void;
  onSendKitchen: () => void;
  onStartPayment: () => void;
  onOpenDiscount: () => void;
  onOpenCourtesy: () => void;
}) {
  const hasPendingKitchenItems = table.items.some(
    (item) => item.sendToKitchen && item.status === "pending",
  );

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[7fr_3fr]">
      <main className="min-h-0 overflow-y-auto bg-stone-50 p-5">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {posCategories.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={[
                "h-16 min-w-36 rounded-2xl px-5 text-lg font-semibold transition",
                activeCategory === category.id
                  ? "bg-stone-950 text-white shadow-sm"
                  : "border border-stone-200 bg-white text-stone-900 hover:border-stone-300",
              ].join(" ")}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="mt-5 grid max-w-6xl gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categoryProducts.length ? (
            categoryProducts.map((product) => (
              <button
                type="button"
                key={product.id}
                onClick={() => onAddProduct(product)}
                className="overflow-hidden rounded-3xl border border-stone-200 bg-white text-left shadow-sm transition active:scale-[0.99] hover:border-stone-300 hover:shadow-md"
              >
                <ProductImage product={product} />
                <span className="block p-5">
                  <span className="block min-h-16 text-2xl font-semibold text-stone-950">{product.name}</span>
                  <span className="mt-3 flex items-end justify-between gap-3">
                    <span className="text-4xl font-semibold text-stone-950">{money.format(product.price)}</span>
                    <span className="inline-flex h-14 items-center rounded-2xl bg-stone-950 px-5 text-lg font-semibold text-white">
                      Agregar
                    </span>
                  </span>
                </span>
              </button>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center text-xl font-semibold text-stone-500 sm:col-span-2 xl:col-span-3">
              Sin promos por ahora
            </div>
          )}
        </div>
      </main>

      <aside className="flex min-h-0 flex-col border-l border-stone-200 bg-white">
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-stone-500">Cuenta actual</p>
              <h3 className="mt-1 text-3xl font-semibold text-stone-950">{table.name}</h3>
            </div>
            <p className="text-4xl font-semibold text-stone-950">{money.format(total(table))}</p>
          </div>

          <div className="mt-5 space-y-3">
            {table.items.length ? (
              table.items.map((item) => (
                <div key={item.lineId} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-stone-950">
                        {item.quantity}x {item.name}
                      </p>
                      <OrderStatusBadge status={item.status} />
                    </div>
                    <p className="text-xl font-semibold text-stone-950">
                      {money.format(item.price * item.quantity)}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <RoundIconButton label={`Restar ${item.name}`} onClick={() => onChangeQuantity(item.lineId, -1)}>
                        <Minus size={24} />
                      </RoundIconButton>
                      <RoundIconButton label={`Sumar ${item.name}`} onClick={() => onChangeQuantity(item.lineId, 1)}>
                        <Plus size={24} />
                      </RoundIconButton>
                      {item.status === "ready" ? (
                        <button
                          type="button"
                          onClick={() => onMarkServed(item.lineId)}
                          className="h-16 rounded-2xl bg-emerald-600 px-4 text-base font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Servido
                        </button>
                      ) : null}
                    </div>
                    <RoundIconButton label={`Quitar ${item.name}`} onClick={() => onRemoveProduct(item.lineId)}>
                      <Trash2 size={24} />
                    </RoundIconButton>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-lg font-semibold text-stone-500">
                Toca un producto para agregarlo
              </div>
            )}
          </div>

          <div className="mt-5 space-y-3 rounded-3xl bg-stone-50 p-4">
            <TotalLine label="Subtotal" value={subtotal(table)} />
            <TotalLine label="Descuento" value={discountAmount(table)} negative />
            <TotalLine label="Cortesia" value={courtesyAmount(table)} negative />
            <div className="flex items-center justify-between border-t border-stone-200 pt-4">
              <span className="text-xl font-semibold text-stone-950">TOTAL</span>
              <span className="text-5xl font-semibold text-stone-950">{money.format(total(table))}</span>
            </div>
            {table.discount ? (
              <p className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-stone-600">
                Descuento: {table.discount.reason}
              </p>
            ) : null}
            {table.courtesy ? (
              <p className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-stone-600">
                Cortesía: {table.courtesy.label} · {table.courtesy.reason}
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={onOpenDiscount}
                className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white text-base font-semibold text-stone-950"
              >
                <Percent size={21} />
                Descuento
              </button>
              <button
                type="button"
                onClick={onOpenCourtesy}
                className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white text-base font-semibold text-stone-950"
              >
                <Gift size={21} />
                Cortesía
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-stone-200 bg-white p-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={onSendKitchen}
            disabled={!table.openedAt || !hasPendingKitchenItems}
            className="h-20 rounded-3xl bg-emerald-600 text-xl font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            Enviar cocina
          </button>
          <button
            type="button"
            onClick={onStartPayment}
            disabled={!table.openedAt || table.items.length === 0}
            className="h-20 rounded-3xl bg-stone-950 text-xl font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            Cobrar
          </button>
        </div>
      </aside>
    </div>
  );
}

function PaymentStep({
  table,
  onBack,
  onPay,
  onCourtesyClose,
}: {
  table: PosTable;
  onBack: () => void;
  onPay: (payments: PaymentPart[]) => void;
  onCourtesyClose: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("Efectivo");
  const [amountReceived, setAmountReceived] = useState(total(table));
  const [partialMethod, setPartialMethod] = useState<PaymentPart["method"]>("Efectivo");
  const [partialAmount, setPartialAmount] = useState(total(table));
  const [payments, setPayments] = useState<PaymentPart[]>([]);
  const methods: PaymentMethod[] = ["Efectivo", "Tarjeta", "Transferencia", "Mixto"];
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = Math.max(0, total(table) - paid);
  const change = Math.max(0, amountReceived - total(table));
  const visiblePaid = method === "Mixto"
    ? paid
    : method === "Efectivo"
      ? Math.min(Math.max(0, amountReceived), total(table))
      : total(table);
  const visibleRemaining = Math.max(0, total(table) - visiblePaid);
  const canFinish = total(table) === 0 || (visibleRemaining === 0 && (method !== "Mixto" || payments.length > 0));

  function chooseMethod(nextMethod: PaymentMethod) {
    setMethod(nextMethod);
    setPayments([]);
    setPartialAmount(total(table));
  }

  function addPartialPayment() {
    const amount = Math.min(Math.max(0, partialAmount), remaining);
    if (!amount) return;
    setPayments((current) => [...current, { method: partialMethod, amount }]);
    setPartialAmount(Math.max(0, remaining - amount));
  }

  function register() {
    if (method === "Mixto") {
      if (remaining === 0 && payments.length > 0) onPay(payments);
      return;
    }
    if (method === "Efectivo" && amountReceived < total(table)) return;
    onPay([{ method, amount: total(table) }]);
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden bg-stone-50 p-3 md:p-5 lg:grid-cols-[7fr_3fr]">
      <main className="min-h-0 overflow-hidden">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-sm">
          <div className="shrink-0 border-b border-stone-100 p-4 md:p-5">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-14 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 text-base font-semibold text-stone-950"
            >
              <ArrowLeft size={22} />
              Volver a orden
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
            <div className="rounded-3xl bg-stone-50 p-5 text-center md:p-6">
              <p className="text-lg font-semibold text-stone-500">Total a pagar</p>
              <p className="mt-2 text-5xl font-semibold text-stone-950 md:text-6xl">{money.format(total(table))}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {methods.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => chooseMethod(item)}
                  className={[
                    "inline-flex h-20 items-center justify-center gap-3 rounded-3xl border text-lg font-semibold transition",
                    method === item
                      ? "border-stone-950 bg-stone-950 text-white"
                      : "border-stone-200 bg-stone-50 text-stone-950 hover:bg-white",
                  ].join(" ")}
                >
                  {item === "Efectivo" ? <Banknote size={28} /> : <CreditCard size={28} />}
                  {item}
                </button>
              ))}
            </div>
          {method === "Efectivo" ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="block text-base font-semibold text-stone-700">
                Monto recibido
                <input
                  type="number"
                  min={0}
                  value={amountReceived}
                  onChange={(event) => setAmountReceived(Number(event.target.value))}
                  className="mt-2 h-16 w-full rounded-2xl border border-stone-200 px-5 text-xl text-stone-950"
                />
              </label>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-700">Cambio</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-900">{money.format(change)}</p>
              </div>
            </div>
          ) : null}
          {method === "Mixto" ? (
            <div className="mt-4 rounded-3xl border border-stone-200 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {(["Efectivo", "Tarjeta", "Transferencia"] as PaymentPart["method"][]).map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setPartialMethod(item)}
                    className={[
                      "h-14 rounded-2xl border text-base font-semibold",
                      partialMethod === item
                        ? "border-stone-950 bg-stone-950 text-white"
                        : "border-stone-200 bg-stone-50 text-stone-950",
                    ].join(" ")}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  type="number"
                  min={0}
                  max={remaining}
                  value={partialAmount}
                  onChange={(event) => setPartialAmount(Number(event.target.value))}
                  className="h-16 rounded-2xl border border-stone-200 px-5 text-xl text-stone-950"
                  aria-label="Monto del pago parcial"
                />
                <button
                  type="button"
                  onClick={addPartialPayment}
                  disabled={remaining === 0 || partialAmount <= 0}
                  className="h-16 rounded-2xl bg-stone-950 px-6 text-base font-semibold text-white disabled:bg-stone-300"
                >
                  Agregar pago
                </button>
              </div>
              {payments.length ? (
                <div className="mt-4 max-h-36 space-y-2 overflow-y-auto pr-1">
                  {payments.map((payment, index) => (
                    <div key={`${payment.method}-${index}`} className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-base font-semibold text-stone-800">
                      <span>{payment.method}</span>
                      <span className="flex items-center gap-3">
                        {money.format(payment.amount)}
                        <button type="button" onClick={() => setPayments((current) => current.filter((_, paymentIndex) => paymentIndex !== index))} className="grid size-10 place-items-center rounded-xl bg-white text-stone-600" aria-label={`Quitar pago de ${payment.method}`}><Trash2 size={18} /></button>
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          </div>
          <div className="shrink-0 border-t border-stone-200 bg-white p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] md:p-5">
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <CheckoutTotal label="Total a pagar" value={total(table)} />
              <CheckoutTotal label="Total pagado" value={visiblePaid} positive />
              <CheckoutTotal label="Faltante" value={visibleRemaining} warning={visibleRemaining > 0} />
            </div>
            <button
              type="button"
              onClick={total(table) === 0 ? onCourtesyClose : register}
              disabled={!canFinish}
              className="mt-3 h-16 w-full rounded-3xl bg-stone-950 text-xl font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300 md:h-18 md:text-2xl"
            >
              {total(table) === 0 ? "Cerrar como cortesía" : canFinish ? "Finalizar venta" : "Completa el pago"}
            </button>
          </div>
        </div>
      </main>
      <ReceiptPanel table={table} />
    </div>
  );
}

function ReceiptPanel({ table }: { table: PosTable }) {
  return (
    <aside className="hidden min-h-0 flex-col overflow-hidden rounded-[2rem] bg-white shadow-sm lg:flex">
      <div className="shrink-0 border-b border-stone-100 p-5">
        <p className="text-base font-semibold text-stone-500">Cuenta actual</p>
        <h3 className="mt-1 text-3xl font-semibold text-stone-950">{table.name}</h3>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
        {table.items.map((item) => (
          <div key={item.lineId} className="rounded-2xl bg-stone-50 p-4 text-base font-semibold text-stone-950">
            <div className="flex justify-between gap-4">
              <span>{item.quantity}x {item.name}</span>
              <span>{money.format(item.price * item.quantity)}</span>
            </div>
            <OrderStatusBadge status={item.status} />
          </div>
        ))}
      </div>
      <div className="shrink-0 space-y-3 border-t border-stone-200 bg-white p-5">
        <TotalLine label="Subtotal" value={subtotal(table)} />
        <TotalLine label="Descuento" value={discountAmount(table)} negative />
        <TotalLine label="Cortesia" value={courtesyAmount(table)} negative />
        <div className="flex items-center justify-between border-t border-stone-200 pt-4">
          <span className="text-xl font-semibold text-stone-950">TOTAL</span>
          <span className="text-4xl font-semibold text-stone-950">{money.format(total(table))}</span>
        </div>
      </div>
    </aside>
  );
}

function RoundIconButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid size-16 place-items-center rounded-2xl border border-stone-200 bg-white text-stone-900 transition hover:bg-stone-50"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function TotalLine({ label, value, negative = false }: { label: string; value: number; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between text-lg font-semibold text-stone-700">
      <span>{label}</span>
      <span>
        {negative && value > 0 ? "-" : ""}
        {money.format(value)}
      </span>
    </div>
  );
}

function ModalShell({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/65 p-4">
      <div className={["max-h-[92vh] w-full overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl", wide ? "max-w-5xl" : "max-w-xl"].join(" ")}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-stone-950">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 place-items-center rounded-full border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function CheckoutTotal({
  label,
  value,
  positive = false,
  warning = false,
}: {
  label: string;
  value: number;
  positive?: boolean;
  warning?: boolean;
}) {
  return (
    <div className={["min-w-0 rounded-2xl p-3", positive ? "bg-emerald-50" : warning ? "bg-amber-50" : "bg-stone-100"].join(" ")}>
      <p className={["truncate text-xs font-semibold md:text-sm", positive ? "text-emerald-700" : warning ? "text-amber-700" : "text-stone-500"].join(" ")}>{label}</p>
      <p className={["mt-1 truncate text-lg font-semibold md:text-2xl", positive ? "text-emerald-900" : warning ? "text-amber-900" : "text-stone-950"].join(" ")}>{money.format(value)}</p>
    </div>
  );
}

function DiscountModal({
  table,
  onClose,
  onApply,
}: {
  table: PosTable;
  onClose: () => void;
  onApply: (type: "percent" | "fixed", value: number, reason: string, authorizedBy: string) => void;
}) {
  const [type, setType] = useState<"percent" | "fixed">(table.discount?.type ?? "percent");
  const [value, setValue] = useState(table.discount?.value ?? 10);
  const [reason, setReason] = useState(table.discount?.reason ?? "");
  const [authorizedBy, setAuthorizedBy] = useState(table.discount?.authorizedBy ?? "");
  const valid = value > 0 && reason.trim().length > 0;

  return (
    <ModalShell title="Aplicar descuento" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <ChoiceButton active={type === "percent"} onClick={() => setType("percent")}>Porcentaje</ChoiceButton>
        <ChoiceButton active={type === "fixed"} onClick={() => setType("fixed")}>Monto fijo</ChoiceButton>
      </div>
      <div className="mt-5 space-y-4">
        <FormField label={type === "percent" ? "Porcentaje" : "Monto"}>
          <input
            type="number"
            min={0}
            max={type === "percent" ? 100 : subtotal(table)}
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
            className="h-16 w-full rounded-2xl border border-stone-200 px-5 text-xl text-stone-950"
          />
        </FormField>
        <FormField label="Motivo obligatorio">
          <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ej. 10% gerente" className="h-16 w-full rounded-2xl border border-stone-200 px-5 text-lg text-stone-950" />
        </FormField>
        <FormField label="Autorizado por (opcional)">
          <input value={authorizedBy} onChange={(event) => setAuthorizedBy(event.target.value)} placeholder="Nombre" className="h-16 w-full rounded-2xl border border-stone-200 px-5 text-lg text-stone-950" />
        </FormField>
      </div>
      <button type="button" disabled={!valid} onClick={() => onApply(type, value, reason.trim(), authorizedBy.trim())} className="mt-6 h-18 w-full rounded-3xl bg-stone-950 text-xl font-semibold text-white disabled:bg-stone-300">
        Aplicar descuento
      </button>
    </ModalShell>
  );
}

function CourtesyModal({
  table,
  onClose,
  onApply,
}: {
  table: PosTable;
  onClose: () => void;
  onApply: (courtesy: NonNullable<PosTable["courtesy"]>) => void;
}) {
  const [type, setType] = useState<"product" | "amount" | "full">(table.courtesy?.type ?? "product");
  const [productLineId, setProductLineId] = useState(table.courtesy?.productLineId ?? table.items[0]?.lineId ?? "");
  const [amount, setAmount] = useState(table.courtesy?.amount ?? 0);
  const [reason, setReason] = useState(table.courtesy?.reason ?? "");
  const [authorizedBy, setAuthorizedBy] = useState(table.courtesy?.authorizedBy ?? "");
  const [customer, setCustomer] = useState(table.courtesy?.customer ?? table.customer);
  const product = table.items.find((item) => item.lineId === productLineId);
  const valid = reason.trim().length > 0 && authorizedBy.trim().length > 0 && (type !== "product" || Boolean(product)) && (type !== "amount" || amount > 0);

  function apply() {
    if (!valid) return;
    const courtesyAmountValue = type === "full" ? Math.max(0, subtotal(table) - discountAmount(table)) : type === "product" ? (product?.price ?? 0) * (product?.quantity ?? 0) : amount;
    const label = type === "full" ? "Cuenta completa" : type === "product" ? product?.name ?? "Producto" : money.format(amount);
    onApply({ type, label, amount: courtesyAmountValue, reason: reason.trim(), authorizedBy: authorizedBy.trim(), customer: customer.trim() || undefined, productLineId: type === "product" ? productLineId : undefined });
  }

  return (
    <ModalShell title="Registrar cortesía" onClose={onClose}>
      <div className="grid grid-cols-3 gap-2">
        <ChoiceButton active={type === "product"} onClick={() => setType("product")}>Producto</ChoiceButton>
        <ChoiceButton active={type === "amount"} onClick={() => setType("amount")}>Monto</ChoiceButton>
        <ChoiceButton active={type === "full"} onClick={() => setType("full")}>Cuenta completa</ChoiceButton>
      </div>
      <div className="mt-5 space-y-4">
        {type === "product" ? (
          <FormField label="Producto">
            <select value={productLineId} onChange={(event) => setProductLineId(event.target.value)} className="h-16 w-full rounded-2xl border border-stone-200 bg-white px-5 text-lg text-stone-950">
              {table.items.map((item) => <option key={item.lineId} value={item.lineId}>{item.quantity}x {item.name} · {money.format(item.price * item.quantity)}</option>)}
            </select>
          </FormField>
        ) : null}
        {type === "amount" ? (
          <FormField label="Monto">
            <input type="number" min={0} max={subtotal(table)} value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="h-16 w-full rounded-2xl border border-stone-200 px-5 text-xl text-stone-950" />
          </FormField>
        ) : null}
        {type === "full" ? <div className="rounded-2xl bg-emerald-50 p-5 text-lg font-semibold text-emerald-900">El total final será $0.</div> : null}
        <FormField label="Motivo obligatorio"><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ej. Atención al cliente" className="h-16 w-full rounded-2xl border border-stone-200 px-5 text-lg text-stone-950" /></FormField>
        <FormField label="Autorizado por obligatorio"><input value={authorizedBy} onChange={(event) => setAuthorizedBy(event.target.value)} placeholder="Nombre" className="h-16 w-full rounded-2xl border border-stone-200 px-5 text-lg text-stone-950" /></FormField>
        <FormField label="Cliente opcional"><input value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="Nombre del cliente" className="h-16 w-full rounded-2xl border border-stone-200 px-5 text-lg text-stone-950" /></FormField>
      </div>
      <button type="button" disabled={!valid} onClick={apply} className="mt-6 h-18 w-full rounded-3xl bg-stone-950 text-xl font-semibold text-white disabled:bg-stone-300">Aplicar cortesía</button>
    </ModalShell>
  );
}

function ChoiceButton({ children, active, onClick }: { children: ReactNode; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={["min-h-16 rounded-2xl border px-3 text-base font-semibold", active ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-stone-50 text-stone-950"].join(" ")}>{children}</button>;
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-base font-semibold text-stone-700">{label}<span className="mt-2 block">{children}</span></label>;
}

function PaymentCompleteModal({
  isCourtesy,
  isQuickSale,
  onCloseOrder,
}: {
  isCourtesy: boolean;
  isQuickSale: boolean;
  onCloseOrder: () => void;
}) {
  return (
    <ModalShell title={isCourtesy ? "Cortesía registrada" : "Pago completado"} onClose={onCloseOrder}>
      <div className="rounded-3xl bg-emerald-50 p-7 text-center">
        <CheckCircle2 className="mx-auto text-emerald-700" size={54} />
        <p className="mt-4 text-xl font-semibold text-emerald-950">La cuenta está lista para cerrar.</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => window.print()} className="inline-flex h-18 items-center justify-center gap-2 rounded-3xl border border-stone-200 bg-white text-lg font-semibold text-stone-950"><Printer size={23} /> Imprimir ticket</button>
        <button type="button" onClick={onCloseOrder} className="h-18 rounded-3xl bg-stone-950 text-lg font-semibold text-white">{isQuickSale ? "Cerrar orden" : "Cerrar mesa"}</button>
      </div>
    </ModalShell>
  );
}

function OpenTableModal({
  table,
  onClose,
  onOpen,
}: {
  table: PosTable;
  onClose: () => void;
  onOpen: (people: number, customer: string) => void;
}) {
  const [people, setPeople] = useState(table.people || 2);
  const [customer, setCustomer] = useState(table.customer);

  return (
    <ModalShell title={table.name} onClose={onClose}>
      <div className="space-y-5">
        <div>
          <p className="text-xl font-semibold text-stone-950">Cuantas personas?</p>
          <div className="mt-4 grid grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => setPeople(value)}
                className={[
                  "h-16 rounded-2xl text-xl font-semibold transition",
                  people === value ? "bg-stone-950 text-white" : "border border-stone-200 bg-stone-50 text-stone-950",
                ].join(" ")}
              >
                {value}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPeople((value) => value + 1)}
              className="h-16 rounded-2xl border border-stone-200 bg-stone-50 text-xl font-semibold text-stone-950"
            >
              +
            </button>
          </div>
        </div>
        <label className="block text-base font-semibold text-stone-700">
          Cliente opcional
          <input
            value={customer}
            onChange={(event) => setCustomer(event.target.value)}
            className="mt-2 h-14 w-full rounded-2xl border border-stone-200 px-4 text-base text-stone-950"
            placeholder="Nombre del cliente"
          />
        </label>
        <button
          type="button"
          onClick={() => onOpen(people, customer.trim())}
          className="h-16 w-full rounded-3xl bg-stone-950 text-lg font-semibold text-white transition hover:bg-stone-800"
        >
          Abrir mesa
        </button>
      </div>
    </ModalShell>
  );
}

function QuickSaleModal({ onClose, onSelect }: { onClose: () => void; onSelect: (type: string) => void }) {
  const options = ["Comer aquí", "Para llevar", "A domicilio", "Para recoger"];

  return (
    <ModalShell title="Venta rápida" onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => onSelect(option)}
            className="h-24 rounded-3xl border border-stone-200 bg-stone-50 text-xl font-semibold text-stone-950 transition hover:border-stone-300 hover:bg-white"
          >
            {option}
          </button>
        ))}
      </div>
    </ModalShell>
  );
}

function CashierModal({
  sales,
  pending,
  onClose,
}: {
  sales: Sale[];
  pending: number;
  onClose: () => void;
}) {
  const gross = sales.reduce((sum, sale) => sum + (sale.gross ?? sale.total), 0);
  const discounts = sales.reduce((sum, sale) => sum + (sale.discount ?? 0), 0);
  const courtesies = sales.reduce((sum, sale) => sum + (sale.courtesy ?? 0), 0);
  const net = sales.reduce((sum, sale) => sum + sale.total, 0);
  const byMethod = (method: PaymentPart["method"]) =>
    sales.reduce(
      (sum, sale) => sum + (sale.payments ?? []).filter((payment) => payment.method === method).reduce((paymentSum, payment) => paymentSum + payment.amount, 0),
      0,
    );
  const collected = byMethod("Efectivo") + byMethod("Tarjeta") + byMethod("Transferencia");

  return (
    <ModalShell title="Cierre de caja" onClose={onClose} wide>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MiniMetric label="Ventas brutas" value={money.format(gross)} />
        <MiniMetric label="Descuentos" value={money.format(discounts)} />
        <MiniMetric label="Cortesías" value={money.format(courtesies)} />
        <MiniMetric label="Ventas netas" value={money.format(net)} />
        <MiniMetric label="Efectivo" value={money.format(byMethod("Efectivo"))} />
        <MiniMetric label="Tarjeta" value={money.format(byMethod("Tarjeta"))} />
        <MiniMetric label="Transferencia" value={money.format(byMethod("Transferencia"))} />
        <MiniMetric label="Total cobrado" value={money.format(collected)} />
        <MiniMetric label="Pendiente por cobrar" value={money.format(pending)} />
        <MiniMetric label="Ordenes cerradas" value={String(sales.length)} />
      </div>
    </ModalShell>
  );
}
