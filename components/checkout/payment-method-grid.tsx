'use client'

import { Banknote, CreditCard, HandCoins, QrCode } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAppRegion } from '@/lib/app-region'
import { enumLabel, useT } from '@/lib/i18n/i18n'

export type TenderMethod = 'cash' | 'card' | 'upi' | 'credit'

export interface TenderRow {
  method: TenderMethod
  amount: string
  cashReceived?: string
  referenceCode?: string
}

const METHOD_ICONS: Record<TenderMethod, ReactNode> = {
  cash: <Banknote size={16} strokeWidth={1.85} />,
  card: <CreditCard size={16} strokeWidth={1.85} />,
  upi: <QrCode size={16} strokeWidth={1.85} />,
  credit: <HandCoins size={16} strokeWidth={1.85} />,
}

/** These are the persisted POS tender methods. UPI records an external UPI reference; it is not a gateway capture. */
const ALL_METHODS: TenderMethod[] = ['cash', 'card', 'upi', 'credit']

function formatAmount(value: string, formatMoney: (value: string | number) => string): string {
  const amount = Number(value)
  return Number.isFinite(amount) ? formatMoney(amount) : value
}

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
  const { money } = useAppRegion()
  const t = useT()
  const label = (method: TenderMethod) => enumLabel(t, 'method', method)
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
        {t('checkout.pay.split')}
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
              {label(method)}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        {rows.map((row, index) => (
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
                  {label(row.method)}
                </span>
                <button
                  type="button"
                  aria-label={t('checkout.pay.removeRow', { method: label(row.method) })}
                  onClick={() => onRemoveRow(index)}
                  disabled={disabled}
                  style={{ color: 'var(--muted-2)', background: 'none', border: 0, cursor: 'pointer', padding: 4, lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            )}

            {splitEnabled ? (
              <input
                className="fld-input num"
                style={{ width: '100%', height: 38, textAlign: 'right' }}
                type="number"
                min={0}
                step={0.01}
                value={row.amount}
                disabled={disabled}
                aria-label={t('checkout.pay.amountFor', { method: label(row.method) })}
                onChange={(e) => onRowChange(index, { ...row, amount: e.target.value })}
                placeholder={money(0)}
              />
            ) : (
              <div
                aria-label={t('checkout.pay.amountFor', { method: label(row.method) })}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 38, padding: '0 10px', border: '1px solid var(--border-soft)', borderRadius: 8, background: 'var(--surface)' }}
              >
                <span className="t-sub">{t('checkout.pay.amountApplied')}</span>
                <strong className="num">{formatAmount(row.amount, money)}</strong>
              </div>
            )}

            {row.method === 'cash' && (
              row.cashReceived === undefined ? (
                <button
                  className="btn btn-sm btn-ghost"
                  type="button"
                  onClick={() => onRowChange(index, { ...row, cashReceived: row.amount })}
                  disabled={disabled}
                  style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
                >
                  {t('checkout.pay.enterCash')}
                </button>
              ) : (
                <label className="fld" style={{ marginTop: 10, marginBottom: 0 }}>
                  <span>{t('checkout.pay.cashReceived')} <em style={{ fontStyle: 'normal', fontWeight: 500, color: 'var(--muted-2)' }}>{t('checkout.pay.optional')}</em></span>
                  <input
                    value={row.cashReceived}
                    disabled={disabled}
                    inputMode="decimal"
                    onChange={(e) => onRowChange(index, { ...row, cashReceived: e.target.value })}
                    placeholder={row.amount ? formatAmount(row.amount, money) : money(0)}
                  />
                </label>
              )
            )}

            {(row.method === 'card' || row.method === 'upi') && (
              <label className="fld" style={{ marginTop: 10, marginBottom: 0 }}>
                <span>{row.method === 'upi' ? t('checkout.pay.upiRef') : t('checkout.pay.approvalCode')}</span>
                <input
                  value={row.referenceCode ?? ''}
                  disabled={disabled}
                  onChange={(e) => onRowChange(index, { ...row, referenceCode: e.target.value })}
                  placeholder={row.method === 'upi' ? t('checkout.pay.upiPlaceholder') : t('checkout.pay.cardPlaceholder')}
                  required
                />
              </label>
            )}
          </div>
        ))}

        {splitEnabled && availableMethodsForNewRow.length > 0 && (
          <button className="btn btn-sm" type="button" onClick={onAddRow} disabled={disabled} style={{ justifyContent: 'center' }}>
            {t('checkout.pay.addAnother')}
          </button>
        )}
      </div>
    </div>
  )
}
