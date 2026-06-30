import type { CashClosingSnapshot, CashWithdrawal } from "@/lib/pos-shared";
import type { ReceiptBusinessProfile, ReceiptPaperWidth } from "@/lib/pos-receipt";
import styles from "./ticket-receipt.module.css";

const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 2 });
const date = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
const time = new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" });

function Header({ business, title, issuedAt }: { business: ReceiptBusinessProfile; title: string; issuedAt: string }) {
  return <header className={styles.center}><div className={styles.logo}>LOGO</div><h2 className={styles.businessName}>{business.name}</h2><p className={styles.plain}>{title}</p><p className={styles.plain}>{date.format(new Date(issuedAt))} · {time.format(new Date(issuedAt))}</p></header>;
}

function Rule() {
  return <div className={styles.rule} aria-hidden="true" />;
}

function Row({ label, value }: { label: string; value: string }) {
  return <p className={styles.meta}><span>{label}</span><span>{value}</span></p>;
}

export type CashClosingReceiptData = {
  business: ReceiptBusinessProfile;
  issuedAt: string;
  shiftId: string;
  responsible: string;
  snapshot: CashClosingSnapshot;
  withdrawals: CashWithdrawal[];
  openingCash: number;
  expectedCash: number;
  countedCash: number;
  difference: number;
};

export function CashClosingReceipt({ data, paperWidth = "80mm" }: { data: CashClosingReceiptData; paperWidth?: ReceiptPaperWidth }) {
  const withdrawals = data.withdrawals.reduce((sum, item) => sum + item.amount, 0);
  return <article className={`${styles.receipt} thermal-receipt`} data-paper-width={paperWidth}>
    <Header business={data.business} title="CORTE DE CAJA" issuedAt={data.issuedAt} />
    <Rule />
    <Row label="Turno" value={data.shiftId} /><Row label="Responsable" value={data.responsible} />
    <Rule /><h3 className={styles.paymentTitle}>Resumen</h3>
    <Row label="Venta bruta" value={money.format(data.snapshot.gross)} /><Row label="Descuentos" value={money.format(data.snapshot.discounts)} /><Row label="Cortesías" value={money.format(data.snapshot.courtesies)} /><Row label="Venta neta" value={money.format(data.snapshot.net)} /><Row label="Total cobrado" value={money.format(data.snapshot.totalCollected)} /><Row label="Pendiente" value={money.format(data.snapshot.pending)} />
    <Rule /><h3 className={styles.paymentTitle}>Métodos de pago</h3>
    <Row label="Efectivo MXN" value={money.format(data.snapshot.cash)} /><Row label="Tarjeta" value={money.format(data.snapshot.card)} /><Row label="Transferencia" value={money.format(data.snapshot.transfer)} /><Row label="Mixto" value={money.format(data.snapshot.mixed)} /><Row label="USD recibido" value={`${data.snapshot.usdReceived.toFixed(2)} USD`} /><Row label="EUR recibido" value={`${data.snapshot.eurReceived.toFixed(2)} EUR`} /><Row label="Equiv. MXN" value={money.format(data.snapshot.foreignEquivalentMxn)} />
    <Rule /><h3 className={styles.paymentTitle}>Retiros</h3>
    {data.withdrawals.length ? data.withdrawals.map((item) => <div key={item.id}><Row label={time.format(new Date(item.createdAt))} value={money.format(item.amount)} /><p className={styles.plain}>{item.reason}{item.receivedBy ? ` · Recibió ${item.receivedBy}` : ""}</p><p className={styles.plain}>Autorizó {item.authorizedBy.name}</p></div>) : <p className={styles.center}>Sin retiros</p>}
    <Rule /><h3 className={styles.paymentTitle}>Efectivo</h3>
    <Row label="Caja inicial" value={money.format(data.openingCash)} /><Row label="Efectivo vendido" value={money.format(data.snapshot.cash)} /><Row label="Retiros" value={`-${money.format(withdrawals)}`} /><Row label="Esperado" value={money.format(data.expectedCash)} /><Row label="Contado" value={money.format(data.countedCash)} /><Row label="Diferencia" value={money.format(data.difference)} />
    <Rule /><h3 className={styles.paymentTitle}>Órdenes</h3>
    <Row label="Cerradas" value={String(data.snapshot.closedOrders)} /><Row label="Abiertas" value={String(data.snapshot.openOrders)} />
    <p className={styles.signature}>Entrega: __________________</p><p className={styles.signature}>Recibe: __________________</p>
  </article>;
}

export function CashWithdrawalReceipt({ business, shiftId, responsible, withdrawal, paperWidth = "80mm" }: { business: ReceiptBusinessProfile; shiftId: string; responsible: string; withdrawal: CashWithdrawal; paperWidth?: ReceiptPaperWidth }) {
  return <article className={`${styles.receipt} thermal-receipt`} data-paper-width={paperWidth}>
    <Header business={business} title="COMPROBANTE DE RETIRO" issuedAt={withdrawal.createdAt} />
    <Rule /><Row label="Caja / turno" value={shiftId} /><Row label="Responsable" value={responsible} /><Row label="Folio" value={withdrawal.id} />
    <Rule /><p className={styles.paymentAmount}>{money.format(withdrawal.amount)}</p>
    <Row label="Motivo" value={withdrawal.reason} />{withdrawal.description ? <p className={styles.plain}>{withdrawal.description}</p> : null}<Row label="Recibió" value={withdrawal.receivedBy ?? "No indicado"} /><Row label="Autorizó" value={withdrawal.authorizedBy.name} />
    <p className={styles.signature}>Firma recibió: __________________</p><p className={styles.signature}>Firma autorizó: ________________</p>
  </article>;
}
