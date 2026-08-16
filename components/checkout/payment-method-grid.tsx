'use client'

import { Banknote, CreditCard, QrCode, ReceiptText } from 'lucide-react'
import type { ReactNode } from 'react'

export type TenderMethod = 'cash' | 'card' | 'check' | 'upi'

export interface TenderRow {
  method: TenderMethod
  amount: string
  referenceCode?: string
}

const METHOD_LABELS: Record<TenderMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  check: 'Check',
  upi: 'UPI',
}

const METHOD_ICONS: Record<TenderMethod, ReactNode> = {
  cash: <Banknote size={16} strokeWidth={1.85} />,
  card: <CreditCard size={16} strokeWidth={1.85} />,
  check: <ReceiptText size={16} strokeWidth={1.85} />,
  upi: <QrCode size={16} strokeWidth={1.85} />,
}

/** These are the persisted POS tender methods. UPI records an external UPI reference; it is not a gateway capture. */
const ALL_METHODS: TenderMethod[] = ['cash', 'card', 'upi']

export function PaymentMethodGrid({
  selected,
  onToggle,
  rows,
  onRowChange,
  onAddRow,
  onRemoveRow,
  splitEnabled,
  onToggleSplit,
  disabled = false,
}: {
  selected: TenderMethod[]
  onToggle: (method: TenderMethod) => void
  rows: TenderRow[]
  onRowChange: (index: number, row: TenderRow) => void
  onAddRow: () => void
  onRemoveRow: (index: number) => void
  splitEnabled: boolean
  onToggleSplit: (enabled: boolean) => void
  disabled?: boolean
}) {
  const availableMethodsForNewRow = ALL_METHODS.filter((m) => !rows.some((r) => r.method === m))

  return (
    <div>
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 12.5, color: 'var(--muted)', cursor: 'pointer' }}
      >
        <input
          type="checkbox"
          checked={splitEnabled}
          disabled={disabled}
          onChange={(e) => onToggleSplit(e.target.checked)}
        />
        Split payment across multiple methods
      </label>

      <div className="pay-grid">
        {ALL_METHODS.map((method) => {
          const isSelected = selected.includes(method)
          return (
            <button
              key={method}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(method)}
              disabled={disabled}
              className={`btn ${isSelected ? 'btn-pri' : ''}`}
            >
              {METHOD_ICONS[method]}
              {METHOD_LABELS[method]}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        {splitEnabled && rows.map((row, index) => (
          <div
            key={`${row.method}-${index}`}
            style={{ border: '1px solid var(--border-soft)', borderRadius: 10, padding: 12, background: '#FAFBFC' }}
          >
            {/* Only shown once a second method can exist: with a single
                selected tile above, repeating its icon/label here read as a
                duplicate entry rather than "the form for that tile". */}
            {splitEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="t-strong" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  {METHOD_ICONS[row.method]}
                  {METHOD_LABELS[row.method]}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${METHOD_LABELS[row.method]} payment row`}
                  onClick={() => onRemoveRow(index)}
                  disabled={disabled}
                  style={{ color: 'var(--muted-2)', background: 'none', border: 0, cursor: 'pointer', padding: 4, lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            )}

            <input
              className="fld-input num"
              style={{ width: '100%', height: 38, textAlign: 'right' }}
              type="number"
              min={0}
              step={0.01}
              value={row.amount}
              disabled={disabled}
              aria-label={`${METHOD_LABELS[row.method]} amount`}
              onChange={(e) => onRowChange(index, { ...row, amount: e.target.value })}
              placeholder="₹0.00"
            />

            {(row.method === 'card' || row.method === 'upi') && (
              <label className="fld" style={{ marginTop: 10, marginBottom: 0 }}>
                <span>{row.method === 'upi' ? 'UPI transaction/reference code' : 'Approval code'}</span>
                <input
                  value={row.referenceCode ?? ''}
                  disabled={disabled}
                  onChange={(e) => onRowChange(index, { ...row, referenceCode: e.target.value })}
                  placeholder={row.method === 'upi' ? 'UPI reference from the customer app' : 'Code from the card terminal'}
                  required
                />
              </label>
            )}
          </div>
        ))}

        {splitEnabled && availableMethodsForNewRow.length > 0 && (
          <button className="btn btn-sm" type="button" onClick={onAddRow} disabled={disabled} style={{ justifyContent: 'center' }}>
            Add another payment method
          </button>
        )}
      </div>
    </div>
  )
}
