import type { ReceiptData, ReceiptPaperWidth } from "@/lib/pos-receipt";
import styles from "./ticket-receipt.module.css";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("es-MX", {
  hour: "2-digit",
  minute: "2-digit",
});

export function TicketReceipt({
  data,
  paperWidth = "80mm",
}: {
  data: ReceiptData;
  paperWidth?: ReceiptPaperWidth;
}) {
  const footer = data.business.footerMessage?.length
    ? data.business.footerMessage
    : ["Gracias por visitarnos.", "¡Te esperamos pronto!"];
  const hasForeignPayment = data.payments.some((payment) => payment.currency === "USD" || payment.currency === "EUR");

  return (
    <article className={`${styles.receipt} thermal-receipt`} data-paper-width={paperWidth} aria-label={`Ticket ${data.folio}`}>
      <header className={styles.center}>
        <div className={styles.logo} aria-label="Logo del restaurante">LOGO</div>
        <h2 className={styles.businessName}>{data.business.name}</h2>
        {data.business.address ? <p className={styles.plain}>{data.business.address}</p> : null}
        {data.business.phone ? <p className={styles.plain}>Tel. {data.business.phone}</p> : null}
        {data.business.rfc ? <p className={styles.plain}>RFC {data.business.rfc}</p> : null}
      </header>

      <div className={styles.rule} aria-hidden="true" />

      <section>
        <p className={styles.meta}><span>Fecha</span><span>{dateFormatter.format(new Date(data.issuedAt))}</span></p>
        <p className={styles.meta}><span>Hora</span><span>{timeFormatter.format(new Date(data.issuedAt))}</span></p>
        <p className={styles.meta}><span>Folio</span><span>{data.folio}</span></p>
        <p className={styles.meta}><span>Caja</span><span>{data.cashRegister}</span></p>
        <p className={styles.meta}><span>Mesero</span><span>{data.waiter}</span></p>
        <p className={styles.meta}><span>Mesa</span><span>{data.table}</span></p>
        <p className={styles.meta}><span>Tipo</span><span>{data.orderType}</span></p>
      </section>

      <div className={styles.rule} aria-hidden="true" />

      <section>
        {data.items.map((item) => (
          <p key={item.id} className={styles.line}>
            <span className={styles.item}>{item.quantity} x {item.name}</span>
            <span className={styles.amount}>{currency.format(item.total)}</span>
          </p>
        ))}
      </section>

      <div className={styles.rule} aria-hidden="true" />

      <section className={styles.summary}>
        <p className={styles.line}><span>Subtotal</span><span>{currency.format(data.subtotal)}</span></p>
        <p className={styles.line}><span>Descuento</span><span>-{currency.format(data.discount)}</span></p>
        <p className={styles.line}><span>Cortesía</span><span>-{currency.format(data.courtesy)}</span></p>
        <p className={styles.totalLine}><span>TOTAL</span><span>{currency.format(data.total)}</span></p>
      </section>

      <div className={styles.rule} aria-hidden="true" />

      <section>
        <h3 className={styles.paymentTitle}>{data.paymentMethod}</h3>
        {data.payments.length > 1 || hasForeignPayment ? data.payments.map((payment, index) => (
          <div key={`${payment.method}-${index}`}>
            <p className={styles.paymentLine}><span>{payment.method}{payment.currency && payment.currency !== "MXN" ? ` · ${payment.currency}` : ""}</span><span>{payment.foreignAmount !== undefined && payment.currency !== "MXN" ? `${payment.foreignAmount} ${payment.currency}` : currency.format(payment.amount)}</span></p>
            {payment.currency && payment.currency !== "MXN" ? <p className={styles.paymentLine}><span>TC {payment.exchangeRate}</span><span>Equiv. {currency.format(payment.equivalentMxn ?? payment.amount)}</span></p> : null}
          </div>
        )) : <p className={styles.paymentAmount}>{currency.format(data.payments[0]?.amount ?? data.total)}</p>}
        {data.amountReceived !== undefined && !hasForeignPayment ? <p className={styles.paymentLine}><span>Recibido</span><span>{currency.format(data.amountReceived)}</span></p> : null}
        {(data.change ?? 0) > 0 ? <p className={styles.paymentLine}><span>Cambio</span><span>{currency.format(data.change ?? 0)}</span></p> : null}
      </section>

      <div className={styles.rule} aria-hidden="true" />

      <footer className={styles.center}>
        {footer.map((line) => <p key={line} className={styles.plain}>{line}</p>)}
        <div className={styles.qr} aria-label="Espacio reservado para código QR">QR</div>
      </footer>
    </article>
  );
}
