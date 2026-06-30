"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
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
import { TicketReceipt } from "@/components/pos/ticket-receipt";
import { CashClosingReceipt, CashWithdrawalReceipt } from "@/components/pos/cash-receipts";
import type { CashClosingReceiptData } from "@/components/pos/cash-receipts";
import { buildCashOrders, buildCashSnapshot, expectedDrawerCash, withdrawalsTotal } from "@/lib/pos-cash-closing";
import { convertToMxn, exchangeRateFor } from "@/lib/pos-currency";
import { receiptFromSale, receiptFromTable } from "@/lib/pos-receipt";
import type { CurrentReceiptPayment, ReceiptBusinessProfile, ReceiptData, ReceiptPaperWidth } from "@/lib/pos-receipt";
import {
  initialPosCatalog,
  initialTables,
  initialExchangeRates,
  authorizePosPin,
  currentPosUser,
  demoStaff,
  makeAuditEvent,
  makeLineId,
  posCatalogEvent,
  posCashClosingEvent,
  posExchangeRatesEvent,
  posStateEvent,
  readCashClosing,
  readExchangeRates,
  readPosCatalog,
  readPosSales,
  readPosTables,
  writePosSales,
  writeCashClosing,
  writeExchangeRates,
  writePosTables,
} from "@/lib/pos-shared";
import type {
  CashClosing,
  CashWithdrawal,
  CurrencyCode,
  ExchangeRateSettings,
  OrderAuditEvent,
  OrderItemStatus,
  PaymentPart,
  PaymentMethod,
  PosCatalog,
  PosCategory,
  PosTable,
  PosPermission,
  Product,
  ProductStation,
  Sale,
  StaffMember,
  TableStatus,
} from "@/lib/pos-shared";

type ModalType = "open" | "quick" | "order" | "cashier" | "openCash" | "currency" | "sales" | null;
type PosStep = "order" | "payment";
type AccountModal = "discount" | "courtesy" | null;
type OrderActionModal = "menu" | "waiter" | "rename" | "move" | "cancel" | "history" | null;
type CompletedPayment = CurrentReceiptPayment;
type PaymentResult = Pick<CurrentReceiptPayment, "payments" | "amountReceived" | "change">;
type ReceiptPreview = { data: ReceiptData; mode: "initial" | "reprint" };
type AuthorizationRequest = {
  permission: PosPermission;
  description: string;
  onAuthorized: (staff: StaffMember) => void;
};

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

function makeCashSaleEvent(sale: Sale): OrderAuditEvent {
  const label = sale.isQuickSale ? "Venta rápida" : sale.orderName || sale.tableName;
  return {
    id: `cash-sale-${sale.id}`,
    type: "cash_sale",
    message: `${label} · ${sale.paymentMethod} · ${money.format(sale.total)}`,
    actor: sale.paidBy?.name ?? sale.waiter?.name ?? "POS",
    createdAt: sale.closedAt,
  };
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

export function PosClient({ business }: { business: ReceiptBusinessProfile }) {
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
  const [authorizationRequest, setAuthorizationRequest] = useState<AuthorizationRequest | null>(null);
  const [cashClosing, setCashClosing] = useState<CashClosing | null>(null);
  const [resumePaymentAfterCashOpen, setResumePaymentAfterCashOpen] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<ReceiptPreview | null>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateSettings>(initialExchangeRates);

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
      setCashClosing(readCashClosing());
      setExchangeRates(readExchangeRates());
    };

    syncTables();
    const interval = window.setInterval(syncTables, 1000);
    window.addEventListener("storage", syncTables);
    window.addEventListener(posStateEvent, syncTables);
    window.addEventListener(posCatalogEvent, syncTables);
    window.addEventListener(posCashClosingEvent, syncTables);
    window.addEventListener(posExchangeRatesEvent, syncTables);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", syncTables);
      window.removeEventListener(posStateEvent, syncTables);
      window.removeEventListener(posCatalogEvent, syncTables);
      window.removeEventListener(posCashClosingEvent, syncTables);
      window.removeEventListener(posExchangeRatesEvent, syncTables);
    };
  }, []);

  const cashIsOpen = cashClosing?.status === "draft";

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

  function requireAuthorization(
    permission: PosPermission,
    description: string,
    onAuthorized: (staff: StaffMember) => void,
  ) {
    setAuthorizationRequest({ permission, description, onAuthorized });
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
    const commandId = `command-${globalThis.crypto.randomUUID()}`;
    const commandNumber = Math.max(0, ...selectedTable.items.map((item) => item.commandNumber ?? 0)) + 1;
    const sentAt = new Date().toISOString();
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
                sentAt: item.status === "pending" && item.station !== "direct" ? sentAt : item.sentAt,
                commandId: item.status === "pending" && item.station !== "direct" ? commandId : item.commandId,
                commandNumber: item.status === "pending" && item.station !== "direct" ? commandNumber : item.commandNumber,
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
    if (!cashIsOpen) {
      showToast("Primero abre caja para iniciar el turno.");
      setResumePaymentAfterCashOpen(true);
      setModal("openCash");
      return;
    }
    updateTables((current) =>
      current.map((table) => (table.id === selectedTable.id ? { ...table, readyToPay: true } : table)),
    );
    setPosStep("payment");
  }

  function applyDiscount(type: "percent" | "fixed", value: number, reason: string, authorizer: StaffMember) {
    const event = makeAuditEvent("discount_applied", `Descuento aplicado: ${reason} · autorizó: ${authorizer.name}`, currentPosUser.name, {
      requestedBy: currentPosUser.name, authorizedBy: authorizer.name, authorizedRole: authorizer.role, reason,
    });
    updateTables((current) =>
      current.map((table) =>
        table.id === selectedTable.id
          ? { ...table, discount: { type, value, reason, authorizedBy: authorizer.name }, history: [...(table.history ?? []), event] }
          : table,
      ),
    );
    setAccountModal(null);
    showToast("Descuento aplicado");
  }

  function cancelProduct(lineId: string, reason: string, authorizer: StaffMember) {
    const product = selectedTable.items.find((item) => item.lineId === lineId);
    if (!product) return;
    const event = makeAuditEvent(
      "product_cancelled",
      `Producto cancelado: ${product.name} · motivo: ${reason} · autorizó: ${authorizer.name}`,
      currentPosUser.name,
      { requestedBy: currentPosUser.name, authorizedBy: authorizer.name, authorizedRole: authorizer.role, reason },
    );
    updateTables((current) => current.map((table) => table.id === selectedTable.id
      ? {
          ...table,
          items: table.items.map((item) => item.lineId === lineId
            ? {
                ...item,
                status: "cancelled",
                cancellationReason: reason,
                authorizedBy: authorizer.name,
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

  function changeWaiter(waiter: StaffMember, authorizer: StaffMember) {
    const previous = selectedTable.waiter?.name ?? "Sin mesero";
    const event = makeAuditEvent("waiter_changed", `Mesero cambiado: ${previous} → ${waiter.name} · autorizó: ${authorizer.name}`, currentPosUser.name, {
      requestedBy: currentPosUser.name, authorizedBy: authorizer.name, authorizedRole: authorizer.role,
    });
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

  function moveOrder(targetId: string, authorizer: StaffMember) {
    const target = tables.find((table) => table.id === targetId);
    if (!target || target.openedAt) return;
    const source = selectedTable;
    const event = makeAuditEvent("table_moved", `${orderLabel(source)} movida a ${target.name} · autorizó: ${authorizer.name}`, currentPosUser.name, {
      requestedBy: currentPosUser.name, authorizedBy: authorizer.name, authorizedRole: authorizer.role,
    });
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

  function reopenClosedSale(sale: Sale, reason: string, authorizer: StaffMember, targetId: string) {
    const event = makeAuditEvent("order_reopened", `Cuenta reabierta · motivo: ${reason} · autorizó: ${authorizer.name}`, currentPosUser.name, {
      requestedBy: currentPosUser.name, authorizedBy: authorizer.name, authorizedRole: authorizer.role, reason,
    });
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

  function applyCourtesy(courtesy: NonNullable<PosTable["courtesy"]>, authorizer: StaffMember) {
    courtesy = { ...courtesy, authorizedBy: authorizer.name };
    const event = makeAuditEvent("courtesy_applied", `Cortesía registrada: ${courtesy.reason} · autorizó: ${authorizer.name}`, currentPosUser.name, {
      requestedBy: currentPosUser.name, authorizedBy: authorizer.name, authorizedRole: authorizer.role, reason: courtesy.reason,
    });
    updateTables((current) =>
      current.map((table) => (table.id === selectedTable.id ? { ...table, courtesy, history: [...(table.history ?? []), event] } : table)),
    );
    setAccountModal(null);
    showToast(courtesy.type === "full" ? "Cuenta marcada como cortesía" : "Cortesía aplicada");
  }

  function registerPayment(result: PaymentResult) {
    const { payments } = result;
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
    setCompletedPayment({
      ...result,
      folio: `POS-${Date.now().toString().slice(-6)}`,
      paidAt: new Date().toISOString(),
      isCourtesy: false,
    });
    showToast("Pago registrado");
  }

  function prepareCourtesyClose(authorizer: StaffMember) {
    const event = makeAuditEvent("payment_registered", `Cuenta cerrada como cortesía · autorizó: ${authorizer.name}`, currentPosUser.name, {
      requestedBy: currentPosUser.name, authorizedBy: authorizer.name, authorizedRole: authorizer.role,
    });
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
    setCompletedPayment({
      payments: [],
      folio: `POS-${Date.now().toString().slice(-6)}`,
      paidAt: new Date().toISOString(),
      isCourtesy: true,
    });
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
      folio: completedPayment.folio,
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
      amountReceived: completedPayment.amountReceived,
      change: completedPayment.change,
      cashRegister: cashClosing?.responsible?.name ?? currentPosUser.name,
      isCourtesy: completedPayment.isCourtesy,
      waiter: table.waiter,
      openedBy: table.openedBy,
      paidBy: table.paidBy ?? currentPosUser,
      closedBy: currentPosUser,
      history,
      paidAt: completedPayment.paidAt,
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

  function reprintActiveTicket(authorizer: StaffMember) {
    const event = makeAuditEvent("ticket_reprinted", `Ticket reimpreso por ${currentPosUser.name} · autorizado por ${authorizer.name}`, currentPosUser.name, {
      requestedBy: currentPosUser.name, authorizedBy: authorizer.name, authorizedRole: authorizer.role,
    });
    updateTables((current) => current.map((table) => table.id === selectedTable.id
      ? { ...table, history: [...(table.history ?? []), event] }
      : table));
    const payment = completedPayment ?? {
      folio: `ORD-${selectedTable.id}`,
      paidAt: new Date().toISOString(),
      payments: [],
      isCourtesy: false,
    };
    setReceiptPreview({ data: receiptFromTable(selectedTable, payment, business, cashClosing), mode: "reprint" });
  }

  function reprintSaleTicket(sale: Sale, authorizer: StaffMember) {
    const event = makeAuditEvent("ticket_reprinted", `Ticket reimpreso por ${currentPosUser.name} · autorizado por ${authorizer.name}`, currentPosUser.name, {
      requestedBy: currentPosUser.name, authorizedBy: authorizer.name, authorizedRole: authorizer.role,
    });
    setSales((current) => {
      const next = current.map((item) => item.id === sale.id ? { ...item, history: [...(item.history ?? []), event] } : item);
      writePosSales(next);
      return next;
    });
    setSelectedSale((current) => current?.id === sale.id ? { ...current, history: [...(current.history ?? []), event] } : current);
    setReceiptPreview({ data: receiptFromSale(sale, business), mode: "reprint" });
  }

  function previewInitialReceipt() {
    if (!completedPayment) return;
    setReceiptPreview({
      data: receiptFromTable(selectedTable, completedPayment, business, cashClosing),
      mode: "initial",
    });
  }

  function openCashShift(openingCash: number, responsible: StaffMember, authorizer: StaffMember) {
    const now = new Date().toISOString();
    const snapshot = buildCashSnapshot([], tables);
    const event = makeAuditEvent("cash_opened", `Caja abierta con ${money.format(openingCash)} · responsable: ${responsible.name} · autorizó: ${authorizer.name}`, responsible.name, {
      requestedBy: responsible.name,
      authorizedBy: authorizer.name,
      authorizedRole: authorizer.role,
    });
    const next: CashClosing = {
      id: `cash-closing-${globalThis.crypto.randomUUID()}`,
      status: "draft",
      openingCash,
      countedCash: openingCash,
      expectedCash: openingCash,
      difference: 0,
      snapshot,
      orders: buildCashOrders([], tables),
      savedAt: now,
      withdrawals: [],
      openedAt: now,
      responsible,
      openedBy: authorizer,
      history: [event],
    };
    writeCashClosing(next);
    setCashClosing(next);
    if (resumePaymentAfterCashOpen) {
      updateTables((current) => current.map((table) => table.id === selectedTable.id ? { ...table, readyToPay: true } : table));
      setPosStep("payment");
      setModal("order");
    } else {
      setModal(null);
    }
    setResumePaymentAfterCashOpen(false);
    showToast("Caja abierta");
  }

  function showCashClosing() {
    if (!cashIsOpen) {
      showToast("Primero abre caja para iniciar el turno.");
      return;
    }
    setModal("cashier");
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
            {!cashIsOpen ? <ActionButton onClick={() => { setResumePaymentAfterCashOpen(false); setModal("openCash"); }} icon={<Banknote size={22} />}>
              Abrir caja
            </ActionButton> : null}
            <ActionButton onClick={showCashClosing} icon={<ReceiptText size={22} />} light>
              Cierre de caja
            </ActionButton>
          </>
        }
      />

      <section className={[
        "flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-5 py-4",
        cashIsOpen ? "border-emerald-200 bg-emerald-50" : "border-amber-300 bg-amber-50",
      ].join(" ")}>
        <div>
          <p className={["text-lg font-semibold", cashIsOpen ? "text-emerald-950" : "text-amber-950"].join(" ")}>{cashIsOpen ? "Caja abierta" : "Caja cerrada"}</p>
          <p className={["mt-1 text-sm font-semibold", cashIsOpen ? "text-emerald-700" : "text-amber-800"].join(" ")}>
            {cashIsOpen ? `${cashClosing?.responsible?.name ?? "Responsable sin asignar"} · Inicial ${money.format(cashClosing?.openingCash ?? 0)}` : "Abre caja para iniciar ventas y cobros del turno."}
          </p>
        </div>
        {!cashIsOpen ? <div className="flex flex-wrap gap-2">{cashClosing ? <button type="button" onClick={() => setModal("cashier")} className="inline-flex h-14 items-center gap-2 rounded-2xl border border-stone-300 bg-white px-5 text-base font-semibold text-stone-900"><History size={20} /> Último corte</button> : null}<button type="button" onClick={() => { setResumePaymentAfterCashOpen(false); setModal("openCash"); }} className="inline-flex h-14 items-center gap-2 rounded-2xl bg-stone-950 px-5 text-base font-semibold text-white"><Banknote size={21} /> Abrir turno</button></div> : null}
      </section>

      <nav className="flex flex-wrap gap-3 rounded-2xl border border-stone-200 bg-white p-3" aria-label="Accesos del punto de venta">
        <SecondaryLink href="/app/kds/cocina" icon={<ChefHat size={20} />}>Ver cocina</SecondaryLink>
        <SecondaryLink href="/app/kds/barra" icon={<Coffee size={20} />}>Ver barra</SecondaryLink>
        <SecondaryLink href="/app/pos/products" icon={<Package size={20} />}>Configurar productos</SecondaryLink>
        <button type="button" onClick={() => setModal("currency")} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 hover:text-stone-950">
          <Banknote size={20} /> Tipo de cambio
        </button>
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
          exchangeRates={exchangeRates}
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
          onCourtesyClose={() => requireAuthorization("close_courtesy", "Cerrar esta cuenta como cortesía", prepareCourtesyClose)}
          onActions={() => setOrderAction("menu")}
        />
      ) : null}

      {accountModal === "discount" ? (
        <DiscountModal table={selectedTable} onClose={() => setAccountModal(null)} onApply={(type, value, reason) => {
          requireAuthorization("apply_discount", "Aplicar descuento", (staff) => applyDiscount(type, value, reason, staff));
        }} />
      ) : null}

      {accountModal === "courtesy" ? (
        <CourtesyModal table={selectedTable} onClose={() => setAccountModal(null)} onApply={(courtesy) => {
          requireAuthorization("apply_courtesy", "Registrar cortesía", (staff) => applyCourtesy(courtesy, staff));
        }} />
      ) : null}

      {completedPayment ? (
        <PaymentCompleteModal
          isCourtesy={completedPayment.isCourtesy}
          isQuickSale={Boolean(selectedTable.quickType)}
          onCloseOrder={closeOrder}
          onPrint={previewInitialReceipt}
        />
      ) : null}

      {modal === "cashier" ? (
        <CashierModal business={business} sales={sales} tables={tables} onClose={() => setModal(null)} onAuthorize={requireAuthorization} />
      ) : null}

      {modal === "openCash" ? <OpenCashModal onClose={() => { setResumePaymentAfterCashOpen(false); setModal(null); }} onOpen={openCashShift} /> : null}

      {modal === "currency" ? <ExchangeRatesModal rates={exchangeRates} onClose={() => setModal(null)} onSave={(rates) => { writeExchangeRates(rates); setExchangeRates(rates); setModal(null); showToast("Tipo de cambio actualizado"); }} /> : null}

      {modal === "sales" ? (
        <PaidAccountsModal
          sales={sales}
          onClose={() => setModal(null)}
          onDetail={setSelectedSale}
          onReopen={setReopenSale}
          onPrint={(sale) => requireAuthorization("reprint_ticket", "Reimprimir ticket", (staff) => reprintSaleTicket(sale, staff))}
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
          onPrint={() => requireAuthorization("reprint_ticket", "Reimprimir ticket", reprintActiveTicket)}
        />
      ) : null}
      {orderAction === "waiter" ? <ChangeWaiterModal current={selectedTable.waiter} onClose={() => setOrderAction(null)} onSave={(waiter) => requireAuthorization("change_waiter", "Cambiar mesero", (staff) => changeWaiter(waiter, staff))} /> : null}
      {orderAction === "rename" ? <RenameOrderModal table={selectedTable} onClose={() => setOrderAction(null)} onSave={renameOrder} /> : null}
      {orderAction === "move" ? <MoveOrderModal tables={tables} currentId={selectedTable.id} onClose={() => setOrderAction(null)} onMove={(targetId) => requireAuthorization("move_table", "Mover mesa", (staff) => moveOrder(targetId, staff))} /> : null}
      {orderAction === "cancel" && cancelLineId ? <CancelProductModal table={selectedTable} lineId={cancelLineId} onSelectLine={setCancelLineId} onClose={() => setOrderAction(null)} onCancel={(lineId, reason) => requireAuthorization("cancel_product", "Cancelar producto", (staff) => cancelProduct(lineId, reason, staff))} /> : null}
      {orderAction === "history" ? <OrderHistoryModal title={orderLabel(selectedTable)} history={selectedTable.history ?? []} onClose={() => setOrderAction(null)} /> : null}
      {selectedSale ? <SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} onReopen={() => setReopenSale(selectedSale)} onPrint={() => requireAuthorization("reprint_ticket", "Reimprimir ticket", (staff) => reprintSaleTicket(selectedSale, staff))} /> : null}
      {reopenSale ? <ReopenAccountModal sale={reopenSale} tables={tables} onClose={() => setReopenSale(null)} onReopen={(sale, reason, targetId) => requireAuthorization("reopen_account", "Reabrir cuenta", (staff) => reopenClosedSale(sale, reason, staff, targetId))} /> : null}
      {authorizationRequest ? <AuthorizationModal request={authorizationRequest} onClose={() => setAuthorizationRequest(null)} onAuthorized={(staff) => {
        const action = authorizationRequest.onAuthorized;
        setAuthorizationRequest(null);
        action(staff);
      }} /> : null}
      {receiptPreview ? <ReceiptPreviewModal preview={receiptPreview} onClose={() => setReceiptPreview(null)} /> : null}
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
              ? "Entregado"
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
  exchangeRates,
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
  exchangeRates: ExchangeRateSettings;
  onCategoryChange: (categoryId: string) => void;
  onBack: () => void;
  onAddProduct: (product: Product) => void;
  onChangeQuantity: (productId: string, change: number) => void;
  onCancelProduct: (lineId: string) => void;
  onMarkServed: (productId: string) => void;
  onSendCommand: () => void;
  onStartPayment: () => void;
  onBackToOrder: () => void;
  onPay: (result: PaymentResult) => void;
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
          <PaymentStep table={table} exchangeRates={exchangeRates} onBack={onBackToOrder} onPay={onPay} onCourtesyClose={onCourtesyClose} />
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
                          Entregado
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
  exchangeRates,
  onBack,
  onPay,
  onCourtesyClose,
}: {
  table: PosTable;
  exchangeRates: ExchangeRateSettings;
  onBack: () => void;
  onPay: (result: PaymentResult) => void;
  onCourtesyClose: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("Efectivo");
  const [amountReceived, setAmountReceived] = useState(total(table));
  const [currency, setCurrency] = useState<CurrencyCode>("MXN");
  const [partialMethod, setPartialMethod] = useState<PaymentPart["method"]>("Efectivo");
  const [partialCurrency, setPartialCurrency] = useState<CurrencyCode>("MXN");
  const [partialAmount, setPartialAmount] = useState(total(table));
  const [payments, setPayments] = useState<PaymentPart[]>([]);
  const methods: PaymentMethod[] = ["Efectivo", "Tarjeta", "Transferencia", "Mixto"];
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = Math.max(0, total(table) - paid);
  const rate = exchangeRateFor(currency, exchangeRates);
  const receivedEquivalent = convertToMxn(amountReceived, currency, exchangeRates);
  const partialRate = exchangeRateFor(partialCurrency, exchangeRates);
  const change = Math.max(0, receivedEquivalent - total(table));
  const visiblePaid = method === "Mixto"
    ? paid
    : method === "Efectivo"
      ? Math.min(Math.max(0, receivedEquivalent), total(table))
      : total(table);
  const visibleRemaining = Math.max(0, total(table) - visiblePaid);
  const canFinish = total(table) === 0 || (visibleRemaining === 0 && (method !== "Mixto" || payments.length > 0));

  function chooseMethod(nextMethod: PaymentMethod) {
    setMethod(nextMethod);
    setPayments([]);
    setCurrency("MXN");
    setPartialCurrency("MXN");
    setAmountReceived(total(table));
    setPartialAmount(total(table));
  }

  function addPartialPayment() {
    const equivalent = partialMethod === "Efectivo" ? partialAmount * partialRate : partialAmount;
    const amount = Math.min(Math.max(0, equivalent), remaining);
    if (!amount) return;
    setPayments((current) => [...current, {
      method: partialMethod,
      amount,
      currency: partialMethod === "Efectivo" ? partialCurrency : "MXN",
      foreignAmount: partialMethod === "Efectivo" && partialCurrency !== "MXN" ? amount / partialRate : undefined,
      exchangeRate: partialMethod === "Efectivo" && partialCurrency !== "MXN" ? partialRate : undefined,
      equivalentMxn: partialMethod === "Efectivo" && partialCurrency !== "MXN" ? amount : undefined,
    }]);
    setPartialAmount(Math.max(0, remaining - amount) / (partialMethod === "Efectivo" ? partialRate : 1));
  }

  function register() {
    if (method === "Mixto") {
      if (remaining === 0 && payments.length > 0) onPay({ payments });
      return;
    }
    if (method === "Efectivo" && receivedEquivalent < total(table)) return;
    onPay({
      payments: [{
        method,
        amount: total(table),
        currency: method === "Efectivo" ? currency : "MXN",
        foreignAmount: method === "Efectivo" && currency !== "MXN" ? amountReceived : undefined,
        exchangeRate: method === "Efectivo" && currency !== "MXN" ? rate : undefined,
        equivalentMxn: method === "Efectivo" && currency !== "MXN" ? receivedEquivalent : undefined,
      }],
      amountReceived: method === "Efectivo" ? receivedEquivalent : undefined,
      change: method === "Efectivo" ? change : undefined,
    });
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
            <div className="mt-5">
              <div className="grid grid-cols-3 gap-2">
                {(["MXN", "USD", "EUR"] as CurrencyCode[]).map((code) => <button key={code} type="button" onClick={() => { const nextRate = code === "MXN" ? 1 : exchangeRates[code]; setCurrency(code); setAmountReceived(total(table) / nextRate); }} className={["h-14 rounded-2xl border text-base font-semibold", currency === code ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-white text-stone-700"].join(" ")}>{code}</button>)}
              </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block text-base font-semibold text-stone-700">
                Monto recibido en {currency}
                <input
                  type="number"
                  min={0}
                  value={amountReceived}
                  onChange={(event) => setAmountReceived(Number(event.target.value))}
                  className="mt-2 h-16 w-full rounded-2xl border border-stone-200 px-5 text-xl text-stone-950"
                />
              </label>
              <div className="rounded-2xl bg-stone-100 p-4">
                <p className="text-sm font-semibold text-stone-600">Equivalente MXN</p>
                <p className="mt-2 text-3xl font-semibold text-stone-950">{money.format(receivedEquivalent)}</p>
                {currency !== "MXN" ? <p className="mt-1 text-xs font-semibold text-stone-500">TC {rate} MXN</p> : null}
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-700">Cambio</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-900">{money.format(change)}</p>
              </div>
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
                    onClick={() => { setPartialMethod(item); setPartialCurrency("MXN"); setPartialAmount(remaining); }}
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
              {partialMethod === "Efectivo" ? <div className="mt-3 grid grid-cols-3 gap-2">{(["MXN", "USD", "EUR"] as CurrencyCode[]).map((code) => <button key={code} type="button" onClick={() => { const nextRate = code === "MXN" ? 1 : exchangeRates[code]; setPartialCurrency(code); setPartialAmount(remaining / nextRate); }} className={["h-12 rounded-xl border text-sm font-semibold", partialCurrency === code ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-white text-stone-700"].join(" ")}>{code}</button>)}</div> : null}
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  type="number"
                  min={0}
                  max={remaining / (partialMethod === "Efectivo" ? partialRate : 1)}
                  value={partialAmount}
                  onChange={(event) => setPartialAmount(Number(event.target.value))}
                  className="h-16 rounded-2xl border border-stone-200 px-5 text-xl text-stone-950"
                  aria-label={`Monto del pago parcial en ${partialMethod === "Efectivo" ? partialCurrency : "MXN"}`}
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
                      <span>{payment.method}{payment.currency && payment.currency !== "MXN" ? ` · ${payment.foreignAmount?.toFixed(2)} ${payment.currency}` : ""}</span>
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

function AuthorizationModal({
  request,
  onClose,
  onAuthorized,
}: {
  request: AuthorizationRequest;
  onClose: () => void;
  onAuthorized: (staff: StaffMember) => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function authorize() {
    const staff = authorizePosPin(pin, request.permission);
    if (!staff) {
      setError("PIN sin permiso para esta acción.");
      return;
    }
    onAuthorized(staff);
  }

  return (
    <ModalShell title="Autorización requerida" onClose={onClose}>
      <p className="text-base font-semibold text-stone-600">
        {request.permission === "reprint_ticket"
          ? "Esta acción requiere autorización de caja."
          : "Esta acción requiere autorización de gerente."}
      </p>
      <p className="mt-2 text-xl font-semibold text-stone-950">{request.description}</p>
      <div className="mt-5">
        <FormField label="PIN">
          <input
            autoFocus
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(event) => { setPin(event.target.value.replace(/\D/g, "").slice(0, 8)); setError(""); }}
            onKeyDown={(event) => { if (event.key === "Enter" && pin) authorize(); }}
            className="h-16 w-full rounded-2xl border border-stone-200 px-5 text-center text-3xl tracking-[0.3em] text-stone-950"
            aria-describedby={error ? "authorization-error" : undefined}
          />
        </FormField>
      </div>
      {error ? <p id="authorization-error" className="mt-3 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</p> : null}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" onClick={onClose} className="h-16 rounded-2xl border border-stone-200 bg-white text-lg font-semibold text-stone-950">Cancelar</button>
        <button type="button" disabled={!pin} onClick={authorize} className="h-16 rounded-2xl bg-stone-950 text-lg font-semibold text-white disabled:bg-stone-300">Autorizar</button>
      </div>
    </ModalShell>
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
  onApply: (type: "percent" | "fixed", value: number, reason: string) => void;
}) {
  const [type, setType] = useState<"percent" | "fixed">(table.discount?.type ?? "percent");
  const [value, setValue] = useState(table.discount?.value ?? 10);
  const [reason, setReason] = useState(table.discount?.reason ?? "");
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
      </div>
      <button type="button" disabled={!valid} onClick={() => onApply(type, value, reason.trim())} className="mt-6 h-18 w-full rounded-3xl bg-stone-950 text-xl font-semibold text-white disabled:bg-stone-300">
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
  const [customer, setCustomer] = useState(table.courtesy?.customer ?? table.customer);
  const product = table.items.find((item) => item.lineId === productLineId);
  const valid = reason.trim().length > 0 && (type !== "product" || Boolean(product)) && (type !== "amount" || amount > 0);

  function apply() {
    if (!valid) return;
    const courtesyAmountValue = type === "full" ? Math.max(0, subtotal(table) - discountAmount(table)) : type === "product" ? (product?.price ?? 0) * (product?.quantity ?? 0) : amount;
    const label = type === "full" ? "Cuenta completa" : type === "product" ? product?.name ?? "Producto" : money.format(amount);
    onApply({ type, label, amount: courtesyAmountValue, reason: reason.trim(), authorizedBy: "", customer: customer.trim() || undefined, productLineId: type === "product" ? productLineId : undefined });
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

function ReceiptPreviewModal({
  preview,
  onClose,
}: {
  preview: ReceiptPreview;
  onClose: () => void;
}) {
  return <ThermalPreviewModal title={preview.mode === "initial" ? "Vista previa del ticket" : "Vista previa de reimpresión"} status={preview.mode === "reprint" ? "Reimpresión autorizada" : "Primera impresión"} onClose={onClose} render={(paperWidth) => <TicketReceipt data={preview.data} paperWidth={paperWidth} />} />;
}

function ThermalPreviewModal({ title, status, onClose, render }: { title: string; status: string; onClose: () => void; render: (paperWidth: ReceiptPaperWidth) => ReactNode }) {
  const [paperWidth, setPaperWidth] = useState<ReceiptPaperWidth>("80mm");

  function printReceipt() {
    const cleanup = () => document.body.classList.remove("receipt-printing");
    document.body.classList.add("receipt-printing");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 60000);
  }

  return createPortal(
    <div className="receipt-preview-portal">
    <ModalShell title={title} onClose={onClose} wide>
      <div className="receipt-preview-controls mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-2xl bg-stone-100 p-1" aria-label="Ancho del ticket">
          {(["58mm", "80mm"] as ReceiptPaperWidth[]).map((width) => (
            <button key={width} type="button" onClick={() => setPaperWidth(width)} className={["h-11 rounded-xl px-5 text-sm font-semibold", paperWidth === width ? "bg-stone-950 text-white" : "text-stone-600"].join(" ")}>{width}</button>
          ))}
        </div>
        <p className="text-sm font-semibold text-stone-500">{status}</p>
      </div>
      <div className="max-h-[62vh] overflow-y-auto rounded-2xl bg-stone-100 py-6">
        <div className="thermal-print-root">
          {render(paperWidth)}
        </div>
      </div>
      <div className="receipt-preview-controls mt-5 grid grid-cols-2 gap-3">
        <button type="button" onClick={onClose} className="h-16 rounded-2xl border border-stone-200 bg-white text-lg font-semibold text-stone-950">Cerrar</button>
        <button type="button" onClick={printReceipt} className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl bg-stone-950 text-lg font-semibold text-white"><Printer size={22} /> Imprimir</button>
      </div>
    </ModalShell>
    </div>,
    document.body,
  );
}

function PaymentCompleteModal({
  isCourtesy,
  isQuickSale,
  onCloseOrder,
  onPrint,
}: {
  isCourtesy: boolean;
  isQuickSale: boolean;
  onCloseOrder: () => void;
  onPrint: () => void;
}) {
  return (
    <ModalShell title={isCourtesy ? "Cortesía registrada" : "Pago completado"} onClose={onCloseOrder}>
      <div className="rounded-3xl bg-emerald-50 p-7 text-center">
        <CheckCircle2 className="mx-auto text-emerald-700" size={54} />
        <p className="mt-4 text-xl font-semibold text-emerald-950">La cuenta está lista para cerrar.</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onPrint} className="inline-flex h-18 items-center justify-center gap-2 rounded-3xl border border-stone-200 bg-white text-lg font-semibold text-stone-950"><Printer size={23} /> Imprimir ticket</button>
        <button type="button" onClick={onCloseOrder} className="h-18 rounded-3xl bg-stone-950 text-lg font-semibold text-white">{isQuickSale ? "Cerrar orden" : "Cerrar mesa"}</button>
      </div>
    </ModalShell>
  );
}

function OrderActionsModal({ table, onClose, onAction, onDiscount, onCourtesy, onPrint }: { table: PosTable; onClose: () => void; onAction: (action: Exclude<OrderActionModal, "menu" | null>) => void; onDiscount: () => void; onCourtesy: () => void; onPrint: () => void }) {
  const actions = [
    { label: "Cambiar mesero", icon: <UserRound size={22} />, run: () => onAction("waiter") },
    { label: "Renombrar mesa", icon: <Pencil size={22} />, run: () => onAction("rename") },
    { label: "Mover mesa", icon: <MoveRight size={22} />, run: () => onAction("move") },
    { label: "Cancelar producto", icon: <Ban size={22} />, run: () => onAction("cancel"), sensitive: true, disabled: !table.items.some((item) => item.status !== "cancelled") },
    { label: "Aplicar descuento", icon: <ReceiptText size={22} />, run: onDiscount, sensitive: true },
    { label: "Registrar cortesía", icon: <Sparkles size={22} />, run: onCourtesy, sensitive: true },
    { label: "Reimprimir ticket", icon: <Printer size={22} />, run: onPrint, sensitive: true },
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

function CancelProductModal({ table, lineId, onSelectLine, onClose, onCancel }: { table: PosTable; lineId: string; onSelectLine: (lineId: string) => void; onClose: () => void; onCancel: (lineId: string, reason: string) => void }) {
  const [reason, setReason] = useState("");
  const valid = reason.trim();
  return <ModalShell title="Cancelar producto" onClose={onClose}>
    <FormField label="Producto"><select value={lineId} onChange={(event) => onSelectLine(event.target.value)} className="h-14 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-950">{table.items.filter((product) => product.status !== "cancelled").map((product) => <option key={product.lineId} value={product.lineId}>{product.quantity}x {product.name}</option>)}</select></FormField>
    <div className="mt-4"><FormField label="Motivo obligatorio"><input value={reason} onChange={(event) => setReason(event.target.value)} className="h-14 w-full rounded-2xl border border-stone-200 px-4 text-base text-stone-950" placeholder="Ej. cliente cambió de opinión" /></FormField></div>
    <button type="button" disabled={!valid} onClick={() => onCancel(lineId, reason.trim())} className="mt-5 h-16 w-full rounded-3xl bg-rose-700 text-lg font-semibold text-white disabled:bg-stone-300">Cancelar producto</button>
  </ModalShell>;
}

function OrderHistoryModal({ title, history, onClose }: { title: string; history: NonNullable<PosTable["history"]>; onClose: () => void }) {
  return <ModalShell title={`Historial · ${title}`} onClose={onClose}><div className="max-h-[60vh] space-y-3 overflow-y-auto">{history.length ? [...history].reverse().map((event) => <div key={event.id} className="flex gap-4 rounded-2xl bg-stone-50 p-4"><span className="shrink-0 text-sm font-semibold text-stone-500">{new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date(event.createdAt))}</span><div><p className="text-base font-semibold text-stone-950">{event.message}</p><p className="mt-1 text-xs font-semibold text-stone-500">{event.actor}</p></div></div>) : <p className="p-8 text-center text-stone-500">Sin eventos todavía</p>}</div></ModalShell>;
}

function PaidAccountsModal({ sales, onClose, onDetail, onReopen, onPrint }: { sales: Sale[]; onClose: () => void; onDetail: (sale: Sale) => void; onReopen: (sale: Sale) => void; onPrint: (sale: Sale) => void }) {
  return <ModalShell title="Cuentas cobradas" onClose={onClose} wide><div className="max-h-[70vh] space-y-3 overflow-y-auto">{sales.length ? sales.map((sale) => <article key={sale.id} className="rounded-2xl border border-stone-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-stone-500">{sale.folio}</p><h3 className="mt-1 text-lg font-semibold text-stone-950">{sale.isQuickSale ? `Venta rápida · ${sale.orderType ?? ""}` : sale.orderName || sale.tableName}</h3><p className="mt-1 text-sm font-semibold text-stone-500">Mesero: {sale.waiter?.name ?? "Sin asignar"} · {new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date(sale.closedAt))}</p></div><div className="text-right"><p className="text-2xl font-semibold text-stone-950">{money.format(sale.total)}</p><p className="text-sm font-semibold text-emerald-700">{sale.paymentMethod} · Cerrada</p></div></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => onDetail(sale)} className="h-11 rounded-xl border border-stone-200 px-4 text-sm font-semibold">Ver detalle</button><button type="button" onClick={() => onPrint(sale)} className="h-11 rounded-xl border border-stone-200 px-4 text-sm font-semibold">Reimprimir ticket</button><button type="button" onClick={() => onReopen(sale)} className="h-11 rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white">Reabrir cuenta</button></div></article>) : <p className="p-10 text-center text-stone-500">No hay cuentas cobradas.</p>}</div></ModalShell>;
}

function SaleDetailModal({ sale, onClose, onReopen, onPrint }: { sale: Sale; onClose: () => void; onReopen: () => void; onPrint: () => void }) {
  return <ModalShell title={`Detalle · ${sale.folio}`} onClose={onClose}>
    <div className="space-y-3">{sale.items.map((item) => <div key={item.lineId} className="flex justify-between rounded-2xl bg-stone-50 p-4"><span className={item.status === "cancelled" ? "text-rose-700 line-through" : "text-stone-950"}>{item.quantity}x {item.name}</span><span className="font-semibold">{item.status === "cancelled" ? "Cancelado" : money.format(item.price * item.quantity)}</span></div>)}</div>
    <div className="mt-4 flex justify-between border-t pt-4 text-xl font-semibold"><span>Total</span><span>{money.format(sale.total)}</span></div>
    <div className="mt-5"><p className="text-sm font-semibold text-stone-500">Historial</p><div className="mt-2 max-h-48 space-y-2 overflow-y-auto">{(sale.history ?? []).map((event) => <div key={event.id} className="rounded-xl bg-stone-50 px-3 py-2 text-sm"><span className="font-semibold text-stone-950">{new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date(event.createdAt))} · {event.message}</span></div>)}</div></div>
    <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={onPrint} className="h-14 rounded-2xl border border-stone-200 font-semibold">Reimprimir</button><button type="button" onClick={onReopen} className="h-14 rounded-2xl bg-stone-950 font-semibold text-white">Reabrir cuenta</button></div>
  </ModalShell>;
}

function ReopenAccountModal({ sale, tables, onClose, onReopen }: { sale: Sale; tables: PosTable[]; onClose: () => void; onReopen: (sale: Sale, reason: string, targetId: string) => void }) {
  const original = tables.find((table) => table.id === sale.tableId);
  const occupied = Boolean(original?.openedAt);
  const freeTables = tables.filter((table) => !table.openedAt && !table.quickType);
  const [reason, setReason] = useState("");
  const [targetId, setTargetId] = useState(!occupied && original ? original.id : "separate");
  const valid = reason.trim() && (targetId === "separate" || freeTables.some((table) => table.id === targetId));
  return <ModalShell title="Reabrir cuenta" onClose={onClose}>{occupied ? <p className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Esta mesa ya está ocupada. Puedes reabrir como venta separada o moverla a otra mesa.</p> : null}<FormField label="Destino"><select value={targetId} onChange={(event) => setTargetId(event.target.value)} className="h-14 w-full rounded-2xl border border-stone-200 bg-white px-4"><option value="separate">Venta separada</option>{freeTables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select></FormField><div className="mt-4"><FormField label="Motivo obligatorio"><input value={reason} onChange={(event) => setReason(event.target.value)} className="h-14 w-full rounded-2xl border border-stone-200 px-4" /></FormField></div><button type="button" disabled={!valid} onClick={() => onReopen(sale, reason.trim(), targetId)} className="mt-5 h-16 w-full rounded-3xl bg-stone-950 text-lg font-semibold text-white disabled:bg-stone-300">Reabrir cuenta</button></ModalShell>;
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

function OpenCashModal({
  onClose,
  onOpen,
}: {
  onClose: () => void;
  onOpen: (openingCash: number, responsible: StaffMember, authorizer: StaffMember) => void;
}) {
  const responsibleStaff = demoStaff.filter((staff) => staff.active && ["cashier", "manager", "admin"].includes(staff.role));
  const [openingCash, setOpeningCash] = useState(0);
  const [responsibleId, setResponsibleId] = useState(responsibleStaff[0]?.id ?? "");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function open() {
    const responsible = responsibleStaff.find((staff) => staff.id === responsibleId);
    const authorizer = authorizePosPin(pin, "open_cash");
    if (!responsible || !authorizer) {
      setError("PIN sin permiso para abrir caja.");
      return;
    }
    onOpen(openingCash, responsible, authorizer);
  }

  return (
    <ModalShell title="Abrir caja" onClose={onClose}>
      <div className="space-y-4">
        <FormField label="Caja inicial">
          <input autoFocus type="number" min={0} value={openingCash || ""} onChange={(event) => setOpeningCash(Number(event.target.value))} className="h-16 w-full rounded-2xl border border-stone-200 px-5 text-2xl font-semibold text-stone-950" placeholder="$0" />
        </FormField>
        <FormField label="Responsable">
          <select value={responsibleId} onChange={(event) => setResponsibleId(event.target.value)} className="h-16 w-full rounded-2xl border border-stone-200 bg-white px-5 text-lg text-stone-950">
            {responsibleStaff.map((staff) => <option key={staff.id} value={staff.id}>{staff.name} · {staffRoleLabel(staff.role)}</option>)}
          </select>
        </FormField>
        <FormField label="PIN cajero o gerente">
          <input type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={(event) => { setPin(event.target.value.replace(/\D/g, "").slice(0, 8)); setError(""); }} onKeyDown={(event) => { if (event.key === "Enter" && pin) open(); }} className="h-16 w-full rounded-2xl border border-stone-200 px-5 text-center text-3xl tracking-[0.3em] text-stone-950" />
        </FormField>
      </div>
      {error ? <p className="mt-3 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</p> : null}
      <button type="button" disabled={!responsibleId || !pin || openingCash < 0} onClick={open} className="mt-6 h-16 w-full rounded-3xl bg-stone-950 text-lg font-semibold text-white disabled:bg-stone-300">Abrir turno</button>
    </ModalShell>
  );
}

function ExchangeRatesModal({ rates, onClose, onSave }: { rates: ExchangeRateSettings; onClose: () => void; onSave: (rates: ExchangeRateSettings) => void }) {
  const [usd, setUsd] = useState(rates.USD);
  const [eur, setEur] = useState(rates.EUR);
  const valid = usd > 0 && eur > 0;
  return <ModalShell title="Tipo de cambio" onClose={onClose}>
    <div className="space-y-4">
      <FormField label="USD a MXN"><input type="number" min={0.01} step={0.01} value={usd} onChange={(event) => setUsd(Number(event.target.value))} className="h-16 w-full rounded-2xl border border-stone-200 px-5 text-2xl font-semibold text-stone-950" /></FormField>
      <FormField label="EUR a MXN"><input type="number" min={0.01} step={0.01} value={eur} onChange={(event) => setEur(Number(event.target.value))} className="h-16 w-full rounded-2xl border border-stone-200 px-5 text-2xl font-semibold text-stone-950" /></FormField>
    </div>
    <button type="button" disabled={!valid} onClick={() => onSave({ USD: usd, EUR: eur })} className="mt-6 h-16 w-full rounded-3xl bg-stone-950 text-lg font-semibold text-white disabled:bg-stone-300">Guardar tipo de cambio</button>
  </ModalShell>;
}

function CashierModal({
  business,
  sales,
  tables,
  onClose,
  onAuthorize,
}: {
  business: ReceiptBusinessProfile;
  sales: Sale[];
  tables: PosTable[];
  onClose: () => void;
  onAuthorize: (permission: PosPermission, description: string, onAuthorized: (staff: StaffMember) => void) => void;
}) {
  const [closing, setClosing] = useState<CashClosing | null>(null);
  const [openingCash, setOpeningCash] = useState(0);
  const [countedCash, setCountedCash] = useState(0);
  const [message, setMessage] = useState("");
  const [withdrawalModal, setWithdrawalModal] = useState(false);
  const [registeredWithdrawal, setRegisteredWithdrawal] = useState<CashWithdrawal | null>(null);
  const [cashReceiptPreview, setCashReceiptPreview] = useState<{ kind: "closing" | "withdrawal"; withdrawal?: CashWithdrawal; reprint: boolean } | null>(null);
  const [justClosed, setJustClosed] = useState(false);

  useEffect(() => {
    const loadClosing = () => {
      const saved = readCashClosing();
      setClosing(saved);
      setOpeningCash(saved?.openingCash ?? 0);
      setCountedCash(saved?.countedCash ?? 0);
    };
    loadClosing();
  }, []);

  const shiftSales = closing
    ? sales.filter((sale) => new Date(sale.closedAt).getTime() >= new Date(closing.openedAt).getTime())
    : [];
  const liveSnapshot = buildCashSnapshot(shiftSales, tables);
  const liveOrders = buildCashOrders(shiftSales, tables);
  const locked = closing?.status === "closed";
  const snapshot = locked ? closing.snapshot : liveSnapshot;
  const orders = locked ? closing.orders ?? [] : liveOrders;
  const withdrawals = closing?.withdrawals ?? [];
  const withdrawalAmount = withdrawalsTotal(withdrawals);
  const expectedCash = locked
    ? closing.expectedCash
    : expectedDrawerCash(openingCash, liveSnapshot.cash, withdrawals);
  const difference = countedCash - expectedCash;
  const differenceCopy = difference === 0 ? "Cuadra" : difference > 0 ? "Sobra" : "Falta";

  function persistClosing(
    status: CashClosing["status"],
    authorizer?: StaffMember,
    withdrawal?: CashWithdrawal,
  ) {
    const now = new Date().toISOString();
    const nextWithdrawals = withdrawal ? [...withdrawals, withdrawal] : withdrawals;
    const nextExpectedCash = expectedDrawerCash(openingCash, liveSnapshot.cash, nextWithdrawals);
    const existingHistory = closing?.history ?? [];
    const hasOpeningEvent = existingHistory.some((event) => event.type === "cash_opened");
    const openingEvent = hasOpeningEvent
      ? null
      : makeAuditEvent("cash_opened", `Caja abierta con ${money.format(openingCash)}`);
    const baseHistory = existingHistory.map((event) => event.type === "cash_opened"
      ? { ...event, message: `Caja abierta con ${money.format(openingCash)}` }
      : event);
    const withdrawalEvent = withdrawal
      ? makeAuditEvent("cash_withdrawal", `Retiro ${money.format(withdrawal.amount)} · ${withdrawal.reason} · autorizó: ${withdrawal.authorizedBy.name}`, currentPosUser.name, {
          requestedBy: currentPosUser.name,
          authorizedBy: withdrawal.authorizedBy.name,
          authorizedRole: withdrawal.authorizedBy.role,
          reason: withdrawal.reason,
        })
      : null;
    const closeEvent = status === "closed" && authorizer
      ? makeAuditEvent("cash_closed", `Caja cerrada · autorizó: ${authorizer.name}`, currentPosUser.name, {
          requestedBy: currentPosUser.name,
          authorizedBy: authorizer.name,
          authorizedRole: authorizer.role,
        })
      : null;
    const next: CashClosing = {
      id: closing?.id ?? `cash-closing-${globalThis.crypto.randomUUID()}`,
      status,
      openingCash,
      countedCash,
      expectedCash: nextExpectedCash,
      difference: countedCash - nextExpectedCash,
      snapshot: liveSnapshot,
      orders: liveOrders,
      savedAt: now,
      closedAt: status === "closed" ? now : undefined,
      authorizedBy: status === "closed" ? authorizer : closing?.authorizedBy,
      history: [
        ...baseHistory,
        ...(openingEvent ? [openingEvent] : []),
        ...(withdrawalEvent ? [withdrawalEvent] : []),
        ...(closeEvent ? [closeEvent] : []),
      ],
      withdrawals: nextWithdrawals,
      openedAt: closing?.openedAt ?? now,
    };
    writeCashClosing(next);
    setClosing(next);
    setMessage(withdrawal ? "Retiro registrado" : status === "closed" ? "Caja cerrada correctamente" : "Corte guardado");
    if (status === "closed") setJustClosed(true);
    if (withdrawal) {
      setWithdrawalModal(false);
      setRegisteredWithdrawal(withdrawal);
    }
  }

  function registerWithdrawal(input: Omit<CashWithdrawal, "id" | "authorizedBy" | "createdAt">) {
    onAuthorize("register_withdrawal", "Registrar retiro de caja", (staff) => persistClosing("draft", undefined, {
      ...input,
      id: `withdrawal-${globalThis.crypto.randomUUID()}`,
      authorizedBy: staff,
      createdAt: new Date().toISOString(),
    }));
  }

  const cashHistory = [
    ...(closing?.history ?? []),
    ...shiftSales.map((sale) => makeCashSaleEvent(sale)),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const closingReceiptData: CashClosingReceiptData = {
    business,
    issuedAt: closing?.closedAt ?? new Date().toISOString(),
    shiftId: closing?.id ?? "Turno actual",
    responsible: closing?.responsible?.name ?? currentPosUser.name,
    snapshot,
    withdrawals,
    openingCash,
    expectedCash,
    countedCash,
    difference,
  };

  function authorizeCashReprint(label: string, action: () => void) {
    onAuthorize("reprint_cash_receipt", label, (staff) => {
      if (closing) {
        const event = makeAuditEvent("cash_receipt_reprinted", `${label} · autorizó: ${staff.name}`, currentPosUser.name, { requestedBy: currentPosUser.name, authorizedBy: staff.name, authorizedRole: staff.role });
        const next = { ...closing, history: [...(closing.history ?? []), event] };
        writeCashClosing(next);
        setClosing(next);
      }
      action();
    });
  }

  function previewClosingReceipt() {
    if (locked && !justClosed) {
      authorizeCashReprint("Reimpresión de corte", () => setCashReceiptPreview({ kind: "closing", reprint: true }));
      return;
    }
    setCashReceiptPreview({ kind: "closing", reprint: false });
  }

  return (
    <>
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
            <CashMetric label="Venta total bruta" value={money.format(snapshot.gross)} />
            <CashMetric label="Descuentos del turno" value={money.format(snapshot.discounts)} />
            <CashMetric label="Cortesías del turno" value={money.format(snapshot.courtesies)} />
            <CashMetric label="Venta neta" value={money.format(snapshot.net)} strong />
            <CashMetric label="Total cobrado" value={money.format(snapshot.totalCollected)} />
            <CashMetric label="Pendiente por cobrar" value={money.format(snapshot.pending)} />
            <CashMetric label="Órdenes cerradas" value={String(snapshot.closedOrders)} />
            <CashMetric label="Órdenes abiertas" value={String(snapshot.openOrders)} />
            <CashMetric label="Retiros del turno" value={money.format(withdrawalAmount)} />
            <CashMetric label="Efectivo esperado" value={money.format(expectedCash)} strong />
          </div>
        </section>

        <section>
          <p className="text-sm font-semibold text-stone-500">Métodos de pago</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PaymentMethodCard icon={<Banknote size={25} />} label="Total efectivo" value={snapshot.cash} />
            <PaymentMethodCard icon={<CreditCard size={25} />} label="Total tarjeta" value={snapshot.card} />
            <PaymentMethodCard icon={<ReceiptText size={25} />} label="Total transferencia" value={snapshot.transfer} />
            <PaymentMethodCard icon={<Sparkles size={25} />} label="Total pagos mixtos" value={snapshot.mixed} detail="Total de órdenes con pago mixto" />
            <CashMetric label="USD recibido" value={`${snapshot.usdReceived.toFixed(2)} USD`} />
            <CashMetric label="EUR recibido" value={`${snapshot.eurReceived.toFixed(2)} EUR`} />
            <CashMetric label="Equivalente MXN" value={money.format(snapshot.foreignEquivalentMxn)} />
          </div>
        </section>

        <section>
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
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <CashMetric label="Caja inicial" value={money.format(openingCash)} />
            <CashMetric label="Efectivo esperado" value={money.format(expectedCash)} />
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
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-stone-500">Salidas de efectivo</p>
              <h3 className="mt-1 text-2xl font-semibold text-stone-950">Retiros del turno</h3>
            </div>
            <button type="button" disabled={locked} onClick={() => setWithdrawalModal(true)} className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-base font-semibold text-white disabled:opacity-50">
              <Minus size={21} /> Registrar retiro
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {withdrawals.length ? [...withdrawals].reverse().map((withdrawal) => (
              <div key={withdrawal.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-4">
                <div><p className="text-base font-semibold text-stone-950">{withdrawal.reason}</p><p className="mt-1 text-sm font-semibold text-stone-500">Autorizó: {withdrawal.authorizedBy.name}{withdrawal.receivedBy ? ` · Recibió: ${withdrawal.receivedBy}` : ""}</p></div>
                <div className="flex items-center gap-3"><p className="text-2xl font-semibold text-rose-700">-{money.format(withdrawal.amount)}</p><button type="button" onClick={() => authorizeCashReprint("Reimpresión de retiro", () => setCashReceiptPreview({ kind: "withdrawal", withdrawal, reprint: true }))} className="h-11 rounded-xl border border-stone-200 px-3 text-sm font-semibold text-stone-700"><Printer size={17} /></button></div>
              </div>
            )) : <div className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm font-semibold text-stone-500">Sin retiros registrados</div>}
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
                <div className="min-w-52"><p className="text-base font-semibold text-stone-950">{order.label}</p><p className="mt-1 text-xs font-semibold text-stone-500">{order.waiter} · {order.time ? new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date(order.time)) : "Sin hora"}</p></div>
                <div><p className="text-base font-semibold text-stone-950">{money.format(order.total)}</p><p className="mt-1 text-xs font-semibold text-stone-500">Desc. {money.format(order.discount)} · Cortesía {money.format(order.courtesy)}</p></div>
                <span className="text-sm font-semibold text-stone-600">{order.method}</span>
                <span className={["rounded-full px-3 py-1 text-xs font-semibold", order.status === "Cerrada" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"].join(" ")}>{order.status}</span>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-base font-semibold text-stone-500">Sin órdenes en este corte</div>
            )}
          </div>
        </section>

        <section>
          <p className="text-sm font-semibold text-stone-500">Auditoría</p>
          <h3 className="mt-1 text-2xl font-semibold text-stone-950">Historial de caja</h3>
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {cashHistory.length ? cashHistory.map((event) => (
              <div key={event.id} className="flex gap-4 rounded-2xl bg-stone-50 px-4 py-3">
                <span className="shrink-0 text-sm font-semibold text-stone-500">{new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date(event.createdAt))}</span>
                <div className="flex-1"><p className="text-sm font-semibold text-stone-950">{event.message}</p><p className="mt-1 text-xs font-semibold text-stone-500">{event.actor}</p></div>
                {event.type === "cash_closed" ? <button type="button" onClick={() => authorizeCashReprint("Reimpresión de corte", () => setCashReceiptPreview({ kind: "closing", reprint: true }))} className="grid size-10 place-items-center rounded-xl border border-stone-200 bg-white" aria-label="Reimprimir corte"><Printer size={17} /></button> : null}
              </div>
            )) : <div className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm font-semibold text-stone-500">El historial comenzará al guardar el corte.</div>}
          </div>
        </section>

        <div className="sticky bottom-0 grid gap-3 border-t border-stone-200 bg-white pt-4 sm:grid-cols-3">
          <button type="button" onClick={previewClosingReceipt} className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white text-base font-semibold text-stone-900">
            <Printer size={21} />
            Imprimir corte
          </button>
          <button type="button" disabled={locked} onClick={() => persistClosing("draft")} className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl bg-stone-100 text-base font-semibold text-stone-900 disabled:opacity-50">
            <Save size={21} />
            Guardar corte
          </button>
          <button type="button" disabled={locked} onClick={() => onAuthorize("close_cash", "Cerrar caja", (staff) => persistClosing("closed", staff))} className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl bg-stone-950 text-base font-semibold text-white disabled:opacity-50">
            <Lock size={21} />
            {locked ? "Caja cerrada" : "Cerrar caja · Gerente"}
          </button>
        </div>
      </div>
    </ModalShell>
    {withdrawalModal ? <WithdrawalModal onClose={() => setWithdrawalModal(false)} onRegister={registerWithdrawal} /> : null}
    {registeredWithdrawal ? <WithdrawalCompleteModal onClose={() => setRegisteredWithdrawal(null)} onPrint={() => setCashReceiptPreview({ kind: "withdrawal", withdrawal: registeredWithdrawal, reprint: false })} /> : null}
    {cashReceiptPreview ? <ThermalPreviewModal title={cashReceiptPreview.kind === "closing" ? "Vista previa del corte" : "Vista previa del retiro"} status={cashReceiptPreview.reprint ? "Reimpresión autorizada" : "Primera impresión"} onClose={() => setCashReceiptPreview(null)} render={(paperWidth) => cashReceiptPreview.kind === "closing" ? <CashClosingReceipt data={closingReceiptData} paperWidth={paperWidth} /> : <CashWithdrawalReceipt business={business} shiftId={closing?.id ?? "Turno actual"} responsible={closing?.responsible?.name ?? currentPosUser.name} withdrawal={cashReceiptPreview.withdrawal!} paperWidth={paperWidth} />} /> : null}
    </>
  );
}

function WithdrawalModal({
  onClose,
  onRegister,
}: {
  onClose: () => void;
  onRegister: (withdrawal: Omit<CashWithdrawal, "id" | "authorizedBy" | "createdAt">) => void;
}) {
  const reasons = ["Pago proveedor", "Compra urgente", "Pago repartidor", "Cambio para caja", "Otro"];
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState(reasons[0]);
  const [customReason, setCustomReason] = useState("");
  const [description, setDescription] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const finalReason = reason === "Otro" ? customReason.trim() : reason;
  const valid = amount > 0 && finalReason.length > 0;

  return (
    <ModalShell title="Registrar retiro" onClose={onClose}>
      <div className="space-y-4">
        <FormField label="Monto">
          <input autoFocus type="number" min={1} value={amount || ""} onChange={(event) => setAmount(Number(event.target.value))} className="h-16 w-full rounded-2xl border border-stone-200 px-5 text-2xl font-semibold text-stone-950" placeholder="$0" />
        </FormField>
        <FormField label="Motivo obligatorio">
          <select value={reason} onChange={(event) => setReason(event.target.value)} className="h-16 w-full rounded-2xl border border-stone-200 bg-white px-5 text-lg text-stone-950">
            {reasons.map((option) => <option key={option}>{option}</option>)}
          </select>
        </FormField>
        {reason === "Otro" ? <FormField label="Describe el motivo"><input value={customReason} onChange={(event) => setCustomReason(event.target.value)} className="h-16 w-full rounded-2xl border border-stone-200 px-5 text-lg text-stone-950" /></FormField> : null}
        <FormField label="Descripción (opcional)"><input value={description} onChange={(event) => setDescription(event.target.value)} className="h-16 w-full rounded-2xl border border-stone-200 px-5 text-lg text-stone-950" placeholder="Detalle del retiro" /></FormField>
        <FormField label="Recibió (opcional)"><input value={receivedBy} onChange={(event) => setReceivedBy(event.target.value)} className="h-16 w-full rounded-2xl border border-stone-200 px-5 text-lg text-stone-950" placeholder="Nombre" /></FormField>
      </div>
      <button type="button" disabled={!valid} onClick={() => onRegister({ amount, reason: finalReason, description: description.trim() || undefined, receivedBy: receivedBy.trim() || undefined })} className="mt-6 h-16 w-full rounded-3xl bg-stone-950 text-lg font-semibold text-white disabled:bg-stone-300">
        Autorizar retiro
      </button>
    </ModalShell>
  );
}

function WithdrawalCompleteModal({ onClose, onPrint }: { onClose: () => void; onPrint: () => void }) {
  return <ModalShell title="Retiro registrado" onClose={onClose}>
    <div className="rounded-3xl bg-emerald-50 p-7 text-center"><CheckCircle2 className="mx-auto text-emerald-700" size={54} /><p className="mt-4 text-xl font-semibold text-emerald-950">El retiro quedó guardado en el turno.</p></div>
    <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={onClose} className="h-16 rounded-2xl border border-stone-200 text-lg font-semibold">Cerrar</button><button type="button" onClick={onPrint} className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl bg-stone-950 text-lg font-semibold text-white"><Printer size={21} /> Imprimir comprobante</button></div>
  </ModalShell>;
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
