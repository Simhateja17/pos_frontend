'use client'

import { useState } from 'react'
import { allowsFractionalQuantity, unitSuffix } from '@/lib/units'
import { useAppRegion } from '@/lib/app-region'
import { useT } from '@/lib/i18n/i18n'

export interface CartLine {
  variantId: string
  sku: string
  name: string
  attributes: string // "Size / Color / Material" joined, "-" if none
  unitPrice: string
  /** Drives whether this line is weighed (typed) or counted (stepped). */
  unitOfMeasure: string
  quantity: number
  discountAmount: string // "0.00" if none, always a concrete string per D-07/Open Question #2's resolution
  isTaxable: boolean
  /** Null means this legacy item still uses the store fallback tax rate. */
  taxRatePercent: string | null
  /** Stock at the selected store when the cashier added this line. */
  currentStock: number
}


function lineTotal(line: CartLine): number {
  return Number(line.unitPrice) * line.quantity - Number(line.discountAmount || '0')
}

/**
 * Cart row in the approved billing layout: item + SKU stack, stepper control,
 * price, discount, line total. Emits a plain <tr> so it sits inside the
 * design-system table styling from globals.css.
 */
export function CartLineRow({
  line,
  onQuantityChange,
  onDiscountChange,
  onRemove,
  disabled = false,
}: {
  line: CartLine
  onQuantityChange: (variantId: string, quantity: number) => void
  onDiscountChange: (variantId: string, discountAmount: string) => void
  onRemove: (variantId: string) => void
  disabled?: boolean
}) {
  const { money, pack } = useAppRegion()
  const t = useT()
  const [showDiscountInput, setShowDiscountInput] = useState(Number(line.discountAmount || '0') > 0)
  const discount = Number(line.discountAmount || '0')
  const taxLabel = !line.isTaxable
    ? t('checkout.line.taxExempt')
    : line.taxRatePercent === null || line.taxRatePercent === undefined
      ? t('checkout.line.storeFallbackTax')
      : `${Number(line.taxRatePercent).toFixed(2)}% ${pack.taxLabel}`
  const exceedsStock = line.quantity > line.currentStock

  return (
    <tr>
      <td>
        <div className="t-strong">{line.name}</div>
        <div className="t-sub t-mono">
          {line.sku}
          {line.attributes && line.attributes !== '-' ? ` · ${line.attributes}` : ''}
          {discount > 0 ? (
            <>
              {' · '}
              <span className="badge b-amber" style={{ fontSize: 9, padding: '1px 5px' }}>
                −{money(discount)}
              </span>
            </>
          ) : null}
          {' · '}
          <span className="badge b-blue" style={{ fontSize: 9, padding: '1px 5px' }}>
            {taxLabel}
          </span>
          {exceedsStock ? (
            <>
              {' · '}
              <span className="badge b-red" style={{ fontSize: 9, padding: '1px 5px' }}>
                {line.currentStock <= 0
                  ? t('checkout.line.outOfStock')
                  : t('checkout.line.partialStock', { count: line.currentStock })}
              </span>
            </>
          ) : null}
        </div>
      </td>

      <td>
        {/*
          A weighed item (kg/litre/etc.) is typed, not stepped: a cashier
          entering 2.5 kg of loose rice cannot get there with +/- buttons.
          Counted items keep the stepper, which is faster for the common case.
        */}
        {allowsFractionalQuantity(line.unitOfMeasure) ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number"
              min={0}
              step={0.001}
              value={line.quantity}
              disabled={disabled}
              aria-label={t('checkout.line.quantityFor', { name: line.name, unit: unitSuffix(line.unitOfMeasure) })}
              onChange={(e) => onQuantityChange(line.variantId, Number(e.target.value))}
              className="fld-input num"
              style={{ maxWidth: 84 }}
            />
            <span className="t-sub">{unitSuffix(line.unitOfMeasure)}</span>
          </div>
        ) : (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', borderRadius: 8, padding: '2px 6px' }}>
            <button
              type="button"
              className="qstep"
              aria-label={t('checkout.line.decrease', { name: line.name })}
              onClick={() => onQuantityChange(line.variantId, Math.max(1, line.quantity - 1))}
              disabled={disabled}
            >
              −
            </button>
            <b className="num" aria-live="polite">
              {line.quantity}
            </b>
            <button
              type="button"
              className="qstep"
              aria-label={t('checkout.line.increase', { name: line.name })}
              onClick={() => onQuantityChange(line.variantId, line.quantity + 1)}
              disabled={disabled}
            >
              +
            </button>
          </div>
        )}
      </td>

      <td className="num">
        {money(Number(line.unitPrice))}
        {unitSuffix(line.unitOfMeasure) ? <span className="t-sub"> / {unitSuffix(line.unitOfMeasure)}</span> : null}
      </td>

      <td>
        {showDiscountInput ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span aria-hidden="true">{pack.currencySymbol}</span>
            <input
              type="number"
              min={0}
              max={Number(line.unitPrice) * line.quantity}
              step={0.01}
              value={line.discountAmount}
              disabled={disabled}
              aria-label={t('checkout.line.discountFor', { currency: pack.currency, name: line.name })}
              onChange={(e) => onDiscountChange(line.variantId, e.target.value)}
              className="fld-input num"
              style={{ maxWidth: 92 }}
            />
          </div>
        ) : (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowDiscountInput(true)} disabled={disabled}>
            {t('checkout.line.addDiscount')}
          </button>
        )}
      </td>

      <td className="num t-strong">{money(lineTotal(line))}</td>

      <td>
        <button
          type="button"
          aria-label={t('checkout.line.removeLine', { name: line.name })}
          onClick={() => onRemove(line.variantId)}
          disabled={disabled}
          style={{ color: 'var(--muted-2)', background: 'none', border: 0, cursor: 'pointer', padding: 6, lineHeight: 1 }}
        >
          ✕
        </button>
      </td>
    </tr>
  )
}
