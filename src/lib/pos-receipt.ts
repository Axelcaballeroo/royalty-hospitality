import type { CashClosing, PaymentPart, PosTable, Sale } from "@/lib/pos-shared";

export type ReceiptPaperWidth = "58mm" | "80mm";

export type ReceiptBusinessProfile = {
  name: string;
  address?: string;
  phone?: string;
  rfc?: string;
  footerMessage?: string[];
};

export type ReceiptData = {
  business: ReceiptBusinessProfile;
  folio: string;
  issuedAt: string;
  cashRegister: string;
  waiter: string;
  table: string;
  orderType: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  courtesy: number;
  total: number;
  paymentMethod: string;
  payments: PaymentPart[];
  amountReceived?: number;
  change?: number;
};

export type CurrentReceiptPayment = {
  folio: string;
  paidAt: string;
  payments: PaymentPart[];
  isCourtesy: boolean;
  amountReceived?: number;
  change?: number;
};

function tableSubtotal(table: PosTable) {
  return table.items.reduce(
    (sum, item) => item.status === "cancelled" ? sum : sum + item.price * item.quantity,
    0,
  );
}

function tableDiscount(table: PosTable) {
  if (!table.discount) return 0;
  const base = tableSubtotal(table);
  const value = table.discount.type === "percent"
    ? Math.round((base * table.discount.value) / 100)
    : table.discount.value;
  return Math.min(base, Math.max(0, value));
}

function tableCourtesy(table: PosTable) {
  if (!table.courtesy) return 0;
  const available = Math.max(0, tableSubtotal(table) - tableDiscount(table));
  return table.courtesy.type === "full" ? available : Math.min(table.courtesy.amount, available);
}

function receiptItems(items: PosTable["items"] | Sale["items"]): ReceiptData["items"] {
  return items
    .filter((item) => item.status !== "cancelled")
    .map((item) => ({
      id: item.lineId,
      name: item.name,
      quantity: item.quantity,
      total: item.price * item.quantity,
    }));
}

function paymentLabel(payments: PaymentPart[], isCourtesy: boolean) {
  if (isCourtesy) return "Cortesía";
  return payments.length > 1 ? "Mixto" : payments[0]?.method ?? "Pendiente";
}

function receiptOrderType(quickType?: string) {
  if (!quickType) return "Mesa";
  if (quickType === "A domicilio") return "Domicilio";
  if (quickType === "Para llevar" || quickType === "Para recoger") return quickType;
  return "Venta rápida";
}

export function receiptFromTable(
  table: PosTable,
  payment: CurrentReceiptPayment,
  business: ReceiptBusinessProfile,
  cashClosing: CashClosing | null,
): ReceiptData {
  const subtotal = tableSubtotal(table);
  const discount = tableDiscount(table);
  const courtesy = tableCourtesy(table);
  return {
    business,
    folio: payment.folio,
    issuedAt: payment.paidAt,
    cashRegister: cashClosing?.responsible?.name ?? table.paidBy?.name ?? "Caja principal",
    waiter: table.waiter?.name ?? "Sin asignar",
    table: table.quickType ? "Venta rápida" : table.orderName || table.name,
    orderType: receiptOrderType(table.quickType),
    items: receiptItems(table.items),
    subtotal,
    discount,
    courtesy,
    total: Math.max(0, subtotal - discount - courtesy),
    paymentMethod: paymentLabel(payment.payments, payment.isCourtesy),
    payments: payment.payments,
    amountReceived: payment.amountReceived,
    change: payment.change,
  };
}

export function receiptFromSale(
  sale: Sale,
  business: ReceiptBusinessProfile,
): ReceiptData {
  const payments = sale.payments?.length
    ? sale.payments
    : sale.isCourtesy
      ? []
      : sale.paymentMethod !== "Mixto"
        ? [{ method: sale.paymentMethod, amount: sale.total } as PaymentPart]
        : [];
  return {
    business,
    folio: sale.folio ?? sale.id,
    issuedAt: sale.paidAt ?? sale.closedAt,
    cashRegister: sale.cashRegister ?? sale.paidBy?.name ?? "Caja principal",
    waiter: sale.waiter?.name ?? "Sin asignar",
    table: sale.isQuickSale ? "Venta rápida" : sale.orderName || sale.tableName,
    orderType: sale.isQuickSale ? receiptOrderType(sale.orderType) : "Mesa",
    items: receiptItems(sale.items),
    subtotal: sale.gross ?? sale.total + (sale.discount ?? 0) + (sale.courtesy ?? 0),
    discount: sale.discount ?? 0,
    courtesy: sale.courtesy ?? 0,
    total: sale.total,
    paymentMethod: sale.isCourtesy ? "Cortesía" : sale.paymentMethod,
    payments,
    amountReceived: sale.amountReceived,
    change: sale.change,
  };
}
