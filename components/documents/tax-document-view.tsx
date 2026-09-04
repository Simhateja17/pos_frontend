'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { TaxDocument } from '@/lib/api/authenticated-client'
import { useAppRegion } from '@/lib/app-region'
import styles from './tax-document-view.module.css'

type DocumentMode = 'a4' | 'thermal80' | 'thermal58'

function formatDocumentMoney(value: string, formatMoney: (value: string | number) => string): string {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? formatMoney(parsed) : value
}

function text(value: string | null | undefined, fallback = 'Not provided'): string {
  return value?.trim() || fallback
}

function dateTime(value: string, locale: string, timeZone?: string): string {
  return new Date(value).toLocaleString(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...(timeZone ? { timeZone } : {}),
  })
}

function paymentLabel(method: string): string {
  return method === 'upi' ? 'UPI' : method.charAt(0).toUpperCase() + method.slice(1)
}

function partyAddress(party: TaxDocument['seller']): string {
  return [party.addressLine1, party.addressLine2, party.city, party.state, party.postalCode]
    .filter(Boolean)
    .join(', ')
}

function Party({ label, party }: { label: string; party: TaxDocument['seller'] | null }) {
  if (!party) {
    return (
      <div className={styles.party}>
        <p className={styles.partyLabel}>{label}</p>
        <p className={styles.partyName}>Walk-in customer</p>
        <p>Buyer details were not captured on this sale.</p>
      </div>
    )
  }

  return (
    <div className={styles.party}>
      <p className={styles.partyLabel}>{label}</p>
      <p className={styles.partyName}>{text(party.tradeName ?? party.legalName)}</p>
      {party.tradeName && party.legalName && party.tradeName !== party.legalName ? <p>{party.legalName}</p> : null}
      <p>{text(partyAddress(party))}</p>
      <p>
        <strong>GSTIN:</strong> {text(party.gstin)}
      </p>
      {party.pan ? (
        <p>
          <strong>PAN:</strong> {party.pan}
        </p>
      ) : null}
      {party.phone || party.email ? <p>{[party.phone, party.email].filter(Boolean).join(' · ')}</p> : null}
    </div>
  )
}

function TotalRow({ label, value, grand = false, formatMoney }: { label: string; value: string; grand?: boolean; formatMoney: (value: string) => string }) {
  return (
    <div className={`${styles.totalRow} ${grand ? styles.grand : ''}`}>
      <span>{label}</span>
      <strong>{formatMoney(value)}</strong>
    </div>
  )
}

export function TaxDocumentView({ document, initialMode = 'a4' }: { document: TaxDocument; initialMode?: DocumentMode }) {
  const { money: formatMoney, pack } = useAppRegion()
  const money = (value: string) => formatDocumentMoney(value, formatMoney)
  const [mode, setMode] = useState<DocumentMode>(initialMode)
  const isCreditNote = document.documentType === 'credit_note'

  return (
    <div className={styles.printRoot}>
      <div className={styles.controls} aria-label="Document actions">
        <button className="btn btn-sm" type="button" onClick={() => setMode('a4')} aria-pressed={mode === 'a4'}>
          A4 view
        </button>
        <button className="btn btn-sm" type="button" onClick={() => setMode('thermal80')} aria-pressed={mode === 'thermal80'}>
          80mm view
        </button>
        <button className="btn btn-sm" type="button" onClick={() => setMode('thermal58')} aria-pressed={mode === 'thermal58'}>
          58mm view
        </button>
        <button className="btn btn-pri btn-sm" type="button" onClick={() => window.print()}>
          Print / Save PDF
        </button>
      </div>

      <article className={`${styles.document} ${mode === 'a4' ? styles.a4 : `${styles.thermal} ${mode === 'thermal58' ? styles.thermal58 : styles.thermal80}`}`}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <div>
              <p className={styles.eyebrow}>{isCreditNote ? 'GST credit note' : 'GST tax invoice'}</p>
              <h1 className={styles.title}>{isCreditNote ? 'Credit Note' : 'Tax Invoice'}</h1>
              <p className={styles.documentNumber}>{document.documentNumber}</p>
            </div>
            <div className={styles.meta}>
              <span>
                <b>Document date</b><br />{dateTime(document.documentDate, pack.locale, pack.timeZone)}
              </span>
              <span>
                <b>Financial year</b><br />{document.financialYear}
              </span>
              <span>
                <b>Place of supply</b><br />{text(document.placeOfSupply.state)} {document.placeOfSupply.stateCode ? `(${document.placeOfSupply.stateCode})` : ''}
              </span>
              <span>
                <b>Tax treatment</b><br />{document.placeOfSupply.isInterState ? 'Interstate · IGST' : 'Intrastate · CGST + SGST'}
              </span>
            </div>
          </div>
          {isCreditNote ? (
            <div className={styles.notice}>
              This credit note reverses only the returned quantity. Original Tax Invoice:{' '}
              {document.originalDocumentId ? (
                <Link href={`/app/documents/${document.originalDocumentId}`}>{text(document.originalDocumentNumber, document.originalDocumentId)}</Link>
              ) : (
                text(document.originalDocumentNumber)
              )}
            </div>
          ) : null}
        </header>

        <section className={styles.parties} aria-label="Tax Invoice parties">
          <Party label="Supplier" party={document.seller} />
          <Party label="Bill to / recipient" party={document.buyer} />
        </section>

        <div className={styles.tableWrap}>
          {mode === 'a4' ? (
            <table className={styles.lines}>
              <thead>
                <tr>
                  <th>HSN/SAC</th>
                  <th>Description</th>
                  <th>Qty / UQC</th>
                  <th>Unit price</th>
                  <th>Taxable</th>
                  <th>GST</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>IGST</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {document.lines.map((line, index) => (
                  <tr key={`${line.saleLineItemId ?? 'line'}-${line.originalLineId ?? index}`}>
                    <td>{text(line.hsnSac)}</td>
                    <td className={styles.lineDescription}>
                      <strong>{line.description}</strong>
                      <small>{line.sku ? `SKU ${line.sku}` : 'SKU not provided'}</small>
                    </td>
                    <td>{line.quantity} / {line.unit}</td>
                    <td>{money(line.unitPrice)}</td>
                    <td>{money(line.taxableValue)}</td>
                    <td>{line.gstRate}%</td>
                    <td>{money(line.cgstAmount)}</td>
                    <td>{money(line.sgstAmount)}</td>
                    <td>{money(line.igstAmount)}</td>
                    <td>{money(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className={styles.lines}>
              <thead>
                <tr><th>Item / tax detail</th><th>Qty</th><th>Total</th></tr>
              </thead>
              <tbody>
                {document.lines.map((line, index) => (
                  <tr key={`${line.saleLineItemId ?? 'line'}-${line.originalLineId ?? index}`}>
                    <td className={styles.lineDescription}>
                      <strong>{line.description}</strong>
                      <small>{text(line.hsnSac, 'HSN/SAC not provided')} · {line.sku ? `SKU ${line.sku}` : 'SKU not provided'}</small>
                      <small>@ {money(line.unitPrice)} · Taxable {money(line.taxableValue)} · GST {line.gstRate}%</small>
                      <small>CGST {money(line.cgstAmount)} · SGST {money(line.sgstAmount)} · IGST {money(line.igstAmount)}</small>
                    </td>
                    <td>{line.quantity} {line.unit}</td>
                    <td>{money(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <section className={styles.summaryGrid}>
          <div className={styles.paymentBox}>
            <p className={styles.summaryLabel}>Payment mode</p>
            {document.payments.length === 0 ? <p className={styles.payment}>No payment snapshot</p> : null}
            {document.payments.map((payment, index) => (
              <div className={styles.payment} key={`${payment.method}-${index}`}>
                <span>{paymentLabel(payment.method)}{payment.direction === 'refund' ? ' refund' : ''}</span>
                <span>{money(payment.amount)}{payment.referenceCode ? ` · ${payment.referenceCode}` : ''}</span>
              </div>
            ))}
          </div>
          <div className={styles.totals}>
            <p className={styles.summaryLabel}>Tax summary</p>
            <TotalRow label="Subtotal" value={document.subtotal} formatMoney={money} />
            <TotalRow label="Discount" value={document.discountTotal} formatMoney={money} />
            <TotalRow label="Taxable value" value={document.taxableTotal} formatMoney={money} />
            <TotalRow label="CGST" value={document.cgstTotal} formatMoney={money} />
            <TotalRow label="SGST" value={document.sgstTotal} formatMoney={money} />
            <TotalRow label="IGST" value={document.igstTotal} formatMoney={money} />
            <TotalRow label="Cess" value={document.cessTotal} formatMoney={money} />
            <TotalRow label="Rounding" value={document.roundingAmount} formatMoney={money} />
            <TotalRow label={isCreditNote ? 'Credit note total' : 'Grand total'} value={document.grandTotal} grand formatMoney={money} />
          </div>
        </section>

        <footer className={styles.footer}>
          Document ID {document.id}. This printable view is generated only from the immutable tax-document snapshot; missing GST, HSN, customer, or address fields are shown as not provided.
        </footer>
      </article>
    </div>
  )
}
