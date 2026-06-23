"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChefHat, Clock, Flame, RefreshCw } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import {
  posStateEvent,
  readPosTables,
  writePosTables,
} from "@/lib/pos-shared";
import type { OrderItemStatus, PosTable } from "@/lib/pos-shared";

type KitchenTicket = {
  tableId: string;
  tableName: string;
  openedAt: string;
  items: PosTable["items"];
};

const kitchenStatuses: OrderItemStatus[] = ["sent", "preparing", "ready"];

function ticketTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusCopy(status: OrderItemStatus) {
  if (status === "sent") return "En cocina";
  if (status === "preparing") return "Preparando";
  if (status === "ready") return "Listo";
  return "Pendiente";
}

function statusClasses(status: OrderItemStatus) {
  if (status === "sent") return "border-sky-200 bg-sky-50 text-sky-800";
  if (status === "preparing") return "border-indigo-200 bg-indigo-50 text-indigo-800";
  if (status === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export function KitchenClient() {
  const [tables, setTables] = useState<PosTable[]>([]);
  const [toast, setToast] = useState("");

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
        tableName: table.name,
        openedAt: table.openedAt ?? new Date().toISOString(),
        items: table.items.filter((item) => kitchenStatuses.includes(item.status)),
      }))
      .filter((ticket) => ticket.items.length > 0);
  }, [tables]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function updateItemStatus(tableId: string, lineId: string, status: OrderItemStatus) {
    const next = tables.map((table) =>
      table.id === tableId
        ? {
            ...table,
            items: table.items.map((item) =>
              item.lineId === lineId
                ? { ...item, status, updatedAt: new Date().toISOString() }
                : item,
            ),
          }
        : table,
    );

    setTables(next);
    writePosTables(next);
    showToast(status === "ready" ? "Producto listo para servir" : "Producto en preparacion");
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
        eyebrow="KDS"
        title="Cocina"
        description="Comandas activas para preparar y marcar listas desde tablet."
        actions={
          <button
            type="button"
            onClick={() => setTables(readPosTables())}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 text-base font-semibold text-stone-900 shadow-sm transition hover:bg-stone-50"
          >
            <RefreshCw size={22} />
            Actualizar
          </button>
        }
      />

      {tickets.length ? (
        <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {tickets.map((ticket) => (
            <article
              key={ticket.tableId}
              className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-stone-500">Mesa</p>
                  <h2 className="mt-1 text-4xl font-semibold text-stone-950">{ticket.tableName}</h2>
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
                        <p className="text-2xl font-semibold text-stone-950">
                          {item.quantity}x {item.name}
                        </p>
                        <span className={["mt-3 inline-flex h-9 items-center rounded-full border px-3 text-sm font-semibold", statusClasses(item.status)].join(" ")}>
                          {statusCopy(item.status)}
                        </span>
                      </div>
                      <ChefHat className="text-stone-400" size={32} />
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {item.status === "sent" ? (
                        <button
                          type="button"
                          onClick={() => updateItemStatus(ticket.tableId, item.lineId, "preparing")}
                          className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl bg-stone-950 text-lg font-semibold text-white transition hover:bg-stone-800"
                        >
                          <Flame size={22} />
                          Preparando
                        </button>
                      ) : null}
                      {item.status === "preparing" ? (
                        <button
                          type="button"
                          onClick={() => updateItemStatus(ticket.tableId, item.lineId, "ready")}
                          className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-lg font-semibold text-white transition hover:bg-emerald-700"
                        >
                          <CheckCircle2 size={22} />
                          Listo
                        </button>
                      ) : null}
                      {item.status === "ready" ? (
                        <div className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 text-lg font-semibold text-emerald-800 sm:col-span-2">
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
        <section className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <ChefHat className="mx-auto text-stone-400" size={48} />
          <h2 className="mt-5 text-3xl font-semibold text-stone-950">Sin comandas activas</h2>
          <p className="mt-3 text-base font-semibold text-stone-500">
            Las ordenes enviadas desde POS apareceran aqui.
          </p>
        </section>
      )}
    </div>
  );
}
