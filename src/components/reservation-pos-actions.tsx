"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, X } from "lucide-react";
import { updateReservationStatusAction } from "@/app/app/actions";
import { prepareReservationPosCheckIn } from "@/app/app/reservas/pos-actions";
import {
  currentPosUser,
  demoStaff,
  makeAuditEvent,
  posReservationLinksEvent,
  posStateEvent,
  readPosTables,
  readReservationPosLinks,
  writePosTables,
  writeReservationPosLinks,
} from "@/lib/pos-shared";
import type { ReservationPosLink, StaffMember } from "@/lib/pos-shared";

type ReservationInput = {
  id: string;
  status: string;
  customerId: string;
  customerName: string;
  phone?: string;
  partySize: number;
  tableName: string;
  notes?: string;
  specialRequest?: string;
};

export function ReservationPosActions({ reservation, returnTo }: { reservation: ReservationInput; returnTo: string }) {
  const [tables, setTables] = useState(() => readPosTables());
  const [links, setLinks] = useState<ReservationPosLink[]>(() => readReservationPosLinks());
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [tableId, setTableId] = useState("");
  const [waiterId, setWaiterId] = useState(demoStaff.find((staff) => staff.role === "waiter")?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const sync = () => { setTables(readPosTables()); setLinks(readReservationPosLinks()); };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(posStateEvent, sync);
    window.addEventListener(posReservationLinksEvent, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(posStateEvent, sync);
      window.removeEventListener(posReservationLinksEvent, sync);
    };
  }, []);

  const link = links.find((item) => item.reservationId === reservation.id);
  const freeTables = useMemo(() => tables.filter((table) => !table.openedAt && !table.quickType), [tables]);
  const waiters = demoStaff.filter((staff) => staff.active && staff.role === "waiter");

  function openModal() {
    const suggested = freeTables.find((table) => table.name === reservation.tableName) ?? freeTables[0];
    setTableId(suggested?.id ?? "");
    setError("");
    setShowCheckIn(true);
  }

  async function openPosAccount() {
    if (saving || link?.status === "arrived") return;
    const currentTables = readPosTables();
    const duplicate = currentTables.find((table) => table.reservationId === reservation.id && table.openedAt);
    if (duplicate) {
      window.location.assign(`/app/pos?reservationId=${reservation.id}`);
      return;
    }
    const table = currentTables.find((item) => item.id === tableId && !item.openedAt);
    const waiter = waiters.find((item) => item.id === waiterId);
    if (!table || !waiter) {
      setError("Selecciona una mesa libre y un mesero.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await prepareReservationPosCheckIn({
        reservationId: reservation.id,
        customerId: reservation.customerId,
        customerName: reservation.customerName,
        phone: reservation.phone,
        tableName: table.name,
        waiterName: waiter.name,
      });
      const latestTables = readPosTables();
      const existingOrder = latestTables.find((item) => item.reservationId === reservation.id && item.openedAt);
      if (existingOrder) {
        window.location.assign(`/app/pos?reservationId=${reservation.id}`);
        return;
      }
      if (!latestTables.some((item) => item.id === table.id && !item.openedAt)) {
        throw new Error("Esa mesa acaba de ocuparse. Selecciona otra mesa.");
      }
      const now = new Date().toISOString();
      const reservationNotes = [reservation.specialRequest, reservation.notes].filter(Boolean).join(" · ");
      const history = [
        makeAuditEvent("reservation_arrived", `Reserva marcada como llegó: ${reservation.customerName}`),
        makeAuditEvent("reservation_pos_opened", "Cuenta POS abierta desde reserva"),
        makeAuditEvent("reservation_table_assigned", `Mesa asignada: ${table.name}`),
        makeAuditEvent("reservation_waiter_assigned", `Mesero asignado: ${waiter.name}`),
      ];
      writePosTables(latestTables.map((item) => item.id === table.id ? {
        ...item,
        customer: reservation.customerName,
        people: reservation.partySize,
        openedAt: now,
        items: [],
        discount: null,
        courtesy: null,
        readyToPay: false,
        waiter,
        openedBy: currentPosUser,
        history,
        reservationId: reservation.id,
        customerId: result.customerId,
        orderSource: "reservation" as const,
        reservationNotes,
      } : item));
      const nextLink: ReservationPosLink = {
        reservationId: reservation.id,
        customerId: result.customerId,
        tableId: table.id,
        waiterId: waiter.id,
        posOrderId: table.id,
        status: "arrived",
        notes: reservationNotes || undefined,
        openedAt: now,
      };
      writeReservationPosLinks([...links.filter((item) => item.reservationId !== reservation.id), nextLink]);
      window.location.assign(`/app/pos?reservationId=${reservation.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo abrir la cuenta.");
      setSaving(false);
    }
  }

  const active = ["pending", "confirmed"].includes(reservation.status);
  return <>
    <div className="flex flex-wrap gap-2">
      {reservation.status === "pending" ? <StatusForm reservation={reservation} returnTo={returnTo} status="confirmed" label="Confirmar" /> : null}
      {active && !link ? <button type="button" onClick={openModal} className="h-11 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white">Llegó</button> : null}
      {active && !link ? <button type="button" onClick={openModal} className="h-11 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-900">Abrir en POS</button> : null}
      {active && !link ? <StatusForm reservation={reservation} returnTo={returnTo} status="cancelled" label="Cancelar" danger /> : null}
      {link ? <Link href={`/app/pos?reservationId=${reservation.id}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white"><ExternalLink size={17} /> {link.status === "completed" ? "Ver venta" : "Ver cuenta"}</Link> : null}
      {link?.status === "arrived" ? <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-50 px-4 text-sm font-semibold text-emerald-800"><CheckCircle2 size={17} /> Llegó</span> : null}
    </div>

    {showCheckIn ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/65 p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-stone-500">Check-in de reserva</p><h2 className="mt-1 text-2xl font-semibold text-stone-950">Abrir cuenta</h2></div><button type="button" onClick={() => setShowCheckIn(false)} className="grid size-11 place-items-center rounded-full border border-stone-200" aria-label="Cerrar"><X size={20} /></button></div>
        <div className="mt-5 grid gap-3 rounded-2xl bg-stone-50 p-4 sm:grid-cols-2"><div><p className="text-sm font-semibold text-stone-500">Cliente</p><p className="mt-1 text-xl font-semibold text-stone-950">{reservation.customerName}</p></div><div><p className="text-sm font-semibold text-stone-500">Personas</p><p className="mt-1 text-xl font-semibold text-stone-950">{reservation.partySize}</p></div></div>
        <div className="mt-5 space-y-4"><label className="block text-base font-semibold text-stone-700">Mesa<select value={tableId} onChange={(event) => setTableId(event.target.value)} className="mt-2 h-16 w-full rounded-2xl border border-stone-200 bg-white px-4 text-lg"><option value="">Selecciona mesa</option>{freeTables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select></label><label className="block text-base font-semibold text-stone-700">Mesero<select value={waiterId} onChange={(event) => setWaiterId(event.target.value)} className="mt-2 h-16 w-full rounded-2xl border border-stone-200 bg-white px-4 text-lg">{waiters.map((waiter: StaffMember) => <option key={waiter.id} value={waiter.id}>{waiter.name}</option>)}</select></label></div>
        {reservationNotes(reservation) ? <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">{reservationNotes(reservation)}</p> : null}
        {error ? <p className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</p> : null}
        <button type="button" disabled={saving || !tableId || !waiterId} onClick={openPosAccount} className="mt-5 h-16 w-full rounded-3xl bg-stone-950 text-lg font-semibold text-white disabled:bg-stone-300">{saving ? "Abriendo cuenta..." : "Abrir cuenta"}</button>
      </div>
    </div> : null}
  </>;
}

function StatusForm({ reservation, returnTo, status, label, danger = false }: { reservation: ReservationInput; returnTo: string; status: string; label: string; danger?: boolean }) {
  return <form action={updateReservationStatusAction}><input type="hidden" name="reservation_id" value={reservation.id} /><input type="hidden" name="customer_id" value={reservation.customerId} /><input type="hidden" name="status" value={status} /><input type="hidden" name="return_to" value={returnTo} /><button className={["h-11 rounded-xl border px-4 text-sm font-semibold", danger ? "border-rose-200 bg-white text-rose-700" : "border-stone-200 bg-white text-stone-800"].join(" ")}>{label}</button></form>;
}

function reservationNotes(reservation: ReservationInput) {
  return [reservation.specialRequest, reservation.notes].filter(Boolean).join(" · ");
}
