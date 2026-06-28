export type TableStatus = "free" | "occupied" | "checkout";
export type PaymentMethod = "Efectivo" | "Tarjeta" | "Transferencia" | "Mixto";
export type OrderItemStatus = "pending" | "sent" | "preparing" | "ready" | "served" | "paid";

export type PosCategory = {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  createdAt?: string;
  description?: string;
  available: boolean;
  visible: boolean;
  sendToKitchen: boolean;
  recipeId?: string | null;
  tone: string;
};

export type PosCatalog = {
  categories: PosCategory[];
  products: Product[];
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
export const posCatalogStorageKey = "royalty-pos-catalog-v1";
export const posStateEvent = "royalty-pos-state-updated";
export const posCatalogEvent = "royalty-pos-catalog-updated";

export const initialCategories: PosCategory[] = [
  { id: "sushi", name: "Sushi", active: true, sortOrder: 0 },
  { id: "entradas", name: "Entradas", active: true, sortOrder: 1 },
  { id: "bebidas", name: "Bebidas", active: true, sortOrder: 2 },
  { id: "postres", name: "Postres", active: true, sortOrder: 3 },
  { id: "promos", name: "Promos", active: true, sortOrder: 4 },
];

export const products: Product[] = [
  { id: "california", name: "Rollo California", price: 180, categoryId: "sushi", description: "Rollo clásico de cangrejo y aguacate", available: true, visible: true, sendToKitchen: true, recipeId: null, tone: "from-rose-100 to-orange-100" },
  { id: "salmon", name: "Rollo Salmón", price: 220, categoryId: "sushi", description: "Rollo de salmón fresco", available: true, visible: true, sendToKitchen: true, recipeId: null, tone: "from-orange-100 to-pink-100" },
  { id: "ramen", name: "Ramen", price: 190, categoryId: "entradas", description: "Caldo caliente con fideos", available: true, visible: true, sendToKitchen: true, recipeId: null, tone: "from-amber-100 to-yellow-100" },
  { id: "edamame", name: "Edamame", price: 120, categoryId: "entradas", available: true, visible: true, sendToKitchen: true, recipeId: null, tone: "from-emerald-100 to-lime-100" },
  { id: "agua", name: "Agua mineral", price: 60, categoryId: "bebidas", available: true, visible: true, sendToKitchen: false, recipeId: null, tone: "from-sky-100 to-cyan-100" },
  { id: "sake", name: "Sake", price: 250, categoryId: "bebidas", available: true, visible: true, sendToKitchen: false, recipeId: null, tone: "from-indigo-100 to-slate-100" },
  { id: "mochi", name: "Postre Mochi", price: 140, categoryId: "postres", available: true, visible: true, sendToKitchen: true, recipeId: null, tone: "from-violet-100 to-fuchsia-100" },
];

export const initialPosCatalog: PosCatalog = {
  categories: initialCategories,
  products,
};

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

export function readPosCatalog(): PosCatalog {
  if (typeof window === "undefined") return initialPosCatalog;

  try {
    const value = window.localStorage.getItem(posCatalogStorageKey);
    if (!value) {
      window.localStorage.setItem(posCatalogStorageKey, JSON.stringify(initialPosCatalog));
      return initialPosCatalog;
    }
    const stored = JSON.parse(value) as PosCatalog;
    const normalized = normalizePosCatalog(stored);
    if (JSON.stringify(stored) !== JSON.stringify(normalized)) {
      window.localStorage.setItem(posCatalogStorageKey, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return initialPosCatalog;
  }
}

export function writePosCatalog(catalog: PosCatalog) {
  if (typeof window === "undefined") return catalog;
  const normalized = normalizePosCatalog(catalog);
  window.localStorage.setItem(posCatalogStorageKey, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(posCatalogEvent));
  return normalized;
}

export function makeCatalogId(prefix: "category" | "product") {
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
}

export function normalizeCatalogName(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es-MX");
}

export function normalizePosCatalog(catalog: PosCatalog): PosCatalog {
  const sourceCategories = Array.isArray(catalog.categories) ? catalog.categories : initialCategories;
  const orderedCategories = sourceCategories
    .map((category, index) => ({
      ...category,
      active: category.active ?? true,
      sortOrder: category.sortOrder ?? index,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const categories: PosCategory[] = [];
  const categoryAliases = new Map<string, string>();
  const categoryById = new Map<string, PosCategory>();
  const categoryByName = new Map<string, PosCategory>();

  for (const category of orderedCategories) {
    const normalizedName = normalizeCatalogName(category.name);
    if (!normalizedName) continue;
    const canonical = categoryById.get(category.id) ?? categoryByName.get(normalizedName);
    if (canonical) {
      categoryAliases.set(category.id, canonical.id);
      continue;
    }
    const next = { ...category, name: category.name.trim(), sortOrder: categories.length };
    categories.push(next);
    categoryById.set(next.id, next);
    categoryByName.set(normalizedName, next);
    categoryAliases.set(next.id, next.id);
  }

  const sourceProducts = Array.isArray(catalog.products) ? catalog.products : products;
  const normalizedProducts: Product[] = [];
  const productIds = new Set<string>();
  const recentProducts = new Map<string, number>();

  for (const product of sourceProducts) {
    if (productIds.has(product.id)) continue;
    const originalCategoryId = product.categoryId ?? "entradas";
    const categoryId = categoryAliases.get(originalCategoryId) ?? originalCategoryId;
    const normalizedProduct: Product = {
      ...product,
      name: product.name.trim(),
      categoryId,
      available: product.available ?? true,
      visible: product.visible ?? true,
      sendToKitchen: product.sendToKitchen ?? true,
      recipeId: product.recipeId ?? null,
      tone: product.tone ?? "from-stone-100 to-stone-200",
    };
    const timestamp = productCreatedAt(normalizedProduct);
    const fingerprint = [
      normalizeCatalogName(normalizedProduct.name),
      normalizedProduct.price,
      normalizedProduct.categoryId,
    ].join("|");
    const previousTimestamp = recentProducts.get(fingerprint);
    if (
      timestamp !== null &&
      previousTimestamp !== undefined &&
      Math.abs(timestamp - previousTimestamp) <= 5000
    ) {
      continue;
    }
    productIds.add(normalizedProduct.id);
    if (timestamp !== null) recentProducts.set(fingerprint, timestamp);
    normalizedProducts.push(normalizedProduct);
  }

  return {
    categories,
    products: normalizedProducts,
  };
}

function productCreatedAt(product: Product) {
  if (product.createdAt) {
    const timestamp = new Date(product.createdAt).getTime();
    if (Number.isFinite(timestamp)) return timestamp;
  }
  const legacyTimestamp = product.id.match(/^product-(\d{10,})-/)?.[1];
  return legacyTimestamp ? Number(legacyTimestamp) : null;
}

function normalizeTables(tables: PosTable[]) {
  return tables
    .filter((table) => table.id !== "barra")
    .map((table) => ({
      ...table,
      courtesy: table.courtesy
        ? {
            ...table.courtesy,
            type: table.courtesy.type ?? "amount",
          }
        : null,
      items: table.items.map((item, index) => ({
        ...item,
        categoryId: item.categoryId ?? products.find((product) => product.id === item.id)?.categoryId ?? "entradas",
        available: item.available ?? true,
        visible: item.visible ?? true,
        sendToKitchen: item.sendToKitchen ?? products.find((product) => product.id === item.id)?.sendToKitchen ?? true,
        recipeId: item.recipeId ?? null,
        tone: item.tone ?? "from-stone-100 to-stone-200",
        lineId: item.lineId ?? `${table.id}-${item.id}-${index}`,
        status: item.status === ("kitchen" as OrderItemStatus) ? "sent" : item.status,
      })),
    }));
}
