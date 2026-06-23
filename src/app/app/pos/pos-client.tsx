"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Gift,
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
type ModalType = "open" | "quick" | "discount" | "courtesy" | "payment" | "paid" | "cashier" | null;
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

  function beginOpenTable(tableId?: string) {
    const firstFree = tables.find((table) => !table.openedAt);
    const targetId = tableId ?? firstFree?.id ?? selectedTableId;
    setSelectedTableId(targetId);
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
    setModal(null);
    showToast("Mesa abierta");
  }

  function addProduct(product: Product) {
    if (!selectedTable.openedAt) {
      beginOpenTable(selectedTable.id);
      return;
    }

    setTables((current) =>
      current.map((table) => {
        if (table.id !== selectedTable.id) return table;
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

  function markReadyToPay() {
    if (!selectedTable.openedAt || selectedTable.items.length === 0) return;
    setTables((current) =>
      current.map((table) => (table.id === selectedTable.id ? { ...table, readyToPay: true } : table)),
    );
    setModal("payment");
  }

  function applyDiscount(formData: FormData) {
    const type = formData.get("type") === "fixed" ? "fixed" : "percent";
    const value = Number(formData.get("value") ?? 0);
    const reason = String(formData.get("reason") ?? "").trim();
    if (!value || !reason) return;
    setTables((current) =>
      current.map((table) =>
        table.id === selectedTable.id ? { ...table, discount: { type, value, reason } } : table,
      ),
    );
    setModal(null);
  }

  function applyCourtesy(formData: FormData) {
    const label = String(formData.get("label") ?? "").trim() || "Cortesia";
    const amount = Number(formData.get("amount") ?? 0);
    const reason = String(formData.get("reason") ?? "").trim();
    const authorizedBy = String(formData.get("authorizedBy") ?? "").trim();
    if (!amount || !reason || !authorizedBy) return;
    setTables((current) =>
      current.map((table) =>
        table.id === selectedTable.id
          ? { ...table, courtesy: { label, amount, reason, authorizedBy } }
          : table,
      ),
    );
    setModal(null);
  }

  function registerPayment(method: PaymentMethod, amountReceived: number) {
    setPaidOrder({ tableId: selectedTable.id, method, amountReceived });
    setModal("paid");
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
    setModal(null);
    setPaidOrder(null);
    setSelectedTableId(paidOrder.tableId);
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
    setModal(null);
    showToast("Venta rapida abierta");
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed right-5 top-5 z-50 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 shadow-xl">
          <CheckCircle2 size={20} />
          {toast}
        </div>
      ) : null}

      <SectionHeader
        eyebrow="POS"
        title="Punto de Venta"
        description="Mesas, orden y cobro en un flujo claro para operar desde tablet."
        actions={
          <>
            <button
              type="button"
              onClick={() => beginOpenTable()}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-6 text-base font-semibold text-white shadow-sm transition hover:bg-stone-800"
            >
              <Plus size={22} />
              Abrir mesa
            </button>
            <button
              type="button"
              onClick={() => setModal("quick")}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 text-base font-semibold text-stone-900 shadow-sm transition hover:bg-stone-50"
            >
              <Sparkles size={22} />
              Venta rapida
            </button>
            <button
              type="button"
              onClick={() => setModal("cashier")}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 text-base font-semibold text-stone-900 shadow-sm transition hover:bg-stone-50"
            >
              <ReceiptText size={22} />
              Cierre de caja
            </button>
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
          <TableCard
            key={table.id}
            table={table}
            selected={table.id === selectedTable.id}
            onClick={() => {
              setSelectedTableId(table.id);
              if (!table.openedAt) beginOpenTable(table.id);
            }}
          />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-stone-500">Orden abierta</p>
              <h2 className="mt-1 text-3xl font-semibold text-stone-950">{selectedTable.name}</h2>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold text-stone-700">
              <span className="inline-flex h-11 items-center gap-2 rounded-2xl bg-stone-100 px-4">
                <Users size={18} />
                {selectedTable.people || 0} personas
              </span>
              <span className="inline-flex h-11 items-center rounded-2xl bg-stone-100 px-4">
                {selectedTable.customer || "Cliente opcional"}
              </span>
            </div>
          </div>

          <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                onClick={() => setActiveCategory(category)}
                className={[
                  "h-14 min-w-32 rounded-2xl px-5 text-base font-semibold transition",
                  activeCategory === category
                    ? "bg-stone-950 text-white shadow-sm"
                    : "border border-stone-200 bg-stone-50 text-stone-800 hover:bg-white",
                ].join(" ")}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryProducts.length ? (
              categoryProducts.map((product) => (
                <button
                  type="button"
                  key={product.id}
                  onClick={() => addProduct(product)}
                  className="min-h-36 rounded-3xl border border-stone-200 bg-stone-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white hover:shadow-md"
                >
                  <span className="block text-xl font-semibold text-stone-950">{product.name}</span>
                  <span className="mt-5 block text-3xl font-semibold text-stone-950">
                    {money.format(product.price)}
                  </span>
                  <span className="mt-5 inline-flex h-10 items-center gap-2 rounded-2xl bg-stone-950 px-4 text-sm font-semibold text-white">
                    <Plus size={18} />
                    Agregar
                  </span>
                </button>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-base font-semibold text-stone-500 sm:col-span-2 lg:col-span-3">
                Sin promos por ahora
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm xl:sticky xl:top-5 xl:self-start">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-500">Cuenta</p>
              <h2 className="mt-1 text-3xl font-semibold text-stone-950">{selectedTable.name}</h2>
            </div>
            <span className={["rounded-full border px-3 py-1 text-sm font-semibold", statusClasses(tableStatus(selectedTable))].join(" ")}>
              {statusLabel(tableStatus(selectedTable))}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {selectedTable.items.length ? (
              selectedTable.items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-stone-950">{item.name}</p>
                      <p className="mt-1 text-sm font-medium text-stone-500">
                        {item.sent ? "Enviado cocina" : "Nuevo"} · {money.format(item.price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProduct(item.id)}
                      className="grid size-10 place-items-center rounded-full border border-stone-200 bg-white text-stone-500 transition hover:text-red-600"
                      aria-label={`Quitar ${item.name}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.id, -1)}
                        className="grid size-12 place-items-center rounded-2xl border border-stone-200 bg-white text-stone-900"
                        aria-label={`Restar ${item.name}`}
                      >
                        <Minus size={18} />
                      </button>
                      <span className="grid size-12 place-items-center rounded-2xl bg-white text-xl font-semibold text-stone-950">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.id, 1)}
                        className="grid size-12 place-items-center rounded-2xl border border-stone-200 bg-white text-stone-900"
                        aria-label={`Sumar ${item.name}`}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <p className="text-xl font-semibold text-stone-950">
                      {money.format(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-7 text-center text-base font-semibold text-stone-500">
                Agrega productos para empezar
              </div>
            )}
          </div>

          <div className="mt-5 space-y-3 rounded-3xl bg-stone-50 p-4">
            <TotalLine label="Subtotal" value={subtotal(selectedTable)} />
            <TotalLine label="Descuento" value={discountAmount(selectedTable)} negative />
            <TotalLine label="Cortesia" value={courtesyAmount(selectedTable)} negative />
            <div className="flex items-center justify-between border-t border-stone-200 pt-4">
              <span className="text-lg font-semibold text-stone-950">Total</span>
              <span className="text-4xl font-semibold text-stone-950">{money.format(total(selectedTable))}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setModal("discount")}
              className="h-14 rounded-2xl border border-stone-200 bg-white text-base font-semibold text-stone-900 transition hover:bg-stone-50"
            >
              Descuento
            </button>
            <button
              type="button"
              onClick={() => setModal("courtesy")}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white text-base font-semibold text-stone-900 transition hover:bg-stone-50"
            >
              <Gift size={18} />
              Cortesia
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            <button
              type="button"
              onClick={sendToKitchen}
              disabled={!selectedTable.openedAt || selectedTable.items.length === 0}
              className="inline-flex h-16 items-center justify-center gap-3 rounded-3xl bg-emerald-600 text-lg font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              <CheckCircle2 size={24} />
              Enviar cocina
            </button>
            <button
              type="button"
              onClick={markReadyToPay}
              disabled={!selectedTable.openedAt || selectedTable.items.length === 0}
              className="inline-flex h-16 items-center justify-center gap-3 rounded-3xl bg-stone-950 text-lg font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              <Banknote size={24} />
              Cobrar
            </button>
          </div>
        </aside>
      </section>

      {modal === "open" ? (
        <OpenTableModal
          table={selectedTable}
          onClose={() => setModal(null)}
          onOpen={(people, customer) => openTable(selectedTable.id, people, customer)}
        />
      ) : null}

      {modal === "quick" ? <QuickSaleModal onClose={() => setModal(null)} onSelect={openQuickSale} /> : null}

      {modal === "discount" ? (
        <SimpleFormModal title="Aplicar descuento" onClose={() => setModal(null)} onSubmit={applyDiscount}>
          <label className="text-sm font-semibold text-stone-700">
            Tipo
            <select
              name="type"
              className="mt-2 h-14 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-950"
            >
              <option value="percent">Porcentaje</option>
              <option value="fixed">Monto fijo</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-stone-700">
            Valor
            <input
              name="value"
              type="number"
              min="1"
              required
              className="mt-2 h-14 w-full rounded-2xl border border-stone-200 px-4 text-base text-stone-950"
              placeholder="10"
            />
          </label>
          <label className="text-sm font-semibold text-stone-700">
            Motivo
            <input
              name="reason"
              required
              className="mt-2 h-14 w-full rounded-2xl border border-stone-200 px-4 text-base text-stone-950"
              placeholder="Descuento gerente"
            />
          </label>
        </SimpleFormModal>
      ) : null}

      {modal === "courtesy" ? (
        <SimpleFormModal title="Registrar cortesia" onClose={() => setModal(null)} onSubmit={applyCourtesy}>
          <label className="text-sm font-semibold text-stone-700">
            Producto o monto
            <input
              name="label"
              className="mt-2 h-14 w-full rounded-2xl border border-stone-200 px-4 text-base text-stone-950"
              placeholder="Postre Mochi"
            />
          </label>
          <label className="text-sm font-semibold text-stone-700">
            Monto
            <input
              name="amount"
              type="number"
              min="1"
              required
              className="mt-2 h-14 w-full rounded-2xl border border-stone-200 px-4 text-base text-stone-950"
              placeholder="140"
            />
          </label>
          <label className="text-sm font-semibold text-stone-700">
            Motivo
            <input
              name="reason"
              required
              className="mt-2 h-14 w-full rounded-2xl border border-stone-200 px-4 text-base text-stone-950"
              placeholder="Cortesia de la casa"
            />
          </label>
          <label className="text-sm font-semibold text-stone-700">
            Autorizado por
            <input
              name="authorizedBy"
              required
              className="mt-2 h-14 w-full rounded-2xl border border-stone-200 px-4 text-base text-stone-950"
              placeholder="Gerente"
            />
          </label>
        </SimpleFormModal>
      ) : null}

      {modal === "payment" ? (
        <PaymentModal table={selectedTable} onClose={() => setModal(null)} onPay={registerPayment} />
      ) : null}

      {modal === "paid" ? (
        <PaidModal
          table={tables.find((table) => table.id === paidOrder?.tableId) ?? selectedTable}
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-stone-950">{value}</p>
    </div>
  );
}

function TableCard({
  table,
  selected,
  onClick,
}: {
  table: PosTable;
  selected: boolean;
  onClick: () => void;
}) {
  const status = tableStatus(table);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "min-h-52 rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        selected ? "border-stone-950 bg-white ring-2 ring-stone-950/10" : "border-stone-200 bg-white",
      ].join(" ")}
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

function TotalLine({ label, value, negative = false }: { label: string; value: number; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between text-base font-semibold text-stone-700">
      <span>{label}</span>
      <span>{negative && value > 0 ? "-" : ""}{money.format(value)}</span>
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/45 p-4">
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
    <ModalShell title={`Abrir ${table.name}`} onClose={onClose}>
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-stone-600">Personas</p>
          <div className="mt-3 grid grid-cols-6 gap-2">
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
        <label className="block text-sm font-semibold text-stone-700">
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

function SimpleFormModal({
  title,
  children,
  onClose,
  onSubmit,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <ModalShell title={title} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(new FormData(event.currentTarget));
        }}
      >
        {children}
        <button
          type="submit"
          className="h-16 w-full rounded-3xl bg-stone-950 text-lg font-semibold text-white transition hover:bg-stone-800"
        >
          Guardar
        </button>
      </form>
    </ModalShell>
  );
}

function PaymentModal({
  table,
  onClose,
  onPay,
}: {
  table: PosTable;
  onClose: () => void;
  onPay: (method: PaymentMethod, amountReceived: number) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("Efectivo");
  const [amountReceived, setAmountReceived] = useState(total(table));
  const methods: PaymentMethod[] = ["Efectivo", "Tarjeta", "Transferencia", "Mixto"];

  return (
    <ModalShell title="Cobrar" onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-3xl bg-stone-50 p-5 text-center">
          <p className="text-sm font-semibold text-stone-500">Total a pagar</p>
          <p className="mt-2 text-5xl font-semibold text-stone-950">{money.format(total(table))}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {methods.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setMethod(item)}
              className={[
                "inline-flex h-20 items-center justify-center gap-3 rounded-3xl border text-lg font-semibold transition",
                method === item
                  ? "border-stone-950 bg-stone-950 text-white"
                  : "border-stone-200 bg-stone-50 text-stone-950 hover:bg-white",
              ].join(" ")}
            >
              {item === "Efectivo" ? <Banknote size={24} /> : <CreditCard size={24} />}
              {item}
            </button>
          ))}
        </div>
        {method === "Efectivo" ? (
          <label className="block text-sm font-semibold text-stone-700">
            Monto recibido
            <input
              type="number"
              min={total(table)}
              value={amountReceived}
              onChange={(event) => setAmountReceived(Number(event.target.value))}
              className="mt-2 h-14 w-full rounded-2xl border border-stone-200 px-4 text-base text-stone-950"
            />
          </label>
        ) : null}
        <button
          type="button"
          onClick={() => onPay(method, amountReceived)}
          className="h-16 w-full rounded-3xl bg-stone-950 text-lg font-semibold text-white transition hover:bg-stone-800"
        >
          Registrar pago
        </button>
      </div>
    </ModalShell>
  );
}

function PaidModal({
  table,
  onPrint,
  onCloseOrder,
}: {
  table: PosTable;
  onPrint: () => void;
  onCloseOrder: () => void;
}) {
  return (
    <ModalShell title="Pago completado" onClose={onCloseOrder}>
      <div className="space-y-5">
        <div className="rounded-3xl bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="mx-auto text-emerald-700" size={42} />
          <p className="mt-3 text-sm font-semibold text-emerald-700">{table.name}</p>
          <p className="mt-2 text-4xl font-semibold text-stone-950">{money.format(total(table))}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex h-16 items-center justify-center gap-2 rounded-3xl border border-stone-200 bg-white text-lg font-semibold text-stone-950 transition hover:bg-stone-50"
          >
            <Printer size={22} />
            Imprimir ticket
          </button>
          <button
            type="button"
            onClick={onCloseOrder}
            className="h-16 rounded-3xl bg-stone-950 text-lg font-semibold text-white transition hover:bg-stone-800"
          >
            Cerrar orden
          </button>
        </div>
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
