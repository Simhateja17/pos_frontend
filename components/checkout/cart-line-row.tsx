'use client'

import { useState } from 'react'
import { allowsFractionalQuantity, unitSuffix } from '@/lib/units'
import { useAppRegion } from '@/lib/app-region'

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
  const { money } = useAppRegion()
  const [showDiscountInput, setShowDiscountInput] = useState(Number(line.discountAmount || '0') > 0)
  const discount = Number(line.discountAmount || '0')

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
              aria-label={`Quantity for ${line.name} in ${unitSuffix(line.unitOfMeasure)}`}
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
              aria-label={`Decrease quantity for ${line.name}`}
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
              aria-label={`Increase quantity for ${line.name}`}
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
          <input
            type="number"
            min={0}
            step={0.01}
            value={line.discountAmount}
            disabled={disabled}
            aria-label={`Discount for ${line.name}`}
            onChange={(e) => onDiscountChange(line.variantId, e.target.value)}
            className="fld-input num"
            style={{ maxWidth: 92 }}
          />
        ) : (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowDiscountInput(true)} disabled={disabled}>
            Add discount
          </button>
        )}
      </td>

      <td className="num t-strong">{money(lineTotal(line))}</td>

      <td>
        <button
          type="button"
          aria-label={`Remove ${line.name} from cart`}
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
