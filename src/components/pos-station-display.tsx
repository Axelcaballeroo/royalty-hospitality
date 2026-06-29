"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChefHat, Clock, Coffee, Flame, RefreshCw } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { makeAuditEvent, posStateEvent, readPosTables, writePosTables } from "@/lib/pos-shared";
import type { OrderItemStatus, PosTable, ProductStation } from "@/lib/pos-shared";

type KitchenTicket = {
  tableId: string;
  tableName: string;
  isQuickSale: boolean;
  openedAt: string;
  items: PosTable["items"];
};

const activeStatuses: OrderItemStatus[] = ["sent", "preparing", "ready"];

function ticketTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusClasses(status: OrderItemStatus) {
  if (status === "sent") return "border-sky-200 bg-sky-50 text-sky-800";
  if (status === "preparing") return "border-indigo-200 bg-indigo-50 text-indigo-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

export function PosStationDisplay({ station }: { station: Exclude<ProductStation, "direct"> }) {
  const [tables, setTables] = useState<PosTable[]>([]);
  const [toast, setToast] = useState("");
  const isKitchen = station === "kitchen";
  const title = isKitchen ? "Cocina" : "Barra";

  useEffect(() => {
    const syncTables = () => setTables(readPosTables());
    syncTables();
    const interval = window.setInterval(syncTables, 1000);
    window.addEventListener("storage", syncTables);
    window.addEventListener(posStateEvent, syncTables);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", syncTables);
      window.removeEventListener(posStateEvent, syncTables);
    };
  }, []);

  const tickets = useMemo<KitchenTicket[]>(() => {
    return tables
      .filter((table) => table.openedAt)
      .map((table) => ({
        tableId: table.id,
        tableName: table.quickType ? `Venta rápida · ${table.quickType}` : table.name,
        isQuickSale: Boolean(table.quickType),
        openedAt: table.openedAt ?? new Date().toISOString(),
        items: table.items.filter(
          (item) => item.station === station && activeStatuses.includes(item.status),
        ),
      }))
      .filter((ticket) => ticket.items.length > 0);
  }, [station, tables]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function updateItemStatus(tableId: string, lineId: string, status: OrderItemStatus) {
    const product = tables.find((table) => table.id === tableId)?.items.find((item) => item.lineId === lineId);
    const event = makeAuditEvent(
      status === "ready" ? "product_ready" : "product_preparing",
      `${product?.name ?? "Producto"}: ${status === "ready" ? "listo" : "preparando"}`,
      title,
    );
    const next = tables.map((table) =>
      table.id === tableId
        ? {
            ...table,
            items: table.items.map((item) =>
              item.lineId === lineId
                ? { ...item, status, updatedAt: new Date().toISOString() }
                : item,
            ),
            history: [...(table.history ?? []), event],
          }
        : table,
    );
    setTables(next);
    writePosTables(next);
    showToast(status === "ready" ? "Producto listo" : "Producto en preparación");
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
        eyebrow="Comandas"
        title={title}
        description={`Productos enviados a ${title.toLocaleLowerCase("es-MX")} y listos para trabajar desde tablet.`}
        actions={
          <>
            <Link href="/app/pos" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 text-base font-semibold text-stone-900">
              <ArrowLeft size={21} />
              Volver al POS
            </Link>
            <button type="button" onClick={() => setTables(readPosTables())} className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-base font-semibold text-white">
              <RefreshCw size={21} />
              Actualizar
            </button>
          </>
        }
      />

      {tickets.length ? (
        <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {tickets.map((ticket) => (
            <article key={ticket.tableId} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-stone-500">{ticket.isQuickSale ? "Orden" : "Mesa"}</p>
                  <h2 className="mt-1 text-3xl font-semibold text-stone-950">{ticket.tableName}</h2>
                </div>
                <span className="inline-flex h-12 items-center gap-2 rounded-2xl bg-stone-100 px-4 text-base font-semibold text-stone-800">
                  <Clock size={20} />
                  {ticketTime(ticket.openedAt)}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {ticket.items.map((item) => (
                  <div key={item.lineId} className="rounded-3xl bg-stone-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-2xl font-semibold text-stone-950">{item.quantity}x {item.name}</p>
                        <span className={["mt-3 inline-flex h-9 items-center rounded-full border px-3 text-sm font-semibold", statusClasses(item.status)].join(" ")}>
                          {item.status === "sent" ? `En ${title.toLocaleLowerCase("es-MX")}` : item.status === "preparing" ? "Preparando" : "Listo"}
                        </span>
                      </div>
                      {isKitchen ? <ChefHat className="text-stone-400" size={32} /> : <Coffee className="text-stone-400" size={32} />}
                    </div>

                    <div className="mt-5">
                      {item.status === "sent" ? (
                        <button type="button" onClick={() => updateItemStatus(ticket.tableId, item.lineId, "preparing")} className="inline-flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 text-lg font-semibold text-white">
                          <Flame size={22} />
                          Preparando
                        </button>
                      ) : null}
                      {item.status === "preparing" ? (
                        <button type="button" onClick={() => updateItemStatus(ticket.tableId, item.lineId, "ready")} className="inline-flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-lg font-semibold text-white">
                          <CheckCircle2 size={22} />
                          Listo
                        </button>
                      ) : null}
                      {item.status === "ready" ? (
                        <div className="inline-flex h-16 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 text-lg font-semibold text-emerald-800">
                          <CheckCircle2 size={22} />
                          Esperando servicio
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center">
          {isKitchen ? <ChefHat className="mx-auto text-stone-300" size={54} /> : <Coffee className="mx-auto text-stone-300" size={54} />}
          <h2 className="mt-4 text-2xl font-semibold text-stone-950">Sin comandas pendientes</h2>
          <p className="mt-2 text-base font-medium text-stone-500">Las nuevas partidas aparecerán aquí al enviar la comanda.</p>
        </div>
      )}
    </div>
  );
}
