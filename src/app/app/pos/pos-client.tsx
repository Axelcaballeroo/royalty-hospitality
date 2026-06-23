"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Gift,
  Minus,
  Plus,
  ReceiptText,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { SectionHeader } from "@/components/ui";

type TableStatus = "free" | "occupied" | "checkout";
type ModalType = "open" | "discount" | "courtesy" | "payment" | "cashier" | null;
type DiscountType = "percent" | "fixed";
type PaymentMethod = "Efectivo" | "Tarjeta" | "Transferencia" | "Mixto";

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
};

type OrderItem = Product & {
  quantity: number;
};

type Discount = {
  type: DiscountType;
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
  note: string;
  openedAt: number | null;
  items: OrderItem[];
  discount: Discount | null;
  courtesy: Courtesy | null;
};

type Sale = {
  id: string;
  tableName: string;
  total: number;
  paymentMethod: PaymentMethod;
  closedAt: number;
};

const products: Product[] = [
  { id: "california", name: "Rollo California", price: 180, category: "Sushi" },
  { id: "salmon", name: "Rollo Salmon", price: 220, category: "Sushi" },
  { id: "ramen", name: "Ramen", price: 190, category: "Cocina" },
  { id: "edamame", name: "Edamame", price: 120, category: "Entrada" },
  { id: "agua", name: "Agua mineral", price: 60, category: "Bebida" },
  { id: "sake", name: "Sake", price: 250, category: "Bebida" },
  { id: "mochi", name: "Postre Mochi", price: 140, category: "Postre" },
];

const initialTables: PosTable[] = [
  {
    id: "mesa-1",
    name: "Mesa 1",
    customer: "",
    people: 0,
    note: "",
    openedAt: null,
    items: [],
    discount: null,
    courtesy: null,
  },
  {
    id: "mesa-2",
    name: "Mesa 2",
    customer: "Ana Lopez",
    people: 2,
    note: "Sin picante",
    openedAt: Date.now() - 24 * 60 * 1000,
    items: [
      { ...products[0], quantity: 1 },
      { ...products[4], quantity: 2 },
    ],
    discount: null,
    courtesy: null,
  },
  {
    id: "mesa-3",
    name: "Mesa 3",
    customer: "",
    people: 0,
    note: "",
    openedAt: null,
    items: [],
    discount: null,
    courtesy: null,
  },
  {
    id: "mesa-4",
    name: "Mesa 4",
    customer: "Roberto Diaz",
    people: 4,
    note: "Cumpleanos",
    openedAt: Date.now() - 43 * 60 * 1000,
    items: [
      { ...products[1], quantity: 2 },
      { ...products[2], quantity: 1 },
      { ...products[5], quantity: 1 },
    ],
    discount: { type: "percent", value: 10, reason: "descuento gerente" },
    courtesy: null,
  },
  {
    id: "barra",
    name: "Barra",
    customer: "",
    people: 1,
    note: "Venta rapida",
    openedAt: Date.now() - 9 * 60 * 1000,
    items: [{ ...products[5], quantity: 1 }],
    discount: null,
    courtesy: null,
  },
  {
    id: "terraza",
    name: "Terraza",
    customer: "",
    people: 0,
    note: "",
    openedAt: null,
    items: [],
    discount: null,
    courtesy: null,
  },
];

const currency = new Intl.NumberFormat("es-MX", {
  currency: "MXN",
  style: "currency",
});

function getSubtotal(table: PosTable) {
  return table.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getDiscountAmount(table: PosTable) {
  const subtotal = getSubtotal(table);
  if (!table.discount) return 0;
  if (table.discount.type === "percent") {
    return Math.min(subtotal, subtotal * (table.discount.value / 100));
  }
  return Math.min(subtotal, table.discount.value);
}

function getCourtesyAmount(table: PosTable) {
  const subtotalAfterDiscount = Math.max(0, getSubtotal(table) - getDiscountAmount(table));
  return Math.min(subtotalAfterDiscount, table.courtesy?.amount ?? 0);
}

function getTotal(table: PosTable) {
  return Math.max(0, getSubtotal(table) - getDiscountAmount(table) - getCourtesyAmount(table));
}

function getStatus(table: PosTable): TableStatus {
  if (!table.openedAt) return "free";
  return table.items.length ? "checkout" : "occupied";
}

function formatElapsed(openedAt: number | null) {
  if (!openedAt) return "-";
  const minutes = Math.max(1, Math.round((Date.now() - openedAt) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours} h ${rest} min`;
}

function statusLabel(status: TableStatus) {
  return status === "free" ? "Libre" : status === "occupied" ? "Ocupada" : "Por cobrar";
}

function statusClass(status: TableStatus) {
  if (status === "free") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "occupied") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-stone-900 bg-stone-950 text-white";
}

function ModalShell({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 px-4 py-6 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_30px_100px_rgba(28,25,23,0.28)]"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Punto de Venta
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-950">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:text-stone-950"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function PosClient() {
  const [tables, setTables] = useState(initialTables);
  const [selectedTableId, setSelectedTableId] = useState("mesa-2");
  const [modal, setModal] = useState<ModalType>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [sales, setSales] = useState<Sale[]>([]);

  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? tables[0];
  const openTables = tables.filter((table) => table.openedAt);
  const pendingTotal = openTables.reduce((sum, table) => sum + getTotal(table), 0);
  const dailySales = sales.reduce((sum, sale) => sum + sale.total, 0);

  const tableOptions = useMemo(
    () => tables.map((table) => ({ id: table.id, name: table.name, status: getStatus(table) })),
    [tables],
  );

  function updateTable(tableId: string, updater: (table: PosTable) => PosTable) {
    setTables((current) =>
      current.map((table) => (table.id === tableId ? updater(table) : table)),
    );
  }

  function addProduct(product: Product) {
    updateTable(selectedTable.id, (table) => {
      const existing = table.items.find((item) => item.id === product.id);
      return {
        ...table,
        openedAt: table.openedAt ?? Date.now(),
        people: table.people || 1,
        items: existing
          ? table.items.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
            )
          : [...table.items, { ...product, quantity: 1 }],
      };
    });
  }

  function changeQuantity(productId: string, delta: number) {
    updateTable(selectedTable.id, (table) => ({
      ...table,
      items: table.items
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    }));
  }

  function removeProduct(productId: string) {
    updateTable(selectedTable.id, (table) => ({
      ...table,
      items: table.items.filter((item) => item.id !== productId),
    }));
  }

  function openTable(formData: FormData) {
    const tableId = String(formData.get("table_id") ?? "");
    const people = Number(formData.get("people") ?? 1);
    const customer = String(formData.get("customer") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();

    updateTable(tableId, (table) => ({
      ...table,
      customer,
      people: Number.isFinite(people) && people > 0 ? people : 1,
      note,
      openedAt: table.openedAt ?? Date.now(),
    }));
    setSelectedTableId(tableId);
    setModal(null);
    setSuccessMessage("Mesa abierta correctamente.");
  }

  function applyDiscount(formData: FormData) {
    const type = String(formData.get("type") ?? "percent") as DiscountType;
    const value = Number(formData.get("value") ?? 0);
    const reason = String(formData.get("reason") ?? "").trim();
    if (!reason || !Number.isFinite(value) || value <= 0) return;

    updateTable(selectedTable.id, (table) => ({
      ...table,
      discount: { type, value, reason },
    }));
    setModal(null);
  }

  function registerCourtesy(formData: FormData) {
    const label = String(formData.get("label") ?? "").trim();
    const amount = Number(formData.get("amount") ?? 0);
    const reason = String(formData.get("reason") ?? "").trim();
    const authorizedBy = String(formData.get("authorized_by") ?? "").trim();
    if (!label || !reason || !authorizedBy || !Number.isFinite(amount) || amount <= 0) return;

    updateTable(selectedTable.id, (table) => ({
      ...table,
      courtesy: { label, amount, reason, authorizedBy },
    }));
    setModal(null);
  }

  function chargeTable(formData: FormData) {
    const paymentMethod = String(formData.get("payment_method") ?? "Efectivo") as PaymentMethod;
    const total = getTotal(selectedTable);

    setSales((current) => [
      ...current,
      {
        id: `${selectedTable.id}-${Date.now()}`,
        tableName: selectedTable.name,
        total,
        paymentMethod,
        closedAt: Date.now(),
      },
    ]);
    updateTable(selectedTable.id, (table) => ({
      ...table,
      customer: "",
      people: 0,
      note: "",
      openedAt: null,
      items: [],
      discount: null,
      courtesy: null,
    }));
    setModal(null);
    setSuccessMessage(`Venta finalizada en ${selectedTable.name}. Mesa libre.`);
  }

  function quickSale() {
    updateTable("barra", (table) => ({
      ...table,
      customer: table.customer || "Venta rapida",
      people: table.people || 1,
      note: table.note || "Venta rapida",
      openedAt: table.openedAt ?? Date.now(),
    }));
    setSelectedTableId("barra");
    setSuccessMessage("Venta rapida lista en Barra.");
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Restaurante"
        title="Punto de Venta"
        description="Mesas, productos y cobro en una pantalla simple para operar desde tablet."
        actions={
          <>
            <button
              type="button"
              onClick={() => setModal("open")}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              <Plus size={18} />
              Abrir mesa
            </button>
            <button
              type="button"
              onClick={quickSale}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-800 transition hover:border-stone-300"
            >
              <Sparkles size={18} />
              Venta rapida
            </button>
            <button
              type="button"
              onClick={() => setModal("cashier")}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-800 transition hover:border-stone-300"
            >
              <ReceiptText size={18} />
              Cierre de caja
            </button>
          </>
        }
      />

      {successMessage ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={18} />
          {successMessage}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-stone-900 bg-stone-950 p-5 text-white">
          <p className="text-sm text-stone-400">Pendiente por cobrar</p>
          <p className="mt-3 text-4xl font-semibold">{currency.format(pendingTotal)}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Mesas abiertas</p>
          <p className="mt-3 text-4xl font-semibold text-stone-950">{openTables.length}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Ventas finalizadas</p>
          <p className="mt-3 text-4xl font-semibold text-stone-950">{currency.format(dailySales)}</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {tables.map((table) => {
              const status = getStatus(table);
              const active = selectedTable.id === table.id;
              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => setSelectedTableId(table.id)}
                  className={[
                    "min-h-52 rounded-2xl border bg-white p-5 text-left shadow-[0_12px_40px_rgba(28,25,23,0.04)] transition hover:-translate-y-0.5 hover:border-stone-400",
                    active ? "border-stone-950 ring-2 ring-stone-950/10" : "border-stone-200",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-2xl font-semibold text-stone-950">{table.name}</p>
                      <p className="mt-1 text-sm text-stone-500">
                        {table.customer || "Sin cliente"}
                      </p>
                    </div>
                    <span className={["rounded-full border px-3 py-1 text-xs font-semibold", statusClass(status)].join(" ")}>
                      {statusLabel(status)}
                    </span>
                  </div>

                  <div className="mt-8 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-stone-500">Personas</p>
                      <p className="mt-1 text-xl font-semibold text-stone-950">{table.people || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Total</p>
                      <p className="mt-1 text-xl font-semibold text-stone-950">{currency.format(getTotal(table))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Tiempo</p>
                      <p className="mt-1 text-xl font-semibold text-stone-950">{formatElapsed(table.openedAt)}</p>
                    </div>
                  </div>

                  {table.note ? (
                    <p className="mt-5 rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-600">
                      {table.note}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_12px_40px_rgba(28,25,23,0.04)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-stone-500">Detalle de mesa</p>
              <h2 className="mt-2 text-3xl font-semibold text-stone-950">{selectedTable.name}</h2>
              <p className="mt-1 text-sm text-stone-500">
                {selectedTable.customer || "Cliente no asignado"} / {selectedTable.people || 0} personas
              </p>
            </div>
            <span className={["rounded-full border px-3 py-1 text-xs font-semibold", statusClass(getStatus(selectedTable))].join(" ")}>
              {statusLabel(getStatus(selectedTable))}
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            <p className="text-sm font-semibold text-stone-950">Productos agregados</p>
            {selectedTable.items.length ? (
              selectedTable.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-950">{item.name}</p>
                    <p className="text-xs text-stone-500">{currency.format(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changeQuantity(item.id, -1)}
                      className="inline-flex size-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700"
                      aria-label={`Quitar ${item.name}`}
                    >
                      <Minus size={15} />
                    </button>
                    <span className="w-8 text-center text-lg font-semibold text-stone-950">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => changeQuantity(item.id, 1)}
                      className="inline-flex size-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700"
                      aria-label={`Agregar ${item.name}`}
                    >
                      <Plus size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeProduct(item.id)}
                      className="inline-flex size-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700"
                      aria-label={`Eliminar ${item.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-500">
                Agrega productos para iniciar la cuenta.
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-3">
            <p className="text-sm font-semibold text-stone-950">Agregar producto</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProduct(product)}
                  className="rounded-2xl border border-stone-200 bg-white p-4 text-left transition hover:border-stone-400 hover:bg-stone-50"
                >
                  <p className="text-sm font-semibold text-stone-950">{product.name}</p>
                  <p className="mt-1 text-lg font-semibold text-stone-950">{currency.format(product.price)}</p>
                  <p className="mt-1 text-xs text-stone-500">{product.category}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Subtotal</span>
                <span className="font-semibold text-stone-950">{currency.format(getSubtotal(selectedTable))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Descuento</span>
                <span className="font-semibold text-stone-950">-{currency.format(getDiscountAmount(selectedTable))}</span>
              </div>
              {selectedTable.discount ? (
                <p className="text-xs text-stone-500">{selectedTable.discount.reason}</p>
              ) : null}
              <div className="flex justify-between">
                <span className="text-stone-500">Cortesia</span>
                <span className="font-semibold text-stone-950">-{currency.format(getCourtesyAmount(selectedTable))}</span>
              </div>
              {selectedTable.courtesy ? (
                <p className="text-xs text-stone-500">
                  {selectedTable.courtesy.label} / {selectedTable.courtesy.reason} / {selectedTable.courtesy.authorizedBy}
                </p>
              ) : null}
              <div className="mt-2 flex justify-between border-t border-stone-200 pt-3">
                <span className="text-base font-semibold text-stone-950">Total</span>
                <span className="text-3xl font-semibold text-stone-950">{currency.format(getTotal(selectedTable))}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setModal("discount")}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800"
            >
              Aplicar descuento
            </button>
            <button
              type="button"
              onClick={() => setModal("courtesy")}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800"
            >
              <Gift size={17} />
              Registrar cortesia
            </button>
            <button
              type="button"
              onClick={() => setModal("payment")}
              disabled={!selectedTable.openedAt || selectedTable.items.length === 0}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 text-base font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300 sm:col-span-2"
            >
              <Banknote size={20} />
              Cobrar
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-500">
            Venta finalizada / descontar inventario / sumar puntos / aparecer en cierre del dia.
          </div>
        </aside>
      </div>

      {modal === "open" ? (
        <ModalShell title="Abrir mesa" onClose={() => setModal(null)}>
          <form action={openTable} className="grid gap-4">
            <select name="table_id" defaultValue={selectedTable.id} className="h-12 rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-stone-400">
              {tableOptions.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name} - {statusLabel(table.status)}
                </option>
              ))}
            </select>
            <input name="customer" placeholder="Cliente opcional" className="h-12 rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <input name="people" type="number" min={1} defaultValue={2} placeholder="Personas" className="h-12 rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <textarea name="note" placeholder="Nota opcional" className="min-h-24 rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
            <button className="h-12 rounded-xl bg-stone-950 text-sm font-semibold text-white">
              Abrir mesa
            </button>
          </form>
        </ModalShell>
      ) : null}

      {modal === "discount" ? (
        <ModalShell title="Aplicar descuento" onClose={() => setModal(null)}>
          <form action={applyDiscount} className="grid gap-4">
            <select name="type" className="h-12 rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-stone-400">
              <option value="percent">Porcentaje</option>
              <option value="fixed">Monto fijo</option>
            </select>
            <input name="value" type="number" min={1} step="0.01" placeholder="Ej. 10" className="h-12 rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <input name="reason" required placeholder="Motivo obligatorio. Ej. 10% descuento gerente" className="h-12 rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <button className="h-12 rounded-xl bg-stone-950 text-sm font-semibold text-white">
              Aplicar descuento
            </button>
          </form>
        </ModalShell>
      ) : null}

      {modal === "courtesy" ? (
        <ModalShell title="Registrar cortesia" onClose={() => setModal(null)}>
          <form action={registerCourtesy} className="grid gap-4">
            <input name="label" required placeholder="Producto o monto" className="h-12 rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <input name="amount" required type="number" min={1} step="0.01" placeholder="Monto" className="h-12 rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <input name="reason" required placeholder="Motivo" className="h-12 rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <input name="authorized_by" required placeholder="Autorizado por" className="h-12 rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <button className="h-12 rounded-xl bg-stone-950 text-sm font-semibold text-white">
              Registrar cortesia
            </button>
          </form>
        </ModalShell>
      ) : null}

      {modal === "payment" ? (
        <ModalShell title="Cobrar" onClose={() => setModal(null)}>
          <form action={chargeTable} className="grid gap-5">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <strong>{currency.format(getSubtotal(selectedTable))}</strong>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span>Descuento</span>
                <strong>-{currency.format(getDiscountAmount(selectedTable))}</strong>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span>Cortesia</span>
                <strong>-{currency.format(getCourtesyAmount(selectedTable))}</strong>
              </div>
              <div className="mt-4 flex justify-between border-t border-stone-200 pt-4">
                <span className="text-lg font-semibold">Total final</span>
                <strong className="text-3xl">{currency.format(getTotal(selectedTable))}</strong>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {(["Efectivo", "Tarjeta", "Transferencia", "Mixto"] as PaymentMethod[]).map((method) => (
                <label key={method} className="flex h-12 cursor-pointer items-center gap-3 rounded-xl border border-stone-200 px-4 text-sm font-semibold text-stone-800">
                  <input name="payment_method" type="radio" value={method} defaultChecked={method === "Efectivo"} />
                  {method === "Tarjeta" ? <CreditCard size={16} /> : <Banknote size={16} />}
                  {method}
                </label>
              ))}
            </div>
            <button className="h-12 rounded-xl bg-stone-950 text-sm font-semibold text-white">
              Finalizar venta
            </button>
          </form>
        </ModalShell>
      ) : null}

      {modal === "cashier" ? (
        <ModalShell title="Cierre de caja" onClose={() => setModal(null)}>
          <div className="grid gap-4">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm text-stone-500">Ventas finalizadas</p>
              <p className="mt-2 text-4xl font-semibold text-stone-950">{currency.format(dailySales)}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <p className="text-sm font-semibold text-stone-950">Ultimas ventas</p>
              <div className="mt-3 grid gap-2">
                {sales.length ? sales.slice(-5).reverse().map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm">
                    <span>{sale.tableName} / {sale.paymentMethod}</span>
                    <strong>{currency.format(sale.total)}</strong>
                  </div>
                )) : (
                  <p className="text-sm text-stone-500">Aun no hay ventas finalizadas.</p>
                )}
              </div>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
