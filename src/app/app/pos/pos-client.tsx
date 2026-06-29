"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  ChefHat,
  Clock,
  Coffee,
  CreditCard,
  Minus,
  Package,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  Save,
  Lock,
  Menu,
  History,
  UserRound,
  MoveRight,
  Ban,
  RotateCcw,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { buildCashOrders, buildCashSnapshot } from "@/lib/pos-cash-closing";
import {
  initialPosCatalog,
  initialTables,
  currentPosUser,
  demoStaff,
  makeAuditEvent,
  makeLineId,
  posCatalogEvent,
  posStateEvent,
  readCashClosing,
  readPosCatalog,
  readPosSales,
  readPosTables,
  writePosSales,
  writeCashClosing,
  writePosTables,
} from "@/lib/pos-shared";
import type {
  CashClosing,
  OrderItemStatus,
  PaymentPart,
  PaymentMethod,
  PosCatalog,
  PosCategory,
  PosTable,
  Product,
  ProductStation,
  Sale,
  StaffMember,
  TableStatus,
} from "@/lib/pos-shared";

type ModalType = "open" | "quick" | "order" | "cashier" | "sales" | null;
type PosStep = "order" | "payment";
type AccountModal = "discount" | "courtesy" | null;
type OrderActionModal = "menu" | "waiter" | "rename" | "move" | "cancel" | "history" | null;
type CompletedPayment = { payments: PaymentPart[]; isCourtesy: boolean };

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

function subtotal(table: PosTable) {
  return table.items.reduce(
    (sum, item) => item.status === "cancelled" ? sum : sum + item.price * item.quantity,
    0,
  );
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

function orderLabel(table: PosTable) {
  return table.orderName || table.name;
}

function staffRoleLabel(role: StaffMember["role"]) {
  return role === "waiter" ? "Mesero" : role === "cashier" ? "Cajero" : role === "manager" ? "Gerente" : "Admin";
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
  const [orderAction, setOrderAction] = useState<OrderActionModal>(null);
  const [cancelLineId, setCancelLineId] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [reopenSale, setReopenSale] = useState<Sale | null>(null);

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

  function openTable(tableId: string, people: number, customer: string, waiter: StaffMember) {
    const event = makeAuditEvent("table_opened", `Mesa abierta por ${currentPosUser.name}`);
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
              orderName: undefined,
              waiter,
              openedBy: currentPosUser,
              paidBy: undefined,
              closedBy: undefined,
              history: [event],
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
    const nextStatus: OrderItemStatus = product.station === "direct" ? "served" : "pending";
    const event = makeAuditEvent("product_added", `${product.name} agregado`);
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
        return { ...table, items, readyToPay: false, history: [...(table.history ?? []), event] };
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
            const status: OrderItemStatus = item.station === "direct" ? "served" : "pending";
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

  function sendCommand() {
    if (!selectedTable.openedAt || selectedTable.items.length === 0) return;
    const pending = selectedTable.items.filter(
      (item) => item.status === "pending" && item.station !== "direct",
    );
    const hasKitchen = pending.some((item) => item.station === "kitchen");
    const hasBar = pending.some((item) => item.station === "bar");
    if (!hasKitchen && !hasBar) return;
    const destination = hasKitchen && hasBar ? "cocina y barra" : hasKitchen ? "cocina" : "barra";
    const event = makeAuditEvent("command_sent", `Comanda enviada a ${destination}`);
    updateTables((current) =>
      current.map((table) =>
        table.id === selectedTable.id
          ? {
              ...table,
              items: table.items.map((item) => ({
                ...item,
                status: item.status === "pending" && item.station !== "direct" ? "sent" : item.status,
                sentAt: item.status === "pending" && item.station !== "direct" ? new Date().toISOString() : item.sentAt,
                updatedAt: new Date().toISOString(),
              })),
              readyToPay: false,
              history: [...(table.history ?? []), event],
            }
          : table,
      ),
    );
    showToast(
      hasKitchen && hasBar
        ? "Comanda enviada a cocina y barra"
        : hasKitchen
          ? "Comanda enviada a cocina"
          : "Comanda enviada a barra",
    );
  }

  function markServed(productId: string) {
    const product = selectedTable.items.find((item) => item.lineId === productId);
    const event = makeAuditEvent("product_served", `${product?.name ?? "Producto"} servido`);
    updateTables((current) =>
      current.map((table) =>
        table.id === selectedTable.id
          ? {
              ...table,
              items: table.items.map((item) =>
                item.lineId === productId ? { ...item, status: "served", updatedAt: new Date().toISOString() } : item,
              ),
              history: [...(table.history ?? []), event],
            }
          : table,
      ),
    );
  }

  function startPayment() {
    if (!selectedTable.openedAt || selectedTable.items.length === 0) return;
    if (selectedTable.items.some((item) => item.station !== "direct" && item.status === "pending")) {
      showToast("Envía la comanda pendiente antes de cobrar");
      return;
    }
    updateTables((current) =>
      current.map((table) => (table.id === selectedTable.id ? { ...table, readyToPay: true } : table)),
    );
    setPosStep("payment");
  }

  function applyDiscount(type: "percent" | "fixed", value: number, reason: string, authorizedBy: string) {
    const event = makeAuditEvent("discount_applied", `Descuento aplicado: ${reason}`);
    updateTables((current) =>
      current.map((table) =>
        table.id === selectedTable.id
          ? { ...table, discount: { type, value, reason, authorizedBy: authorizedBy || undefined }, history: [...(table.history ?? []), event] }
          : table,
      ),
    );
    setAccountModal(null);
    showToast("Descuento aplicado");
  }

  function cancelProduct(lineId: string, reason: string, authorizedBy: string) {
    const product = selectedTable.items.find((item) => item.lineId === lineId);
    if (!product) return;
    const event = makeAuditEvent(
      "product_cancelled",
      `Producto cancelado: ${product.name} · motivo: ${reason}`,
    );
    updateTables((current) => current.map((table) => table.id === selectedTable.id
      ? {
          ...table,
          items: table.items.map((item) => item.lineId === lineId
            ? {
                ...item,
                status: "cancelled",
                cancellationReason: reason,
                authorizedBy: authorizedBy || undefined,
                cancelledBy: currentPosUser.name,
                cancelledAt: new Date().toISOString(),
              }
            : item),
          history: [...(table.history ?? []), event],
        }
      : table));
    setOrderAction(null);
    setCancelLineId(null);
    showToast("Producto cancelado");
  }

  function changeWaiter(waiter: StaffMember) {
    const previous = selectedTable.waiter?.name ?? "Sin mesero";
    const event = makeAuditEvent("waiter_changed", `Mesero cambiado: ${previous} → ${waiter.name}`);
    updateTables((current) => current.map((table) => table.id === selectedTable.id
      ? { ...table, waiter, history: [...(table.history ?? []), event] }
      : table));
    setOrderAction(null);
    showToast("Mesero actualizado");
  }

  function renameOrder(name: string) {
    const event = makeAuditEvent("table_renamed", `${orderLabel(selectedTable)} renombrada como ${name}`);
    updateTables((current) => current.map((table) => table.id === selectedTable.id
      ? { ...table, orderName: name, history: [...(table.history ?? []), event] }
      : table));
    setOrderAction(null);
    showToast("Mesa renombrada");
  }

  function moveOrder(targetId: string) {
    const target = tables.find((table) => table.id === targetId);
    if (!target || target.openedAt) return;
    const source = selectedTable;
    const event = makeAuditEvent("table_moved", `${orderLabel(source)} movida a ${target.name}`);
    updateTables((current) => current.map((table) => {
      if (table.id === targetId) {
        return {
          ...table,
          customer: source.customer,
          people: source.people,
          openedAt: source.openedAt,
          items: source.items,
          discount: source.discount,
          courtesy: source.courtesy,
          readyToPay: source.readyToPay,
          orderName: source.orderName,
          waiter: source.waiter,
          openedBy: source.openedBy,
          paidBy: source.paidBy,
          closedBy: undefined,
          history: [...(source.history ?? []), event],
          reopenedFromSaleId: source.reopenedFromSaleId,
        };
      }
      if (table.id === source.id) {
        return { ...table, customer: "", people: 0, openedAt: null, items: [], discount: null, courtesy: null, readyToPay: false, orderName: undefined, waiter: null, openedBy: undefined, paidBy: undefined, history: [], reopenedFromSaleId: undefined };
      }
      return table;
    }));
    setSelectedTableId(targetId);
    setOrderAction(null);
    showToast(`Orden movida a ${target.name}`);
  }

  function reopenClosedSale(sale: Sale, reason: string, authorizedBy: string, targetId: string) {
    const event = makeAuditEvent("order_reopened", `Cuenta reabierta · motivo: ${reason} · autorizó: ${authorizedBy}`);
    const target = targetId === "separate" ? null : tables.find((table) => table.id === targetId && !table.openedAt);
    const orderId = target?.id ?? `reopened-${globalThis.crypto.randomUUID()}`;
    const reopened: PosTable = {
      ...(target ?? { id: orderId, name: "Cuenta reabierta", customer: "", people: 1, openedAt: null, items: [], discount: null, courtesy: null, readyToPay: false }),
      customer: "",
      people: target ? 1 : 0,
      openedAt: new Date().toISOString(),
      items: sale.items.map((item) => item.status === "cancelled" ? item : { ...item, status: "served" }),
      discount: sale.discount ? { type: "fixed", value: sale.discount, reason: "Descuento de cuenta reabierta" } : null,
      courtesy: sale.courtesy ? { type: "amount", label: "Cortesía de cuenta reabierta", amount: sale.courtesy, reason: "Cortesía original", authorizedBy: sale.closedBy?.name ?? "Gerencia" } : null,
      readyToPay: true,
      quickType: target ? undefined : "Cuenta reabierta",
      orderName: sale.orderName,
      waiter: sale.waiter ?? null,
      openedBy: sale.openedBy ?? currentPosUser,
      paidBy: undefined,
      closedBy: undefined,
      history: [...(sale.history ?? []), event],
      reopenedFromSaleId: sale.id,
    };
    updateTables((current) => target
      ? current.map((table) => table.id === target.id ? reopened : table)
      : [...current, reopened]);
    setSales((current) => {
      const next = current.filter((item) => item.id !== sale.id);
      writePosSales(next);
      return next;
    });
    setSelectedTableId(orderId);
    setReopenSale(null);
    setSelectedSale(null);
    setPosStep("order");
    setModal("order");
    showToast("Cuenta reabierta");
  }

  function applyCourtesy(courtesy: NonNullable<PosTable["courtesy"]>) {
    const event = makeAuditEvent("courtesy_applied", `Cortesía registrada: ${courtesy.reason}`);
    updateTables((current) =>
      current.map((table) => (table.id === selectedTable.id ? { ...table, courtesy, history: [...(table.history ?? []), event] } : table)),
    );
    setAccountModal(null);
    showToast(courtesy.type === "full" ? "Cuenta marcada como cortesía" : "Cortesía aplicada");
  }

  function registerPayment(payments: PaymentPart[]) {
    const method = payments.length > 1 ? "Mixto" : payments[0]?.method ?? "Cortesía";
    const event = makeAuditEvent("payment_registered", `Cobrado con ${method}`);
    updateTables((current) =>
      current.map((table) =>
        table.id === selectedTable.id
          ? {
              ...table,
              items: table.items.map((item) => item.status === "cancelled" ? item : { ...item, status: "paid", updatedAt: new Date().toISOString() }),
              paidBy: currentPosUser,
              history: [...(table.history ?? []), event],
            }
          : table,
      ),
    );
    setCompletedPayment({ payments, isCourtesy: false });
    showToast("Pago registrado");
  }

  function prepareCourtesyClose() {
    const event = makeAuditEvent("payment_registered", "Cuenta cerrada como cortesía");
    updateTables((current) =>
      current.map((table) =>
        table.id === selectedTable.id
          ? {
              ...table,
              items: table.items.map((item) => item.status === "cancelled" ? item : { ...item, status: "paid", updatedAt: new Date().toISOString() }),
              paidBy: currentPosUser,
              history: [...(table.history ?? []), event],
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
    const closeEvent = makeAuditEvent("order_closed", `Orden cerrada por ${currentPosUser.name}`);
    const history = [...(table.history ?? []), closeEvent];
    const sale: Sale = {
      id: `sale-${Date.now()}`,
      folio: `POS-${Date.now().toString().slice(-6)}`,
      tableId: table.id,
      tableName: table.quickType ? "Venta rápida" : table.name,
      orderName: table.orderName,
      isQuickSale: Boolean(table.quickType),
      orderType: table.quickType,
      items: table.items.map((item) => item.status === "cancelled" ? item : { ...item, status: "paid" }),
      gross: subtotal(table),
      discount: discountAmount(table),
      courtesy: courtesyAmount(table),
      total: total(table),
      paymentMethod,
      payments: completedPayment.payments,
      isCourtesy: completedPayment.isCourtesy,
      waiter: table.waiter,
      openedBy: table.openedBy,
      paidBy: table.paidBy ?? currentPosUser,
      closedBy: currentPosUser,
      history,
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
                  orderName: undefined,
                  waiter: null,
                  openedBy: undefined,
                  paidBy: undefined,
                  closedBy: currentPosUser,
                  history: [],
                  reopenedFromSaleId: undefined,
                }
              : item,
          ),
    );
    setCompletedPayment(null);
    setPosStep("order");
    setModal(null);
    showToast("Mesa liberada");
  }

  function openQuickSale(type: string, responsible?: StaffMember) {
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
      waiter: responsible ?? null,
      openedBy: currentPosUser,
      history: [makeAuditEvent("order_opened", `Venta rápida abierta por ${currentPosUser.name}`)],
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
          </>
        }
      />

      <nav className="flex flex-wrap gap-3 rounded-2xl border border-stone-200 bg-white p-3" aria-label="Accesos del punto de venta">
        <SecondaryLink href="/app/kitchen" icon={<ChefHat size={20} />}>Ver cocina</SecondaryLink>
        <SecondaryLink href="/app/bar" icon={<Coffee size={20} />}>Ver barra</SecondaryLink>
        <SecondaryLink href="/app/pos/products" icon={<Package size={20} />}>Configurar productos</SecondaryLink>
        <button type="button" onClick={() => setModal("sales")} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 hover:text-stone-950">
          <ReceiptText size={20} /> Cuentas cobradas
        </button>
      </nav>

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
          onOpen={(people, customer, waiter) => openTable(selectedTable.id, people, customer, waiter)}
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
          onCancelProduct={(lineId) => { setCancelLineId(lineId); setOrderAction("cancel"); }}
          onMarkServed={markServed}
          onSendCommand={sendCommand}
          onStartPayment={startPayment}
          onBackToOrder={() => setPosStep("order")}
          onPay={registerPayment}
          onCourtesyClose={prepareCourtesyClose}
          onActions={() => setOrderAction("menu")}
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
        <CashierModal sales={sales} tables={tables} onClose={() => setModal(null)} />
      ) : null}

      {modal === "sales" ? (
        <PaidAccountsModal
          sales={sales}
          onClose={() => setModal(null)}
          onDetail={setSelectedSale}
          onReopen={setReopenSale}
        />
      ) : null}

      {orderAction === "menu" ? (
        <OrderActionsModal
          table={selectedTable}
          onClose={() => setOrderAction(null)}
          onAction={(action) => {
            setOrderAction(action);
            if (action === "cancel") setCancelLineId(selectedTable.items.find((item) => item.status !== "cancelled")?.lineId ?? null);
          }}
          onDiscount={() => { setOrderAction(null); setAccountModal("discount"); }}
          onCourtesy={() => { setOrderAction(null); setAccountModal("courtesy"); }}
        />
      ) : null}
      {orderAction === "waiter" ? <ChangeWaiterModal current={selectedTable.waiter} onClose={() => setOrderAction(null)} onSave={changeWaiter} /> : null}
      {orderAction === "rename" ? <RenameOrderModal table={selectedTable} onClose={() => setOrderAction(null)} onSave={renameOrder} /> : null}
      {orderAction === "move" ? <MoveOrderModal tables={tables} currentId={selectedTable.id} onClose={() => setOrderAction(null)} onMove={moveOrder} /> : null}
      {orderAction === "cancel" && cancelLineId ? <CancelProductModal table={selectedTable} lineId={cancelLineId} onSelectLine={setCancelLineId} onClose={() => setOrderAction(null)} onCancel={cancelProduct} /> : null}
      {orderAction === "history" ? <OrderHistoryModal title={orderLabel(selectedTable)} history={selectedTable.history ?? []} onClose={() => setOrderAction(null)} /> : null}
      {selectedSale ? <SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} onReopen={() => setReopenSale(selectedSale)} /> : null}
      {reopenSale ? <ReopenAccountModal sale={reopenSale} tables={tables} onClose={() => setReopenSale(null)} onReopen={reopenClosedSale} /> : null}
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

function SecondaryLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 hover:text-stone-950"
    >
      {icon}
      {children}
    </Link>
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
          <p className="text-3xl font-semibold text-stone-950">{orderLabel(table)}</p>
          <p className="mt-2 text-sm font-semibold text-stone-500">{table.openedAt ? `Mesero: ${table.waiter?.name ?? "Sin asignar"}` : "Sin cliente"}</p>
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

function OrderStatusBadge({ status, station }: { status: OrderItemStatus; station: ProductStation }) {
  const stationName = station === "kitchen" ? "Cocina" : station === "bar" ? "Barra" : "Cobro directo";
  const label = status === "cancelled"
    ? "Producto cancelado"
    : station === "direct" && status !== "paid"
    ? "Cobro directo"
    : status === "pending"
      ? `${stationName} · Pendiente`
      : status === "sent"
        ? station === "bar" ? "En barra" : "En cocina"
        : status === "preparing"
          ? `${stationName} · Preparando`
          : status === "ready"
            ? `${stationName} · Listo`
            : status === "served"
              ? "Servido"
              : "Cobrado";
  const classes: Record<OrderItemStatus, string> = {
    pending: "border-amber-200 bg-amber-50 text-amber-800",
    sent: "border-sky-200 bg-sky-50 text-sky-800",
    preparing: "border-indigo-200 bg-indigo-50 text-indigo-800",
    ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
    served: "border-emerald-200 bg-emerald-50 text-emerald-800",
    paid: "border-stone-300 bg-stone-100 text-stone-800",
    cancelled: "border-rose-200 bg-rose-50 text-rose-800",
  };

  return (
    <span className={["mt-2 inline-flex h-8 items-center rounded-full border px-3 text-sm font-semibold", classes[status]].join(" ")}>
      {label}
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
  onCancelProduct,
  onMarkServed,
  onSendCommand,
  onStartPayment,
  onBackToOrder,
  onPay,
  onCourtesyClose,
  onActions,
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
  onCancelProduct: (lineId: string) => void;
  onMarkServed: (productId: string) => void;
  onSendCommand: () => void;
  onStartPayment: () => void;
  onBackToOrder: () => void;
  onPay: (payments: PaymentPart[]) => void;
  onCourtesyClose: () => void;
  onActions: () => void;
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
              <h2 className="text-4xl font-semibold text-stone-950">{orderLabel(table)}</h2>
              <p className="mt-1 text-sm font-semibold text-stone-500">Mesero: {table.waiter?.name ?? "Sin asignar"}</p>
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
            <button type="button" onClick={onActions} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-stone-950 px-4 text-base font-semibold text-white">
              <Menu size={20} /> Acciones
            </button>
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
            onCancelProduct={onCancelProduct}
            onMarkServed={onMarkServed}
            onSendCommand={onSendCommand}
            onStartPayment={onStartPayment}
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
  onCancelProduct,
  onMarkServed,
  onSendCommand,
  onStartPayment,
}: {
  table: PosTable;
  activeCategory: string;
  posCategories: PosCategory[];
  categoryProducts: Product[];
  onCategoryChange: (categoryId: string) => void;
  onAddProduct: (product: Product) => void;
  onChangeQuantity: (productId: string, change: number) => void;
  onCancelProduct: (lineId: string) => void;
  onMarkServed: (productId: string) => void;
  onSendCommand: () => void;
  onStartPayment: () => void;
}) {
  const hasPendingCommandItems = table.items.some(
    (item) => item.station !== "direct" && item.status === "pending",
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
                      <OrderStatusBadge status={item.status} station={item.station} />
                    </div>
                    <p className={["text-xl font-semibold", item.status === "cancelled" ? "text-rose-700 line-through" : "text-stone-950"].join(" ")}>
                      {item.status === "cancelled" ? money.format(0) : money.format(item.price * item.quantity)}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    {item.status !== "cancelled" ? <div className="flex items-center gap-2">
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
                    </div> : <span />}
                    {item.status !== "cancelled" ? (
                      <button type="button" onClick={() => onCancelProduct(item.lineId)} className="inline-flex h-14 items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700">
                        <Ban size={19} /> Cancelar
                      </button>
                    ) : <span className="text-sm font-semibold text-rose-700">Producto cancelado</span>}
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
          </div>
        </div>

        <div className="grid gap-3 border-t border-stone-200 bg-white p-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={onSendCommand}
            disabled={!table.openedAt || !hasPendingCommandItems}
            className="h-20 rounded-3xl bg-emerald-600 text-xl font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            Enviar comanda
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
              <span className={item.status === "cancelled" ? "text-rose-700 line-through" : ""}>{item.status === "cancelled" ? money.format(0) : money.format(item.price * item.quantity)}</span>
            </div>
            <OrderStatusBadge status={item.status} station={item.station} />
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
  const requiresAuthorization = type === "percent" ? value > 20 : value > subtotal(table) * 0.2;
  const valid = value > 0 && reason.trim().length > 0 && (!requiresAuthorization || authorizedBy.trim().length > 0);

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
        <FormField label={requiresAuthorization ? "Autorizado por (obligatorio)" : "Autorizado por (opcional)"}>
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

function OrderActionsModal({ table, onClose, onAction, onDiscount, onCourtesy }: { table: PosTable; onClose: () => void; onAction: (action: Exclude<OrderActionModal, "menu" | null>) => void; onDiscount: () => void; onCourtesy: () => void }) {
  const actions = [
    { label: "Cambiar mesero", icon: <UserRound size={22} />, run: () => onAction("waiter") },
    { label: "Renombrar mesa", icon: <Pencil size={22} />, run: () => onAction("rename") },
    { label: "Mover mesa", icon: <MoveRight size={22} />, run: () => onAction("move") },
    { label: "Cancelar producto", icon: <Ban size={22} />, run: () => onAction("cancel"), sensitive: true, disabled: !table.items.some((item) => item.status !== "cancelled") },
    { label: "Aplicar descuento", icon: <ReceiptText size={22} />, run: onDiscount, sensitive: true },
    { label: "Registrar cortesía", icon: <Sparkles size={22} />, run: onCourtesy, sensitive: true },
    { label: "Reimprimir ticket", icon: <Printer size={22} />, run: () => window.print() },
    { label: "Reabrir cuenta", icon: <RotateCcw size={22} />, run: () => undefined, sensitive: true, disabled: true },
    { label: "Ver historial", icon: <History size={22} />, run: () => onAction("history") },
  ];
  return <ModalShell title="Acciones" onClose={onClose}>
    <div className="grid gap-3 sm:grid-cols-2">
      {actions.map((action) => <button key={action.label} type="button" disabled={action.disabled} onClick={action.run} className="flex min-h-20 items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-left disabled:opacity-40">
        <span className="text-stone-600">{action.icon}</span><span><span className="block text-base font-semibold text-stone-950">{action.label}</span>{action.sensitive ? <span className="mt-1 block text-xs font-semibold text-amber-700">Requiere autorización</span> : null}</span>
      </button>)}
    </div>
  </ModalShell>;
}

function ChangeWaiterModal({ current, onClose, onSave }: { current?: StaffMember | null; onClose: () => void; onSave: (waiter: StaffMember) => void }) {
  const waiters = demoStaff.filter((staff) => staff.role === "waiter");
  const [waiterId, setWaiterId] = useState(current?.id ?? waiters[0]?.id ?? "");
  return <ModalShell title="Cambiar mesero" onClose={onClose}>
    <div className="grid gap-3 sm:grid-cols-3">{waiters.map((waiter) => <button type="button" key={waiter.id} onClick={() => setWaiterId(waiter.id)} className={["h-20 rounded-2xl border text-lg font-semibold", waiterId === waiter.id ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-stone-50 text-stone-950"].join(" ")}>{waiter.name}</button>)}</div>
    <button type="button" onClick={() => { const waiter = waiters.find((item) => item.id === waiterId); if (waiter) onSave(waiter); }} className="mt-5 h-16 w-full rounded-3xl bg-stone-950 text-lg font-semibold text-white">Guardar cambio</button>
  </ModalShell>;
}

function RenameOrderModal({ table, onClose, onSave }: { table: PosTable; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState(orderLabel(table));
  return <ModalShell title="Renombrar mesa" onClose={onClose}><FormField label="Nuevo nombre"><input autoFocus value={name} onChange={(event) => setName(event.target.value)} className="h-16 w-full rounded-2xl border border-stone-200 px-4 text-lg text-stone-950" /></FormField><button type="button" disabled={!name.trim()} onClick={() => onSave(name.trim())} className="mt-5 h-16 w-full rounded-3xl bg-stone-950 text-lg font-semibold text-white disabled:bg-stone-300">Guardar nombre</button></ModalShell>;
}

function MoveOrderModal({ tables, currentId, onClose, onMove }: { tables: PosTable[]; currentId: string; onClose: () => void; onMove: (targetId: string) => void }) {
  const available = tables.filter((table) => table.id !== currentId && !table.openedAt && !table.quickType);
  return <ModalShell title="Mover mesa" onClose={onClose}>{available.length ? <div className="grid gap-3 sm:grid-cols-2">{available.map((table) => <button type="button" key={table.id} onClick={() => onMove(table.id)} className="h-20 rounded-2xl border border-stone-200 bg-stone-50 text-lg font-semibold text-stone-950">{table.name}</button>)}</div> : <p className="rounded-2xl bg-amber-50 p-5 text-base font-semibold text-amber-800">No hay mesas libres.</p>}</ModalShell>;
}

function CancelProductModal({ table, lineId, onSelectLine, onClose, onCancel }: { table: PosTable; lineId: string; onSelectLine: (lineId: string) => void; onClose: () => void; onCancel: (lineId: string, reason: string, authorizedBy: string) => void }) {
  const [reason, setReason] = useState("");
  const [authorizedBy, setAuthorizedBy] = useState("");
  const item = table.items.find((product) => product.lineId === lineId);
  const requiresAuthorization = Boolean(item?.sentAt) || ["sent", "preparing", "ready"].includes(item?.status ?? "");
  const valid = reason.trim() && (!requiresAuthorization || authorizedBy.trim());
  return <ModalShell title="Cancelar producto" onClose={onClose}>
    <FormField label="Producto"><select value={lineId} onChange={(event) => onSelectLine(event.target.value)} className="h-14 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-950">{table.items.filter((product) => product.status !== "cancelled").map((product) => <option key={product.lineId} value={product.lineId}>{product.quantity}x {product.name}</option>)}</select></FormField>
    <div className="mt-4"><FormField label="Motivo obligatorio"><input value={reason} onChange={(event) => setReason(event.target.value)} className="h-14 w-full rounded-2xl border border-stone-200 px-4 text-base text-stone-950" placeholder="Ej. cliente cambió de opinión" /></FormField></div>
    {requiresAuthorization ? <div className="mt-4"><FormField label="Autorizado por"><input value={authorizedBy} onChange={(event) => setAuthorizedBy(event.target.value)} className="h-14 w-full rounded-2xl border border-stone-200 px-4 text-base text-stone-950" placeholder="Gerente" /></FormField></div> : null}
    <button type="button" disabled={!valid} onClick={() => onCancel(lineId, reason.trim(), authorizedBy.trim())} className="mt-5 h-16 w-full rounded-3xl bg-rose-700 text-lg font-semibold text-white disabled:bg-stone-300">Cancelar producto</button>
  </ModalShell>;
}

function OrderHistoryModal({ title, history, onClose }: { title: string; history: NonNullable<PosTable["history"]>; onClose: () => void }) {
  return <ModalShell title={`Historial · ${title}`} onClose={onClose}><div className="max-h-[60vh] space-y-3 overflow-y-auto">{history.length ? [...history].reverse().map((event) => <div key={event.id} className="flex gap-4 rounded-2xl bg-stone-50 p-4"><span className="shrink-0 text-sm font-semibold text-stone-500">{new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date(event.createdAt))}</span><div><p className="text-base font-semibold text-stone-950">{event.message}</p><p className="mt-1 text-xs font-semibold text-stone-500">{event.actor}</p></div></div>) : <p className="p-8 text-center text-stone-500">Sin eventos todavía</p>}</div></ModalShell>;
}

function PaidAccountsModal({ sales, onClose, onDetail, onReopen }: { sales: Sale[]; onClose: () => void; onDetail: (sale: Sale) => void; onReopen: (sale: Sale) => void }) {
  return <ModalShell title="Cuentas cobradas" onClose={onClose} wide><div className="max-h-[70vh] space-y-3 overflow-y-auto">{sales.length ? sales.map((sale) => <article key={sale.id} className="rounded-2xl border border-stone-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-stone-500">{sale.folio}</p><h3 className="mt-1 text-lg font-semibold text-stone-950">{sale.isQuickSale ? `Venta rápida · ${sale.orderType ?? ""}` : sale.orderName || sale.tableName}</h3><p className="mt-1 text-sm font-semibold text-stone-500">Mesero: {sale.waiter?.name ?? "Sin asignar"} · {new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date(sale.closedAt))}</p></div><div className="text-right"><p className="text-2xl font-semibold text-stone-950">{money.format(sale.total)}</p><p className="text-sm font-semibold text-emerald-700">{sale.paymentMethod} · Cerrada</p></div></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => onDetail(sale)} className="h-11 rounded-xl border border-stone-200 px-4 text-sm font-semibold">Ver detalle</button><button type="button" onClick={() => window.print()} className="h-11 rounded-xl border border-stone-200 px-4 text-sm font-semibold">Reimprimir ticket</button><button type="button" onClick={() => onReopen(sale)} className="h-11 rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white">Reabrir cuenta</button></div></article>) : <p className="p-10 text-center text-stone-500">No hay cuentas cobradas.</p>}</div></ModalShell>;
}

function SaleDetailModal({ sale, onClose, onReopen }: { sale: Sale; onClose: () => void; onReopen: () => void }) {
  return <ModalShell title={`Detalle · ${sale.folio}`} onClose={onClose}>
    <div className="space-y-3">{sale.items.map((item) => <div key={item.lineId} className="flex justify-between rounded-2xl bg-stone-50 p-4"><span className={item.status === "cancelled" ? "text-rose-700 line-through" : "text-stone-950"}>{item.quantity}x {item.name}</span><span className="font-semibold">{item.status === "cancelled" ? "Cancelado" : money.format(item.price * item.quantity)}</span></div>)}</div>
    <div className="mt-4 flex justify-between border-t pt-4 text-xl font-semibold"><span>Total</span><span>{money.format(sale.total)}</span></div>
    <div className="mt-5"><p className="text-sm font-semibold text-stone-500">Historial</p><div className="mt-2 max-h-48 space-y-2 overflow-y-auto">{(sale.history ?? []).map((event) => <div key={event.id} className="rounded-xl bg-stone-50 px-3 py-2 text-sm"><span className="font-semibold text-stone-950">{new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date(event.createdAt))} · {event.message}</span></div>)}</div></div>
    <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={() => window.print()} className="h-14 rounded-2xl border border-stone-200 font-semibold">Reimprimir</button><button type="button" onClick={onReopen} className="h-14 rounded-2xl bg-stone-950 font-semibold text-white">Reabrir cuenta</button></div>
  </ModalShell>;
}

function ReopenAccountModal({ sale, tables, onClose, onReopen }: { sale: Sale; tables: PosTable[]; onClose: () => void; onReopen: (sale: Sale, reason: string, authorizedBy: string, targetId: string) => void }) {
  const original = tables.find((table) => table.id === sale.tableId);
  const occupied = Boolean(original?.openedAt);
  const freeTables = tables.filter((table) => !table.openedAt && !table.quickType);
  const [reason, setReason] = useState("");
  const [authorizedBy, setAuthorizedBy] = useState("");
  const [targetId, setTargetId] = useState(!occupied && original ? original.id : "separate");
  const valid = reason.trim() && authorizedBy.trim() && (targetId === "separate" || freeTables.some((table) => table.id === targetId));
  return <ModalShell title="Reabrir cuenta" onClose={onClose}>{occupied ? <p className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Esta mesa ya está ocupada. Puedes reabrir como venta separada o moverla a otra mesa.</p> : null}<FormField label="Destino"><select value={targetId} onChange={(event) => setTargetId(event.target.value)} className="h-14 w-full rounded-2xl border border-stone-200 bg-white px-4"><option value="separate">Venta separada</option>{freeTables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select></FormField><div className="mt-4"><FormField label="Motivo obligatorio"><input value={reason} onChange={(event) => setReason(event.target.value)} className="h-14 w-full rounded-2xl border border-stone-200 px-4" /></FormField></div><div className="mt-4"><FormField label="Autorizado por"><input value={authorizedBy} onChange={(event) => setAuthorizedBy(event.target.value)} className="h-14 w-full rounded-2xl border border-stone-200 px-4" placeholder="Gerente" /></FormField></div><button type="button" disabled={!valid} onClick={() => onReopen(sale, reason.trim(), authorizedBy.trim(), targetId)} className="mt-5 h-16 w-full rounded-3xl bg-stone-950 text-lg font-semibold text-white disabled:bg-stone-300">Reabrir cuenta</button></ModalShell>;
}

function OpenTableModal({
  table,
  onClose,
  onOpen,
}: {
  table: PosTable;
  onClose: () => void;
  onOpen: (people: number, customer: string, waiter: StaffMember) => void;
}) {
  const [people, setPeople] = useState(table.people || 2);
  const [customer, setCustomer] = useState(table.customer);
  const [waiterId, setWaiterId] = useState(demoStaff.find((staff) => staff.role === "waiter")?.id ?? demoStaff[0].id);
  const waiter = demoStaff.find((staff) => staff.id === waiterId) ?? demoStaff[0];

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
          Mesero
          <select value={waiterId} onChange={(event) => setWaiterId(event.target.value)} className="mt-2 h-14 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-950">
            {demoStaff.filter((staff) => staff.role === "waiter").map((staff) => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
          </select>
        </label>
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
          onClick={() => onOpen(people, customer.trim(), waiter)}
          className="h-16 w-full rounded-3xl bg-stone-950 text-lg font-semibold text-white transition hover:bg-stone-800"
        >
          Abrir mesa
        </button>
      </div>
    </ModalShell>
  );
}

function QuickSaleModal({ onClose, onSelect }: { onClose: () => void; onSelect: (type: string, responsible?: StaffMember) => void }) {
  const options = ["Comer aquí", "Para llevar", "A domicilio", "Para recoger"];
  const [selectedType, setSelectedType] = useState("");
  const [responsibleId, setResponsibleId] = useState("");

  return (
    <ModalShell title="Venta rápida" onClose={onClose}>
      {!selectedType ? <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <button type="button" key={option} onClick={() => setSelectedType(option)} className="h-24 rounded-3xl border border-stone-200 bg-stone-50 text-xl font-semibold text-stone-950">
              {option}
            </button>
          ))}
        </div> : <div className="space-y-5">
          <div className="rounded-2xl bg-stone-100 p-4 text-xl font-semibold text-stone-950">{selectedType}</div>
          <label className="block text-base font-semibold text-stone-700">Responsable opcional
            <select value={responsibleId} onChange={(event) => setResponsibleId(event.target.value)} className="mt-2 h-14 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-950">
              <option value="">Sin asignar</option>
              {demoStaff.map((staff) => <option key={staff.id} value={staff.id}>{staff.name} · {staffRoleLabel(staff.role)}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => onSelect(selectedType, demoStaff.find((staff) => staff.id === responsibleId))} className="h-16 w-full rounded-3xl bg-stone-950 text-lg font-semibold text-white">Abrir venta rápida</button>
        </div>}
    </ModalShell>
  );
}

function CashierModal({
  sales,
  tables,
  onClose,
}: {
  sales: Sale[];
  tables: PosTable[];
  onClose: () => void;
}) {
  const [closing, setClosing] = useState<CashClosing | null>(null);
  const [countedCash, setCountedCash] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadClosing = () => {
      const saved = readCashClosing();
      setClosing(saved);
      setCountedCash(saved?.countedCash ?? 0);
    };
    loadClosing();
  }, []);

  const liveSnapshot = buildCashSnapshot(sales, tables);
  const liveOrders = buildCashOrders(sales, tables);
  const locked = closing?.status === "closed";
  const snapshot = locked ? closing.snapshot : liveSnapshot;
  const orders = locked ? closing.orders ?? [] : liveOrders;
  const difference = countedCash - snapshot.cash;
  const differenceCopy = difference === 0 ? "Cuadra" : difference > 0 ? "Sobra" : "Falta";

  function persistClosing(status: CashClosing["status"]) {
    const now = new Date().toISOString();
    const next: CashClosing = {
      id: closing?.id ?? `cash-closing-${globalThis.crypto.randomUUID()}`,
      status,
      countedCash,
      expectedCash: liveSnapshot.cash,
      difference: countedCash - liveSnapshot.cash,
      snapshot: liveSnapshot,
      orders: liveOrders,
      savedAt: now,
      closedAt: status === "closed" ? now : undefined,
    };
    writeCashClosing(next);
    setClosing(next);
    setMessage(status === "closed" ? "Caja cerrada correctamente" : "Corte guardado");
  }

  return (
    <ModalShell title="Cierre de caja" onClose={onClose} wide>
      <div className="space-y-7">
        {message || locked ? (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-base font-semibold text-emerald-800">
            {locked ? <Lock size={21} /> : <CheckCircle2 size={21} />}
            {message || "Caja cerrada correctamente"}
          </div>
        ) : null}

        <section>
          <p className="text-sm font-semibold text-stone-500">Resumen operativo</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CashMetric label="Ventas brutas" value={money.format(snapshot.gross)} />
            <CashMetric label="Descuentos" value={money.format(snapshot.discounts)} />
            <CashMetric label="Cortesías" value={money.format(snapshot.courtesies)} />
            <CashMetric label="Ventas netas" value={money.format(snapshot.net)} strong />
            <CashMetric label="Pendiente por cobrar" value={money.format(snapshot.pending)} />
            <CashMetric label="Órdenes cerradas" value={String(snapshot.closedOrders)} />
            <CashMetric label="Órdenes abiertas" value={String(snapshot.openOrders)} />
          </div>
        </section>

        <section>
          <p className="text-sm font-semibold text-stone-500">Métodos de pago</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PaymentMethodCard icon={<Banknote size={25} />} label="Efectivo" value={snapshot.cash} />
            <PaymentMethodCard icon={<CreditCard size={25} />} label="Tarjeta" value={snapshot.card} />
            <PaymentMethodCard icon={<ReceiptText size={25} />} label="Transferencia" value={snapshot.transfer} />
            <PaymentMethodCard icon={<Sparkles size={25} />} label="Mixto" value={snapshot.mixed} detail="Órdenes con pago mixto" />
          </div>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-stone-500">Conteo de efectivo</p>
              <h3 className="mt-1 text-2xl font-semibold text-stone-950">Arqueo de caja</h3>
            </div>
            <span className={[
              "inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold",
              difference === 0 ? "bg-emerald-100 text-emerald-800" : difference > 0 ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800",
            ].join(" ")}>
              {differenceCopy} {difference === 0 ? "" : money.format(Math.abs(difference))}
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <CashMetric label="Efectivo esperado" value={money.format(snapshot.cash)} />
            <label className="rounded-2xl border border-stone-200 bg-white p-4">
              <span className="text-sm font-semibold text-stone-500">Efectivo contado</span>
              <input
                type="number"
                min={0}
                disabled={locked}
                value={countedCash}
                onChange={(event) => { setCountedCash(Number(event.target.value)); setMessage(""); }}
                className="mt-2 h-12 w-full rounded-xl border border-stone-200 px-3 text-2xl font-semibold text-stone-950 disabled:bg-stone-100"
              />
            </label>
            <CashMetric label="Diferencia" value={money.format(difference)} />
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-stone-500">Actividad</p>
              <h3 className="mt-1 text-2xl font-semibold text-stone-950">Resumen de órdenes</h3>
            </div>
            <span className="text-sm font-semibold text-stone-500">{orders.length} órdenes</span>
          </div>
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {orders.length ? orders.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3">
                <span className="min-w-40 text-base font-semibold text-stone-950">{order.label}</span>
                <span className="text-base font-semibold text-stone-950">{money.format(order.total)}</span>
                <span className="text-sm font-semibold text-stone-600">{order.method}</span>
                <span className={["rounded-full px-3 py-1 text-xs font-semibold", order.status === "Cerrada" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"].join(" ")}>{order.status}</span>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-base font-semibold text-stone-500">Sin órdenes en este corte</div>
            )}
          </div>
        </section>

        <div className="sticky bottom-0 grid gap-3 border-t border-stone-200 bg-white pt-4 sm:grid-cols-3">
          <button type="button" onClick={() => window.print()} className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white text-base font-semibold text-stone-900">
            <Printer size={21} />
            Imprimir corte
          </button>
          <button type="button" disabled={locked} onClick={() => persistClosing("draft")} className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl bg-stone-100 text-base font-semibold text-stone-900 disabled:opacity-50">
            <Save size={21} />
            Guardar corte
          </button>
          <button type="button" disabled={locked} onClick={() => persistClosing("closed")} className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl bg-stone-950 text-base font-semibold text-white disabled:opacity-50">
            <Lock size={21} />
            {locked ? "Caja cerrada" : "Cerrar caja · Gerente"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function CashMetric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={["rounded-2xl border p-4", strong ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-white"].join(" ")}>
      <p className={["text-sm font-semibold", strong ? "text-stone-300" : "text-stone-500"].join(" ")}>{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function PaymentMethodCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: number; detail?: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex items-center gap-3 text-stone-600">{icon}<span className="text-base font-semibold">{label}</span></div>
      <p className="mt-4 text-3xl font-semibold text-stone-950">{money.format(value)}</p>
      {detail ? <p className="mt-1 text-xs font-semibold text-stone-500">{detail}</p> : null}
    </div>
  );
}
