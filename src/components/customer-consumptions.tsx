"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Eye, Printer, ReceiptText, ShieldCheck, X } from "lucide-react";
import { recordCustomerTicketReprint } from "@/app/app/pos/crm-actions";
import { TicketReceipt } from "@/components/pos/ticket-receipt";
import type { PosCustomerConsumption } from "@/lib/data";
import type { ReceiptBusinessProfile, ReceiptData, ReceiptPaperWidth } from "@/lib/pos-receipt";
import { authorizePosPin } from "@/lib/pos-shared";

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateTime = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

function receiptFromConsumption(consumption: PosCustomerConsumption, business: ReceiptBusinessProfile): ReceiptData {
  return {
    business,
    folio: consumption.folio,
    issuedAt: consumption.closed_at,
    cashRegister: consumption.cash_register ?? "Caja principal",
    waiter: consumption.waiter_name ?? "Sin asignar",
    table: consumption.table_name,
    orderType: consumption.order_type,
    items: consumption.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      total: item.price * item.quantity,
    })),
    subtotal: Number(consumption.gross),
    discount: Number(consumption.discount),
    courtesy: Number(consumption.courtesy),
    total: Number(consumption.total),
    paymentMethod: consumption.payment_method,
    payments: consumption.payments,
    amountReceived: consumption.amount_received ?? undefined,
    change: consumption.change_amount ?? undefined,
  };
}

export function CustomerConsumptions({
  customerId,
  consumptions,
  business,
}: {
  customerId: string;
  consumptions: PosCustomerConsumption[];
  business: ReceiptBusinessProfile;
}) {
  const [detail, setDetail] = useState<PosCustomerConsumption | null>(null);
  const [authorization, setAuthorization] = useState<PosCustomerConsumption | null>(null);
  const [preview, setPreview] = useState<ReceiptData | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function requestReprint(consumption: PosCustomerConsumption) {
    setPin("");
    setError("");
    setAuthorization(consumption);
  }

  async function authorizeReprint() {
    if (!authorization || pending) return;
    const staff = authorizePosPin(pin, "reprint_ticket");
    if (!staff) {
      setError("PIN sin permiso para esta acción.");
      return;
    }

    setPending(true);
    try {
      await recordCustomerTicketReprint({
        saleId: authorization.sale_id,
        customerId,
        authorizedBy: staff.name,
        authorizedRole: staff.role,
      });
      setPreview(receiptFromConsumption(authorization, business));
      setAuthorization(null);
      setPin("");
    } catch {
      setError("No se pudo registrar la reimpresión.");
    } finally {
      setPending(false);
    }
  }

  if (!consumptions.length) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 px-6 py-10 text-center">
        <ReceiptText className="mx-auto text-stone-400" size={30} />
        <p className="mt-3 text-base font-semibold text-stone-900">Sin consumos registrados</p>
        <p className="mt-1 text-sm text-stone-500">Las cuentas POS vinculadas aparecerán al cerrarse.</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-stone-200">
        {consumptions.map((consumption) => (
          <article key={consumption.id} className="grid gap-4 py-5 first:pt-0 last:pb-0 lg:grid-cols-[1.2fr_0.8fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-stone-950">{consumption.table_name}</p>
                {consumption.reservation_id ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">Reserva</span> : null}
              </div>
              <p className="mt-1 text-sm text-stone-500">{dateTime.format(new Date(consumption.closed_at))} · {consumption.folio}</p>
              <p className="mt-1 text-sm text-stone-600">{consumption.waiter_name ?? "Sin mesero"} · {consumption.payment_method}</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-stone-950">{money.format(Number(consumption.total))}</p>
              <p className="mt-1 text-xs font-semibold text-stone-500">Descuento {money.format(Number(consumption.discount))} · Cortesía {money.format(Number(consumption.courtesy))}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDetail(consumption)} className="inline-flex h-12 items-center gap-2 rounded-lg border border-stone-200 px-4 text-sm font-semibold text-stone-800" title="Ver detalle">
                <Eye size={18} /> Ver detalle
              </button>
              <button type="button" onClick={() => requestReprint(consumption)} className="grid size-12 place-items-center rounded-lg bg-stone-950 text-white" aria-label={`Reimprimir ticket ${consumption.folio}`} title="Reimprimir ticket">
                <Printer size={19} />
              </button>
            </div>
          </article>
        ))}
      </div>

      {detail ? <ConsumptionDetail consumption={detail} onClose={() => setDetail(null)} onReprint={() => { setDetail(null); requestReprint(detail); }} /> : null}
      {authorization ? (
        <Modal title="Autorización requerida" onClose={() => setAuthorization(null)}>
          <div className="rounded-lg bg-amber-50 p-4 text-sm font-medium text-amber-900">
            Reimprimir el ticket {authorization.folio} requiere PIN de cajero, gerente o admin.
          </div>
          <label className="mt-5 block text-sm font-semibold text-stone-700">
            PIN
            <input autoFocus type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => { setPin(event.target.value); setError(""); }} onKeyDown={(event) => { if (event.key === "Enter") void authorizeReprint(); }} className="mt-2 h-14 w-full rounded-lg border border-stone-200 px-4 text-center text-2xl tracking-[0.35em] outline-none focus:border-stone-500" />
          </label>
          {error ? <p className="mt-3 text-sm font-semibold text-rose-700">{error}</p> : null}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setAuthorization(null)} className="h-13 rounded-lg border border-stone-200 font-semibold text-stone-800">Cancelar</button>
            <button type="button" disabled={!pin.trim() || pending} onClick={() => void authorizeReprint()} className="inline-flex h-13 items-center justify-center gap-2 rounded-lg bg-stone-950 font-semibold text-white disabled:bg-stone-300"><ShieldCheck size={19} />{pending ? "Autorizando" : "Autorizar"}</button>
          </div>
        </Modal>
      ) : null}
      {preview ? <ReceiptPreview data={preview} onClose={() => setPreview(null)} /> : null}
    </>
  );
}

function ConsumptionDetail({ consumption, onClose, onReprint }: { consumption: PosCustomerConsumption; onClose: () => void; onReprint: () => void }) {
  return (
    <Modal title={`Consumo ${consumption.folio}`} onClose={onClose} wide>
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <section>
          <p className="text-sm font-semibold text-stone-500">Productos</p>
          <div className="mt-3 divide-y divide-stone-200 border-y border-stone-200">
            {consumption.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 py-4">
                <p className="font-semibold text-stone-900">{item.quantity}x {item.name}</p>
                <p className="font-semibold text-stone-700">{money.format(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </section>
        <aside className="space-y-3 border-t border-stone-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <DetailLine label="Subtotal" value={Number(consumption.gross)} />
          <DetailLine label="Descuento" value={-Number(consumption.discount)} />
          <DetailLine label="Cortesía" value={-Number(consumption.courtesy)} />
          <div className="flex items-center justify-between border-t border-stone-300 pt-4 text-xl font-semibold"><span>Total</span><span>{money.format(Number(consumption.total))}</span></div>
          <p className="pt-2 text-sm text-stone-500">{consumption.payment_method} · {consumption.waiter_name ?? "Sin mesero"}</p>
        </aside>
      </div>
      <button type="button" onClick={onReprint} className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-lg bg-stone-950 font-semibold text-white"><Printer size={19} /> Reimprimir ticket</button>
    </Modal>
  );
}

function DetailLine({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between text-sm font-semibold text-stone-700"><span>{label}</span><span>{money.format(value)}</span></div>;
}

function ReceiptPreview({ data, onClose }: { data: ReceiptData; onClose: () => void }) {
  const [paperWidth, setPaperWidth] = useState<ReceiptPaperWidth>("80mm");

  function printReceipt() {
    const cleanup = () => document.body.classList.remove("receipt-printing");
    document.body.classList.add("receipt-printing");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 60_000);
  }

  return createPortal(
    <div className="receipt-preview-portal">
      <Modal title="Vista previa de reimpresión" onClose={onClose} wide>
        <div className="receipt-preview-controls mb-5 flex items-center justify-between gap-4">
          <div className="inline-flex rounded-lg bg-stone-100 p-1">
            {(["58mm", "80mm"] as ReceiptPaperWidth[]).map((width) => <button key={width} type="button" onClick={() => setPaperWidth(width)} className={["h-10 rounded-md px-4 text-sm font-semibold", paperWidth === width ? "bg-stone-950 text-white" : "text-stone-600"].join(" ")}>{width}</button>)}
          </div>
          <p className="text-sm font-semibold text-emerald-700">Reimpresión autorizada</p>
        </div>
        <div className="max-h-[62vh] overflow-y-auto rounded-lg bg-stone-100 py-6">
          <div className="thermal-print-root"><TicketReceipt data={data} paperWidth={paperWidth} /></div>
        </div>
        <div className="receipt-preview-controls mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="h-14 rounded-lg border border-stone-200 font-semibold text-stone-900">Cerrar</button>
          <button type="button" onClick={printReceipt} className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-stone-950 font-semibold text-white"><Printer size={20} /> Imprimir</button>
        </div>
      </Modal>
    </div>,
    document.body,
  );
}

function Modal({ title, children, onClose, wide = false }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-stone-950/65 p-4">
      <div className={["max-h-[94vh] w-full overflow-y-auto rounded-lg bg-white p-6 shadow-2xl", wide ? "max-w-4xl" : "max-w-lg"].join(" ")}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-stone-950">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full border border-stone-200" aria-label="Cerrar"><X size={20} /></button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
