export type TableStatus = "free" | "occupied" | "checkout";
export type PaymentMethod = "Efectivo" | "Tarjeta" | "Transferencia" | "Mixto";
export type Category = "Sushi" | "Entradas" | "Bebidas" | "Postres" | "Promos";
export type OrderItemStatus = "pending" | "sent" | "preparing" | "ready" | "served" | "paid";

export type Product = {
  id: string;
  name: string;
  price: number;
  category: Category;
  tone: string;
};

export type OrderItem = Product & {
  lineId: string;
  quantity: number;
  status: OrderItemStatus;
  sentAt?: string;
  updatedAt?: string;
};

export type Discount = {
  type: "percent" | "fixed";
  value: number;
  reason: string;
  authorizedBy?: string;
};

export type Courtesy = {
  type: "product" | "amount" | "full";
  label: string;
  amount: number;
  reason: string;
  authorizedBy: string;
  customer?: string;
  productLineId?: string;
};

export type PaymentPart = {
  method: Exclude<PaymentMethod, "Mixto">;
  amount: number;
};

export type PosTable = {
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

export type Sale = {
  id: string;
  tableName: string;
  items: OrderItem[];
  gross: number;
  discount: number;
  courtesy: number;
  total: number;
  paymentMethod: PaymentMethod;
  payments: PaymentPart[];
  isCourtesy: boolean;
  closedAt: string;
};

export const posStorageKey = "royalty-pos-state-v1";
export const posSalesStorageKey = "royalty-pos-sales-v1";
export const posStateEvent = "royalty-pos-state-updated";

export const categories: Category[] = ["Sushi", "Entradas", "Bebidas", "Postres", "Promos"];

export const products: Product[] = [
  { id: "california", name: "Rollo California", price: 180, category: "Sushi", tone: "from-rose-100 to-orange-100" },
  { id: "salmon", name: "Rollo Salmon", price: 220, category: "Sushi", tone: "from-orange-100 to-pink-100" },
  { id: "ramen", name: "Ramen", price: 190, category: "Entradas", tone: "from-amber-100 to-yellow-100" },
  { id: "edamame", name: "Edamame", price: 120, category: "Entradas", tone: "from-emerald-100 to-lime-100" },
  { id: "agua", name: "Agua mineral", price: 60, category: "Bebidas", tone: "from-sky-100 to-cyan-100" },
  { id: "sake", name: "Sake", price: 250, category: "Bebidas", tone: "from-indigo-100 to-slate-100" },
  { id: "mochi", name: "Postre Mochi", price: 140, category: "Postres", tone: "from-violet-100 to-fuchsia-100" },
];

export const initialTables: PosTable[] = [
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
      { ...products[0], lineId: "mesa-2-california", quantity: 2, status: "served" },
      { ...products[4], lineId: "mesa-2-agua", quantity: 2, status: "served" },
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
      { ...products[1], lineId: "mesa-4-salmon", quantity: 3, status: "served" },
      { ...products[5], lineId: "mesa-4-sake", quantity: 1, status: "pending" },
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
    items: [{ ...products[2], lineId: "barra-ramen", quantity: 1, status: "pending" }],
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

export function makeLineId(tableId: string, productId: string) {
  return `${tableId}-${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function readPosTables() {
  if (typeof window === "undefined") return initialTables;

  try {
    const value = window.localStorage.getItem(posStorageKey);
    if (!value) return initialTables;
    return normalizeTables(JSON.parse(value) as PosTable[]);
  } catch {
    return initialTables;
  }
}

export function writePosTables(tables: PosTable[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(posStorageKey, JSON.stringify(tables));
  window.dispatchEvent(new CustomEvent(posStateEvent));
}

export function readPosSales() {
  if (typeof window === "undefined") return [] as Sale[];

  try {
    const value = window.localStorage.getItem(posSalesStorageKey);
    if (!value) return [] as Sale[];
    return JSON.parse(value) as Sale[];
  } catch {
    return [] as Sale[];
  }
}

export function writePosSales(sales: Sale[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(posSalesStorageKey, JSON.stringify(sales));
}

function normalizeTables(tables: PosTable[]) {
  return tables.map((table) => ({
    ...table,
    courtesy: table.courtesy
      ? {
          ...table.courtesy,
          type: table.courtesy.type ?? "amount",
        }
      : null,
    items: table.items.map((item, index) => ({
      ...item,
      lineId: item.lineId ?? `${table.id}-${item.id}-${index}`,
      status: item.status === ("kitchen" as OrderItemStatus) ? "sent" : item.status,
    })),
  }));
}
