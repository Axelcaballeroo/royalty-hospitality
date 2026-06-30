"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChefHat, Clock, Coffee, Flame } from "lucide-react";
import { makeAuditEvent, posStateEvent, readPosTables, writePosTables } from "@/lib/pos-shared";
import type { OrderItemStatus, PosTable, ProductStation } from "@/lib/pos-shared";
import { buildKdsTickets } from "@/lib/pos-kds";
import type { KdsStatus, KdsTicket } from "@/lib/pos-kds";
import { RelativeTime, relativeMinutes, useMinuteNow } from "@/components/relative-time";

type KdsFilter = "all" | KdsStatus;

function ageClasses(minutes: number) {
  if (minutes >= 30) return "border-rose-400 bg-rose-50 text-rose-800";
  if (minutes >= 15) return "border-amber-400 bg-amber-50 text-amber-900";
  return "border-stone-200 bg-white text-stone-800";
}

function cardClasses(status: KdsStatus) {
  if (status === "new") return "border-amber-300";
  if (status === "preparing") return "border-sky-400";
  return "border-emerald-400";
}

function statusLabel(status: KdsStatus) {
  if (status === "new") return "Nueva";
  if (status === "preparing") return "Preparando";
  return "Lista";
}

function playNewTicketSound() {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    gain.gain.setValueAtTime(0.12, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
    oscillator.addEventListener("ended", () => void context.close(), { once: true });
  } catch {
    // Browsers may block sound until the display has received a touch.
  }
}

export function PosStationDisplay({ station }: { station: Exclude<ProductStation, "direct"> }) {
  const minuteNow = useMinuteNow();
  const [tables, setTables] = useState<PosTable[]>([]);
  const [filter, setFilter] = useState<KdsFilter>("all");
  const [toast, setToast] = useState("");
  const knownTickets = useRef(new Set<string>());
  const initialized = useRef(false);
  const isKitchen = station === "kitchen";
  const stationName = isKitchen ? "Cocina" : "Barra";

  useEffect(() => {
    const sync = () => setTables(readPosTables());
    sync();
    const interval = window.setInterval(sync, 1000);
    window.addEventListener("storage", sync);
    window.addEventListener(posStateEvent, sync);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", sync);
      window.removeEventListener(posStateEvent, sync);
    };
  }, []);

  const tickets = useMemo<KdsTicket[]>(() => {
    return buildKdsTickets(tables, station);
  }, [station, tables]);

  useEffect(() => {
    const ids = tickets.map((ticket) => ticket.id);
    if (!initialized.current) {
      ids.forEach((id) => knownTickets.current.add(id));
      initialized.current = true;
      return;
    }
    const hasNew = ids.some((id) => !knownTickets.current.has(id));
    ids.forEach((id) => knownTickets.current.add(id));
    if (hasNew) playNewTicketSound();
  }, [tickets]);

  const visibleTickets = filter === "all" ? tickets : tickets.filter((ticket) => ticket.status === filter);
  const pending = tickets.filter((ticket) => ticket.status !== "ready").length;
  const ready = tickets.filter((ticket) => ticket.status === "ready").length;
  const ticketAges = tickets
    .map((ticket) => relativeMinutes(ticket.sentAt, minuteNow))
    .filter((age): age is number => age !== null);
  const average = ticketAges.length
    ? Math.round(ticketAges.reduce((sum, age) => sum + age, 0) / ticketAges.length)
    : null;

  function advance(ticket: KdsTicket) {
    const nextStatus: OrderItemStatus = ticket.status === "new" ? "preparing" : ticket.status === "preparing" ? "ready" : "served";
    const lineIds = new Set(ticket.items.map((item) => item.lineId));
    const event = makeAuditEvent(
      nextStatus === "preparing" ? "command_preparing" : nextStatus === "ready" ? "command_ready" : "command_delivered",
      `Comanda #${ticket.commandNumber}: ${nextStatus === "preparing" ? "preparando" : nextStatus === "ready" ? "lista" : "entregada"}`,
      stationName,
    );
    const next = tables.map((table) => table.id === ticket.tableId ? {
      ...table,
      items: table.items.map((item) => lineIds.has(item.lineId) ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() } : item),
      history: [...(table.history ?? []), event],
    } : table);
    setTables(next);
    writePosTables(next);
    setToast(nextStatus === "preparing" ? "Comanda en preparación" : nextStatus === "ready" ? "Comanda lista" : "Comanda entregada");
    window.setTimeout(() => setToast(""), 2200);
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] space-y-6 bg-stone-100 p-1 sm:p-3">
      {toast ? <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-2xl bg-emerald-700 px-6 py-4 text-lg font-semibold text-white shadow-xl"><CheckCircle2 size={24} />{toast}</div> : null}

      <header className="rounded-lg bg-stone-950 px-5 py-5 text-white sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {isKitchen ? <ChefHat size={42} /> : <Coffee size={42} />}
            <div><p className="text-lg font-semibold text-stone-300">Kitchen Display</p><h1 className="text-4xl font-semibold">Estación {stationName}</h1></div>
          </div>
          <Link href="/app/pos" className="inline-flex h-14 items-center gap-2 rounded-lg border border-stone-600 px-5 text-lg font-semibold"><ArrowLeft size={22} /> POS</Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KdsMetric label="Comandas activas" value={tickets.length} />
          <KdsMetric label="Tiempo promedio" value={average === null ? "--" : `${average} min`} />
          <KdsMetric label="Pendientes" value={pending} />
          <KdsMetric label="Listas" value={ready} />
        </div>
      </header>

      <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Filtrar comandas">
        {(["all", "new", "preparing", "ready"] as KdsFilter[]).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={["h-16 rounded-lg border text-xl font-semibold", filter === value ? "border-stone-950 bg-stone-950 text-white" : "border-stone-300 bg-white text-stone-800"].join(" ")}>{value === "all" ? "Todas" : value === "new" ? "Nuevas" : value === "preparing" ? "Preparando" : "Listas"}</button>)}
      </nav>

      {visibleTickets.length ? <section className="grid items-start gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {visibleTickets.map((ticket) => {
          const age = relativeMinutes(ticket.sentAt, minuteNow);
          const notes = ticket.items.filter((item) => item.notes).map((item) => `${item.name}: ${item.notes}`);
          return <article key={ticket.id} className={["overflow-hidden rounded-lg border-4 bg-white shadow-sm", cardClasses(ticket.status)].join(" ")}>
            <div className="border-b-2 border-stone-200 p-5">
              <div className="flex items-start justify-between gap-4"><div><p className="text-lg font-semibold text-stone-500">COMANDA #{ticket.commandNumber}</p><h2 className="mt-1 text-4xl font-semibold text-stone-950">{ticket.tableName}</h2>{ticket.customer ? <p className="mt-2 text-2xl font-semibold text-stone-700">{ticket.customer}</p> : null}</div><span className={["inline-flex min-h-14 items-center gap-2 rounded-lg border-2 px-4 text-xl font-semibold", ageClasses(age ?? 0)].join(" ")}><Clock size={24} /><RelativeTime from={ticket.sentAt} now={minuteNow} /></span></div>
              <div className="mt-4 flex items-center justify-between text-xl font-semibold"><span>{new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date(ticket.sentAt))}</span><span>{statusLabel(ticket.status)}</span></div>
            </div>
            <div className="space-y-4 p-5">{ticket.items.map((item) => <p key={item.lineId} className="text-3xl font-semibold text-stone-950">{item.quantity}x {item.name}</p>)}</div>
            {notes.length ? <div className="border-y-2 border-amber-300 bg-amber-50 p-5"><p className="text-lg font-semibold text-amber-800">Notas</p>{notes.map((note) => <p key={note} className="mt-1 text-xl font-semibold text-stone-950">{note}</p>)}</div> : null}
            <div className="p-5"><button type="button" onClick={() => advance(ticket)} className={["inline-flex h-20 w-full items-center justify-center gap-3 rounded-lg text-2xl font-semibold text-white", ticket.status === "new" ? "bg-sky-700" : ticket.status === "preparing" ? "bg-emerald-700" : "bg-stone-950"].join(" ")}>{ticket.status === "new" ? <Flame size={28} /> : <CheckCircle2 size={28} />}{ticket.status === "new" ? "Preparando" : ticket.status === "preparing" ? "Listo" : "Entregada"}</button></div>
          </article>;
        })}
      </section> : <div className="rounded-lg border-2 border-dashed border-stone-300 bg-white p-14 text-center"><h2 className="text-3xl font-semibold text-stone-950">Sin comandas en esta vista</h2><p className="mt-2 text-xl font-semibold text-stone-500">Las nuevas comandas aparecerán automáticamente.</p></div>}
    </div>
  );
}

function KdsMetric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg bg-stone-800 p-4"><p className="text-base font-semibold text-stone-300">{label}</p><p className="mt-1 text-3xl font-semibold text-white">{value}</p></div>;
}
