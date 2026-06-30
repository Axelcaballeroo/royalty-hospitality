export type TableStatus = "free" | "occupied" | "checkout";
export type PaymentMethod = "Efectivo" | "Tarjeta" | "Transferencia" | "Mixto";
export type CurrencyCode = "MXN" | "USD" | "EUR";
export type OrderItemStatus = "pending" | "sent" | "preparing" | "ready" | "served" | "paid" | "cancelled";
export type ProductStation = "kitchen" | "bar" | "direct";
export type StaffRole = "waiter" | "cashier" | "manager" | "admin";
export type PosPermission =
  | "open_table"
  | "add_product"
  | "send_command"
  | "charge"
  | "reprint_ticket"
  | "reprint_cash_receipt"
  | "view_paid_accounts"
  | "open_cash"
  | "cancel_product"
  | "apply_discount"
  | "apply_courtesy"
  | "reopen_account"
  | "change_waiter"
  | "move_table"
  | "register_withdrawal"
  | "close_cash"
  | "close_courtesy";

export type StaffMember = {
  id: string;
  businessId: string;
  name: string;
  role: StaffRole;
  pin: string;
  active: boolean;
  permissions: PosPermission[];
};

export type OrderAuditEvent = {
  id: string;
  type: string;
  message: string;
  actor: string;
  createdAt: string;
  requestedBy?: string;
  authorizedBy?: string;
  authorizedRole?: StaffRole;
  reason?: string;
};

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
  station: ProductStation;
  sendToKitchen?: boolean;
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
  cancelledAt?: string;
  cancellationReason?: string;
  authorizedBy?: string;
  cancelledBy?: string;
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
  currency?: CurrencyCode;
  foreignAmount?: number;
  exchangeRate?: number;
  equivalentMxn?: number;
};

export type ExchangeRateSettings = {
  USD: number;
  EUR: number;
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
  orderName?: string;
  waiter?: StaffMember | null;
  openedBy?: StaffMember;
  paidBy?: StaffMember;
  closedBy?: StaffMember;
  history?: OrderAuditEvent[];
  reopenedFromSaleId?: string;
};

export type Sale = {
  id: string;
  folio?: string;
  tableId?: string;
  tableName: string;
  orderName?: string;
  isQuickSale?: boolean;
  orderType?: string;
  items: OrderItem[];
  gross: number;
  discount: number;
  courtesy: number;
  total: number;
  paymentMethod: PaymentMethod;
  payments: PaymentPart[];
  amountReceived?: number;
  change?: number;
  cashRegister?: string;
  isCourtesy: boolean;
  waiter?: StaffMember | null;
  openedBy?: StaffMember;
  paidBy?: StaffMember;
  closedBy?: StaffMember;
  history?: OrderAuditEvent[];
  paidAt?: string;
  closedAt: string;
};

export type CashClosingSnapshot = {
  gross: number;
  discounts: number;
  courtesies: number;
  net: number;
  cash: number;
  card: number;
  transfer: number;
  mixed: number;
  totalCollected: number;
  usdReceived: number;
  eurReceived: number;
  foreignEquivalentMxn: number;
  pending: number;
  closedOrders: number;
  openOrders: number;
};

export type CashClosing = {
  id: string;
  status: "draft" | "closed";
  openingCash: number;
  countedCash: number;
  expectedCash: number;
  difference: number;
  snapshot: CashClosingSnapshot;
  orders: CashClosingOrder[];
  savedAt: string;
  closedAt?: string;
  authorizedBy?: StaffMember;
  history?: OrderAuditEvent[];
  withdrawals: CashWithdrawal[];
  openedAt: string;
  responsible?: StaffMember;
  openedBy?: StaffMember;
};

export type CashWithdrawal = {
  id: string;
  amount: number;
  reason: string;
  description?: string;
  receivedBy?: string;
  authorizedBy: StaffMember;
  createdAt: string;
};

export type CashClosingOrder = {
  id: string;
  label: string;
  total: number;
  method: string;
  status: "Cerrada" | "Pendiente";
  waiter?: string;
  time?: string;
  discount: number;
  courtesy: number;
};

export const posStorageKey = "royalty-pos-state-v1";
export const posSalesStorageKey = "royalty-pos-sales-v1";
export const posCatalogStorageKey = "royalty-pos-catalog-v1";
export const posCashClosingStorageKey = "royalty-pos-cash-closing-v1";
export const posExchangeRatesStorageKey = "royalty-pos-exchange-rates-v1";
export const posCashClosingEvent = "royalty-pos-cash-closing-updated";
export const posExchangeRatesEvent = "royalty-pos-exchange-rates-updated";
export const posStateEvent = "royalty-pos-state-updated";
export const posCatalogEvent = "royalty-pos-catalog-updated";

const businessId = "demo-restaurant";
export const initialExchangeRates: ExchangeRateSettings = { USD: 15, EUR: 17 };
const rolePermissions: Record<StaffRole, PosPermission[]> = {
  waiter: ["open_table", "add_product", "send_command"],
  cashier: ["charge", "reprint_ticket", "view_paid_accounts", "open_cash"],
  manager: [
    "open_table", "add_product", "send_command", "charge", "reprint_ticket", "reprint_cash_receipt", "view_paid_accounts", "open_cash",
    "cancel_product", "apply_discount", "apply_courtesy", "reopen_account", "change_waiter",
    "move_table", "register_withdrawal", "close_cash", "close_courtesy",
  ],
  admin: [
    "open_table", "add_product", "send_command", "charge", "reprint_ticket", "reprint_cash_receipt", "view_paid_accounts", "open_cash",
    "cancel_product", "apply_discount", "apply_courtesy", "reopen_account", "change_waiter",
    "move_table", "register_withdrawal", "close_cash", "close_courtesy",
  ],
};

export const demoStaff: StaffMember[] = [
  { id: "staff-juan", businessId, name: "Juan Mesero", role: "waiter", pin: "1111", active: true, permissions: rolePermissions.waiter },
  { id: "staff-ana", businessId, name: "Ana Cajera", role: "cashier", pin: "2222", active: true, permissions: rolePermissions.cashier },
  { id: "staff-roberto", businessId, name: "Roberto Gerente", role: "manager", pin: "3333", active: true, permissions: rolePermissions.manager },
  { id: "staff-admin", businessId, name: "Admin", role: "admin", pin: "9999", active: true, permissions: rolePermissions.admin },
];

export const currentPosUser = demoStaff[1];

export function hasPosPermission(staff: StaffMember, permission: PosPermission) {
  return staff.active && (staff.role === "admin" || staff.permissions.includes(permission));
}

export function authorizePosPin(pin: string, permission: PosPermission) {
  return demoStaff.find((staff) => staff.pin === pin.trim() && hasPosPermission(staff, permission)) ?? null;
}

export function makeAuditEvent(
  type: string,
  message: string,
  actor = currentPosUser.name,
  details: Partial<Pick<OrderAuditEvent, "requestedBy" | "authorizedBy" | "authorizedRole" | "reason">> = {},
): OrderAuditEvent {
  return {
    id: `event-${globalThis.crypto.randomUUID()}`,
    type,
    message,
    actor,
    createdAt: new Date().toISOString(),
    ...details,
  };
}

export const initialCategories: PosCategory[] = [
  { id: "sushi", name: "Sushi", active: true, sortOrder: 0 },
  { id: "entradas", name: "Entradas", active: true, sortOrder: 1 },
  { id: "bebidas", name: "Bebidas", active: true, sortOrder: 2 },
  { id: "postres", name: "Postres", active: true, sortOrder: 3 },
  { id: "promos", name: "Promos", active: true, sortOrder: 4 },
];

export const products: Product[] = [
  { id: "california", name: "Rollo California", price: 180, categoryId: "sushi", description: "Rollo clásico de cangrejo y aguacate", available: true, visible: true, station: "kitchen", recipeId: null, tone: "from-rose-100 to-orange-100" },
  { id: "salmon", name: "Rollo Salmón", price: 220, categoryId: "sushi", description: "Rollo de salmón fresco", available: true, visible: true, station: "kitchen", recipeId: null, tone: "from-orange-100 to-pink-100" },
  { id: "ramen", name: "Ramen", price: 190, categoryId: "entradas", description: "Caldo caliente con fideos", available: true, visible: true, station: "kitchen", recipeId: null, tone: "from-amber-100 to-yellow-100" },
  { id: "edamame", name: "Edamame", price: 120, categoryId: "entradas", available: true, visible: true, station: "kitchen", recipeId: null, tone: "from-emerald-100 to-lime-100" },
  { id: "agua", name: "Agua mineral", price: 60, categoryId: "bebidas", available: true, visible: true, station: "bar", recipeId: null, tone: "from-sky-100 to-cyan-100" },
  { id: "sake", name: "Sake", price: 250, categoryId: "bebidas", available: true, visible: true, station: "bar", recipeId: null, tone: "from-indigo-100 to-slate-100" },
  { id: "mochi", name: "Postre Mochi", price: 140, categoryId: "postres", available: true, visible: true, station: "kitchen", recipeId: null, tone: "from-violet-100 to-fuchsia-100" },
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
    return (JSON.parse(value) as Sale[]).map((sale) => ({
      ...sale,
      folio: sale.folio ?? `POS-${sale.id.replace(/\D/g, "").slice(-6) || "000000"}`,
      history: sale.history ?? [],
    }));
  } catch {
    return [] as Sale[];
  }
}

export function writePosSales(sales: Sale[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(posSalesStorageKey, JSON.stringify(sales));
}

export function readCashClosing() {
  if (typeof window === "undefined") return null as CashClosing | null;
  try {
    const value = window.localStorage.getItem(posCashClosingStorageKey);
    if (!value) return null;
    const stored = JSON.parse(value) as Partial<CashClosing>;
    const savedAt = stored.savedAt ?? new Date().toISOString();
    return {
      ...stored,
      openingCash: stored.openingCash ?? 0,
      withdrawals: stored.withdrawals ?? [],
      openedAt: stored.openedAt ?? savedAt,
      history: stored.history ?? [],
      snapshot: {
        ...stored.snapshot!,
        totalCollected: stored.snapshot?.totalCollected ?? stored.snapshot?.net ?? 0,
        usdReceived: stored.snapshot?.usdReceived ?? 0,
        eurReceived: stored.snapshot?.eurReceived ?? 0,
        foreignEquivalentMxn: stored.snapshot?.foreignEquivalentMxn ?? 0,
      },
    } as CashClosing;
  } catch {
    return null;
  }
}

export function writeCashClosing(closing: CashClosing) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(posCashClosingStorageKey, JSON.stringify(closing));
  window.dispatchEvent(new CustomEvent(posCashClosingEvent));
}

export function readExchangeRates(): ExchangeRateSettings {
  if (typeof window === "undefined") return initialExchangeRates;
  try {
    const value = window.localStorage.getItem(posExchangeRatesStorageKey);
    if (!value) return initialExchangeRates;
    const stored = JSON.parse(value) as Partial<ExchangeRateSettings>;
    return {
      USD: Number(stored.USD) > 0 ? Number(stored.USD) : initialExchangeRates.USD,
      EUR: Number(stored.EUR) > 0 ? Number(stored.EUR) : initialExchangeRates.EUR,
    };
  } catch {
    return initialExchangeRates;
  }
}

export function writeExchangeRates(rates: ExchangeRateSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(posExchangeRatesStorageKey, JSON.stringify(rates));
  window.dispatchEvent(new CustomEvent(posExchangeRatesEvent));
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
      station: productStation(product),
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

function productStation(product: Product): ProductStation {
  if (product.station) return product.station;
  if (product.id === "agua" || product.id === "sake") return "bar";
  if (["clase de salsa", "clases de salsa"].includes(normalizeCatalogName(product.name))) return "direct";
  return product.sendToKitchen === false ? "direct" : "kitchen";
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
        station: productStation(item),
        recipeId: item.recipeId ?? null,
        tone: item.tone ?? "from-stone-100 to-stone-200",
        lineId: item.lineId ?? `${table.id}-${item.id}-${index}`,
        status: item.status === ("kitchen" as OrderItemStatus) ? "sent" : item.status,
      })),
      waiter: table.waiter ?? null,
      history: table.history ?? [],
    }));
}
