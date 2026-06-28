import type {
  CashClosingOrder,
  CashClosingSnapshot,
  PaymentPart,
  PosTable,
  Sale,
} from "@/lib/pos-shared";

function tableSubtotal(table: PosTable) {
  return table.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function tableDiscount(table: PosTable) {
  if (!table.discount) return 0;
  const subtotal = tableSubtotal(table);
  const amount = table.discount.type === "percent"
    ? Math.round((subtotal * table.discount.value) / 100)
    : table.discount.value;
  return Math.min(subtotal, Math.max(0, amount));
}

function tableCourtesy(table: PosTable) {
  if (!table.courtesy) return 0;
  const available = Math.max(0, tableSubtotal(table) - tableDiscount(table));
  return table.courtesy.type === "full"
    ? available
    : Math.min(table.courtesy.amount, available);
}

function tableTotal(table: PosTable) {
  return Math.max(0, tableSubtotal(table) - tableDiscount(table) - tableCourtesy(table));
}

export function buildCashSnapshot(sales: Sale[], tables: PosTable[]): CashClosingSnapshot {
  const openOrders = tables.filter((table) => table.openedAt);
  const byMethod = (method: PaymentPart["method"]) =>
    sales.reduce((sum, sale) => {
      const payments = sale.payments?.length
        ? sale.payments
        : sale.paymentMethod !== "Mixto"
          ? [{ method: sale.paymentMethod, amount: sale.total } as PaymentPart]
          : [];
      return sum + payments
        .filter((payment) => payment.method === method)
        .reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
    }, 0);

  return {
    gross: sales.reduce((sum, sale) => sum + (sale.gross ?? sale.total), 0),
    discounts: sales.reduce((sum, sale) => sum + (sale.discount ?? 0), 0),
    courtesies: sales.reduce((sum, sale) => sum + (sale.courtesy ?? 0), 0),
    net: sales.reduce((sum, sale) => sum + sale.total, 0),
    cash: byMethod("Efectivo"),
    card: byMethod("Tarjeta"),
    transfer: byMethod("Transferencia"),
    mixed: sales
      .filter((sale) => sale.paymentMethod === "Mixto" && !sale.isCourtesy)
      .reduce((sum, sale) => sum + sale.total, 0),
    pending: openOrders.reduce((sum, table) => sum + tableTotal(table), 0),
    closedOrders: sales.length,
    openOrders: openOrders.length,
  };
}

export function buildCashOrders(sales: Sale[], tables: PosTable[]): CashClosingOrder[] {
  const quickTypes = ["Comer aquí", "Para llevar", "A domicilio", "Para recoger"];
  const closed: CashClosingOrder[] = sales.map((sale) => {
    const quickSale = sale.isQuickSale || quickTypes.includes(sale.tableName);
    return {
      id: sale.id,
      label: quickSale ? `Venta rápida${sale.orderType ? ` · ${sale.orderType}` : ""}` : sale.tableName,
      total: sale.total,
      method: sale.isCourtesy ? "Cortesía" : sale.paymentMethod,
      status: "Cerrada",
    };
  });
  const open: CashClosingOrder[] = tables
    .filter((table) => table.openedAt)
    .map((table) => ({
      id: `open-${table.id}`,
      label: table.quickType ? `Venta rápida · ${table.quickType}` : table.name,
      total: tableTotal(table),
      method: "Pendiente",
      status: "Pendiente",
    }));
  return [...open, ...closed];
}
