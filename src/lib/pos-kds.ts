import type { OrderItemStatus, PosTable, ProductStation } from "@/lib/pos-shared";

export type KdsStatus = "new" | "preparing" | "ready";

export type KdsTicket = {
  id: string;
  tableId: string;
  tableName: string;
  customer: string;
  commandNumber: number;
  sentAt: string;
  status: KdsStatus;
  items: PosTable["items"];
};

const activeStatuses: OrderItemStatus[] = ["sent", "preparing", "ready"];

export function kdsTicketStatus(items: PosTable["items"]): KdsStatus {
  if (items.some((item) => item.status === "sent")) return "new";
  if (items.some((item) => item.status === "preparing")) return "preparing";
  return "ready";
}

export function buildKdsTickets(
  tables: PosTable[],
  station: Exclude<ProductStation, "direct">,
) {
  const grouped = new Map<string, KdsTicket>();
  for (const table of tables.filter((item) => item.openedAt)) {
    for (const item of table.items.filter((product) => product.station === station && activeStatuses.includes(product.status))) {
      const commandId = item.commandId ?? `legacy-${table.id}-${item.commandNumber ?? 1}`;
      const id = `${station}-${commandId}`;
      const existing = grouped.get(id);
      if (existing) {
        existing.items.push(item);
        existing.status = kdsTicketStatus(existing.items);
        continue;
      }
      grouped.set(id, {
        id,
        tableId: table.id,
        tableName: table.quickType ? `Venta rápida · ${table.quickType}` : table.orderName || table.name,
        customer: table.customer && table.customer !== "Venta rápida" ? table.customer : "",
        commandNumber: item.commandNumber ?? 1,
        sentAt: item.sentAt ?? table.openedAt ?? new Date().toISOString(),
        status: kdsTicketStatus([item]),
        items: [item],
      });
    }
  }
  return [...grouped.values()].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
}
