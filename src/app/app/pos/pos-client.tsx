"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Minus,
  Plus,
  Printer,
  ReceiptText,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { SectionHeader } from "@/components/ui";

type TableStatus = "free" | "occupied" | "checkout";
type ModalType = "open" | "quick" | "order" | "cashier" | null;
type PosStep = "order" | "payment" | "paid";
type PaymentMethod = "Efectivo" | "Tarjeta" | "Transferencia" | "Mixto";
type Category = "Sushi" | "Entradas" | "Bebidas" | "Postres" | "Promos";

type Product = {
  id: string;
  name: string;
  price: number;
  category: Category;
};

type OrderItem = Product & {
  quantity: number;
  sent: boolean;
};

type Discount = {
  type: "percent" | "fixed";
  value: number;
  reason: string;
};

type Courtesy = {
  label: string;
  amount: number;
  reason: string;
  authorizedBy: string;
};

type PosTable = {
  id: string;
  name: string;
  customer: string;
  people: number;
  openedAt: string | null;
  items: OrderItem[];
  discount: Discount | null;
  courtesy: Courtesy | null;
  readyToPay: boolean;
  quickType?: string;
};

type Sale = {
  id: string;
  tableName: string;
  total: number;
  paymentMethod: PaymentMethod;
  closedAt: string;
};

type PaidOrder = {
  tableId: string;
  method: PaymentMethod;
  amountReceived: number;
};

const categories: Category[] = ["Sushi", "Entradas", "Bebidas", "Postres", "Promos"];

const products: Product[] = [
  { id: "california", name: "Rollo California", price: 180, category: "Sushi" },
  { id: "salmon", name: "Rollo Salmon", price: 220, category: "Sushi" },
  { id: "ramen", name: "Ramen", price: 190, category: "Entradas" },
  { id: "edamame", name: "Edamame", price: 120, category: "Entradas" },
  { id: "agua", name: "Agua mineral", price: 60, category: "Bebidas" },
  { id: "sake", name: "Sake", price: 250, category: "Bebidas" },
  { id: "mochi", name: "Postre Mochi", price: 140, category: "Postres" },
];

const initialTables: PosTable[] = [
  {
    id: "mesa-1",
    name: "Mesa 1",
    customer: "",
    people: 0,
    openedAt: null,
    items: [],
    discount: null,
    courtesy: null,
    readyToPay: false,
  },
  {
    id: "mesa-2",
    name: "Mesa 2",
    customer: "Ana Lopez",
    people: 2,
    openedAt: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
    items: [
      { ...products[0], quantity: 2, sent: true },
      { ...products[4], quantity: 2, sent: true },
    ],
    discount: null,
    courtesy: null,
    readyToPay: false,
  },
  {
    id: "mesa-3",
    name: "Mesa 3",
    customer: "",
    people: 0,
    openedAt: null,
    items: [],
    discount: null,
    courtesy: null,
    readyToPay: false,
  },
  {
    id: "mesa-4",
    name: "Mesa 4",
    customer: "Roberto",
    people: 4,
    openedAt: new Date(Date.now() - 64 * 60 * 1000).toISOString(),
    items: [
      { ...products[1], quantity: 3, sent: true },
      { ...products[5], quantity: 1, sent: false },
    ],
    discount: { type: "percent", value: 10, reason: "Descuento gerente" },
    courtesy: null,
    readyToPay: true,
  },
  {
    id: "barra",
    name: "Barra",
    customer: "Venta rapida",
    people: 1,
    openedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    items: [{ ...products[2], quantity: 1, sent: false }],
    discount: null,
    courtesy: null,
    readyToPay: false,
    quickType: "Comer aqui",
  },
  {
    id: "terraza",
    name: "Terraza",
    customer: "",
    people: 0,
    openedAt: null,
    items: [],
    discount: null,
    courtesy: null,
    readyToPay: false,
  },
];

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
  return table.discount.type === "percent"
    ? Math.round((base * table.discount.value) / 100)
    : table.discount.value;
}

function courtesyAmount(table: PosTable) {
  return table.courtesy?.amount ?? 0;
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
  const [activeCategory, setActiveCategory] = useState<Category>("Sushi");
  const [modal, setModal] = useState<ModalType>(null);
  const [posStep, setPosStep] = useState<PosStep>("order");
  const [toast, setToast] = useState("");
  const [sales, setSales] = useState<Sale[]>([]);
  const [paidOrder, setPaidOrder] = useState<PaidOrder | null>(null);

  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? tables[0];
  const categoryProducts = products.filter((product) => product.category === activeCategory);

  const metrics = useMemo(() => {
    const openTables = tables.filter((table) => table.openedAt);
    return {
      pending: openTables.reduce((sum, table) => sum + total(table), 0),
      open: openTables.length,
      finished: sales.length,
    };
  }, [sales.length, tables]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
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
    setTables((current) =>
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
    setTables((current) =>
      current.map((table) => {
        if (table.id !== selectedTable.id || !table.openedAt) return table;
        const existing = table.items.find((item) => item.id === product.id);
        const items = existing
          ? table.items.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1, sent: false } : item,
            )
          : [...table.items, { ...product, quantity: 1, sent: false }];
        return { ...table, items, readyToPay: false };
      }),
    );
  }

  function changeQuantity(productId: string, change: number) {
    setTables((current) =>
      current.map((table) => {
        if (table.id !== selectedTable.id) return table;
        const items = table.items
          .map((item) =>
            item.id === productId ? { ...item, quantity: item.quantity + change, sent: false } : item,
          )
          .filter((item) => item.quantity > 0);
        return { ...table, items, readyToPay: false };
      }),
    );
  }

  function removeProduct(productId: string) {
    setTables((current) =>
      current.map((table) =>
        table.id === selectedTable.id
          ? { ...table, items: table.items.filter((item) => item.id !== productId), readyToPay: false }
          : table,
      ),
    );
  }

  function sendToKitchen() {
    if (!selectedTable.openedAt || selectedTable.items.length === 0) return;
    setTables((current) =>
      current.map((table) =>
        table.id === selectedTable.id
          ? { ...table, items: table.items.map((item) => ({ ...item, sent: true })), readyToPay: false }
          : table,
      ),
    );
    showToast("Orden enviada a cocina");
  }

  function startPayment() {
    if (!selectedTable.openedAt || selectedTable.items.length === 0) return;
    setTables((current) =>
      current.map((table) => (table.id === selectedTable.id ? { ...table, readyToPay: true } : table)),
    );
    setPosStep("payment");
  }

  function registerPayment(method: PaymentMethod, amountReceived: number) {
    setPaidOrder({ tableId: selectedTable.id, method, amountReceived });
    setPosStep("paid");
    showToast("Pago completado");
  }

  function closeOrder() {
    if (!paidOrder) return;
    const table = tables.find((item) => item.id === paidOrder.tableId);
    if (!table) return;

    setSales((current) => [
      {
        id: `sale-${Date.now()}`,
        tableName: table.name,
        total: total(table),
        paymentMethod: paidOrder.method,
        closedAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setTables((current) =>
      current.map((item) =>
        item.id === paidOrder.tableId
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
    setPaidOrder(null);
    setPosStep("order");
    setModal(null);
    showToast("Mesa liberada");
  }

  function openQuickSale(type: string) {
    const barId = "barra";
    setTables((current) =>
      current.map((table) =>
        table.id === barId
          ? {
              ...table,
              customer: type,
              people: 1,
              openedAt: table.openedAt ?? new Date().toISOString(),
              readyToPay: false,
              quickType: type,
            }
          : table,
      ),
    );
    setSelectedTableId(barId);
    setPosStep("order");
    setModal("order");
    showToast("Venta rapida abierta");
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
              Venta rapida
            </ActionButton>
            <ActionButton onClick={() => setModal("cashier")} icon={<ReceiptText size={22} />} light>
              Cierre de caja
            </ActionButton>
          </>
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        <MiniMetric label="Pendiente por cobrar" value={money.format(metrics.pending)} />
        <MiniMetric label="Mesas abiertas" value={String(metrics.open)} />
        <MiniMetric label="Ventas finalizadas" value={String(metrics.finished)} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tables.map((table) => (
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
          activeCategory={activeCategory}
          categoryProducts={categoryProducts}
          onCategoryChange={setActiveCategory}
          onBack={() => {
            setPosStep("order");
            setModal(null);
          }}
          onAddProduct={addProduct}
          onChangeQuantity={changeQuantity}
          onRemoveProduct={removeProduct}
          onSendKitchen={sendToKitchen}
          onStartPayment={startPayment}
          onBackToOrder={() => setPosStep("order")}
          onPay={registerPayment}
          onPrint={() => showToast("Ticket listo para imprimir")}
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

function FullscreenPos({
  table,
  step,
  activeCategory,
  categoryProducts,
  onCategoryChange,
  onBack,
  onAddProduct,
  onChangeQuantity,
  onRemoveProduct,
  onSendKitchen,
  onStartPayment,
  onBackToOrder,
  onPay,
  onPrint,
  onCloseOrder,
}: {
  table: PosTable;
  step: PosStep;
  activeCategory: Category;
  categoryProducts: Product[];
  onCategoryChange: (category: Category) => void;
  onBack: () => void;
  onAddProduct: (product: Product) => void;
  onChangeQuantity: (productId: string, change: number) => void;
  onRemoveProduct: (productId: string) => void;
  onSendKitchen: () => void;
  onStartPayment: () => void;
  onBackToOrder: () => void;
  onPay: (method: PaymentMethod, amountReceived: number) => void;
  onPrint: () => void;
  onCloseOrder: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-3 transition-opacity">
      <div className="flex h-[95vh] w-[95vw] flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
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
              {statusLabel(tableStatus(table))}
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
            categoryProducts={categoryProducts}
            onCategoryChange={onCategoryChange}
            onAddProduct={onAddProduct}
            onChangeQuantity={onChangeQuantity}
            onRemoveProduct={onRemoveProduct}
            onSendKitchen={onSendKitchen}
            onStartPayment={onStartPayment}
          />
        ) : null}

        {step === "payment" ? <PaymentStep table={table} onBack={onBackToOrder} onPay={onPay} /> : null}

        {step === "paid" ? (
          <PaidStep table={table} onPrint={onPrint} onCloseOrder={onCloseOrder} />
        ) : null}
      </div>
    </div>
  );
}

function OrderStep({
  table,
  activeCategory,
  categoryProducts,
  onCategoryChange,
  onAddProduct,
  onChangeQuantity,
  onRemoveProduct,
  onSendKitchen,
  onStartPayment,
}: {
  table: PosTable;
  activeCategory: Category;
  categoryProducts: Product[];
  onCategoryChange: (category: Category) => void;
  onAddProduct: (product: Product) => void;
  onChangeQuantity: (productId: string, change: number) => void;
  onRemoveProduct: (productId: string) => void;
  onSendKitchen: () => void;
  onStartPayment: () => void;
}) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[7fr_3fr]">
      <main className="min-h-0 overflow-y-auto bg-stone-50 p-5">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              onClick={() => onCategoryChange(category)}
              className={[
                "h-16 min-w-36 rounded-2xl px-5 text-lg font-semibold transition",
                activeCategory === category
                  ? "bg-stone-950 text-white shadow-sm"
                  : "border border-stone-200 bg-white text-stone-900 hover:border-stone-300",
              ].join(" ")}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categoryProducts.length ? (
            categoryProducts.map((product) => (
              <button
                type="button"
                key={product.id}
                onClick={() => onAddProduct(product)}
                className="min-h-44 rounded-3xl border border-stone-200 bg-white p-5 text-left shadow-sm transition active:scale-[0.99] hover:border-stone-300 hover:shadow-md"
              >
                <span className="block text-2xl font-semibold text-stone-950">{product.name}</span>
                <span className="mt-6 block text-4xl font-semibold text-stone-950">
                  {money.format(product.price)}
                </span>
                <span className="mt-6 inline-flex h-12 items-center rounded-2xl bg-stone-950 px-5 text-base font-semibold text-white">
                  Agregar
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
                <div key={item.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-stone-950">
                        {item.quantity}x {item.name}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-stone-500">
                        {item.sent ? "Enviado cocina" : "Nuevo"}
                      </p>
                    </div>
                    <p className="text-xl font-semibold text-stone-950">
                      {money.format(item.price * item.quantity)}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <RoundIconButton label={`Restar ${item.name}`} onClick={() => onChangeQuantity(item.id, -1)}>
                        <Minus size={18} />
                      </RoundIconButton>
                      <RoundIconButton label={`Sumar ${item.name}`} onClick={() => onChangeQuantity(item.id, 1)}>
                        <Plus size={18} />
                      </RoundIconButton>
                    </div>
                    <RoundIconButton label={`Quitar ${item.name}`} onClick={() => onRemoveProduct(item.id)}>
                      <Trash2 size={18} />
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
          </div>
        </div>

        <div className="grid gap-3 border-t border-stone-200 bg-white p-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={onSendKitchen}
            disabled={!table.openedAt || table.items.length === 0}
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
}: {
  table: PosTable;
  onBack: () => void;
  onPay: (method: PaymentMethod, amountReceived: number) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("Efectivo");
  const [amountReceived, setAmountReceived] = useState(total(table));
  const methods: PaymentMethod[] = ["Efectivo", "Tarjeta", "Transferencia", "Mixto"];

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 bg-stone-50 p-5 lg:grid-cols-[7fr_3fr]">
      <main className="flex min-h-0 items-center justify-center">
        <div className="w-full max-w-3xl rounded-[2rem] bg-white p-8 shadow-sm">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-14 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 text-base font-semibold text-stone-950"
          >
            <ArrowLeft size={22} />
            Volver a orden
          </button>
          <div className="mt-8 rounded-3xl bg-stone-50 p-8 text-center">
            <p className="text-lg font-semibold text-stone-500">Total a pagar</p>
            <p className="mt-3 text-7xl font-semibold text-stone-950">{money.format(total(table))}</p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {methods.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setMethod(item)}
                className={[
                  "inline-flex h-24 items-center justify-center gap-3 rounded-3xl border text-xl font-semibold transition",
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
            <label className="mt-5 block text-base font-semibold text-stone-700">
              Monto recibido
              <input
                type="number"
                min={total(table)}
                value={amountReceived}
                onChange={(event) => setAmountReceived(Number(event.target.value))}
                className="mt-2 h-16 w-full rounded-2xl border border-stone-200 px-5 text-xl text-stone-950"
              />
            </label>
          ) : null}
          <button
            type="button"
            onClick={() => onPay(method, amountReceived)}
            className="mt-6 h-20 w-full rounded-3xl bg-stone-950 text-2xl font-semibold text-white transition hover:bg-stone-800"
          >
            Registrar pago
          </button>
        </div>
      </main>
      <ReceiptPanel table={table} />
    </div>
  );
}

function PaidStep({
  table,
  onPrint,
  onCloseOrder,
}: {
  table: PosTable;
  onPrint: () => void;
  onCloseOrder: () => void;
}) {
  return (
    <div className="grid min-h-0 flex-1 place-items-center bg-stone-50 p-5">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto text-emerald-700" size={64} />
        <h3 className="mt-5 text-4xl font-semibold text-stone-950">Pago completado</h3>
        <p className="mt-3 text-xl font-semibold text-stone-500">{table.name}</p>
        <p className="mt-5 text-6xl font-semibold text-stone-950">{money.format(total(table))}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex h-20 items-center justify-center gap-2 rounded-3xl border border-stone-200 bg-white text-xl font-semibold text-stone-950 transition hover:bg-stone-50"
          >
            <Printer size={24} />
            Imprimir ticket
          </button>
          <button
            type="button"
            onClick={onCloseOrder}
            className="h-20 rounded-3xl bg-stone-950 text-xl font-semibold text-white transition hover:bg-stone-800"
          >
            Cerrar orden
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiptPanel({ table }: { table: PosTable }) {
  return (
    <aside className="hidden min-h-0 flex-col overflow-y-auto rounded-[2rem] bg-white p-5 shadow-sm lg:flex">
      <p className="text-base font-semibold text-stone-500">Cuenta actual</p>
      <h3 className="mt-1 text-3xl font-semibold text-stone-950">{table.name}</h3>
      <div className="mt-5 space-y-3">
        {table.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-4 rounded-2xl bg-stone-50 p-4 text-base font-semibold text-stone-950">
            <span>{item.quantity}x {item.name}</span>
            <span>{money.format(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto space-y-3 pt-5">
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
      className="grid size-12 place-items-center rounded-2xl border border-stone-200 bg-white text-stone-900 transition hover:bg-stone-50"
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
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/55 p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
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
  const options = ["Comer aqui", "Para llevar", "A domicilio", "Para recoger"];

  return (
    <ModalShell title="Venta rapida" onClose={onClose}>
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
  const finalized = sales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <ModalShell title="Cierre de caja" onClose={onClose}>
      <div className="grid gap-3">
        <MiniMetric label="Pendiente por cobrar" value={money.format(pending)} />
        <MiniMetric label="Ventas finalizadas" value={money.format(finalized)} />
        <MiniMetric label="Ordenes cerradas" value={String(sales.length)} />
      </div>
    </ModalShell>
  );
}
