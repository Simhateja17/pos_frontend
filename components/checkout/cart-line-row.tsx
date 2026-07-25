'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export interface CartLine {
  variantId: string
  sku: string
  name: string
  attributes: string // "Size / Color / Material" joined, "—" if none
  unitPrice: string
  quantity: number
  discountAmount: string // "0.00" if none, always a concrete string per D-07/Open Question #2's resolution
  isTaxable: boolean
}

function lineTotal(line: CartLine): string {
  const total = Number(line.unitPrice) * line.quantity - Number(line.discountAmount || '0')
  return total.toFixed(2)
}

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
  const [showDiscountInput, setShowDiscountInput] = useState(
    Number(line.discountAmount || '0') > 0,
  )

  return (
    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
      <td style={{ padding: '8px 4px' }}>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 400 }}>
          {line.name}
        </div>
        <div className="text-sm" style={{ color: '#64748B' }}>
          {line.attributes} · SKU {line.sku}
        </div>
      </td>
      <td style={{ padding: '8px 4px' }}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={`Decrease quantity for ${line.name}`}
            onClick={() => onQuantityChange(line.variantId, Math.max(1, line.quantity - 1))}
            disabled={disabled}
            className="rounded-md border"
            style={{ minHeight: 44, minWidth: 44, borderColor: '#E2E8F0' }}
          >
            −
          </button>
          <Input
            type="number"
            min={1}
            step={1}
            value={line.quantity}
            disabled={disabled}
            onChange={(e) => {
              const next = Number(e.target.value)
              onQuantityChange(line.variantId, Number.isFinite(next) && next > 0 ? next : 1)
            }}
            className="text-center"
            style={{ maxWidth: 64, minHeight: 44 }}
          />
          <button
            type="button"
            aria-label={`Increase quantity for ${line.name}`}
            onClick={() => onQuantityChange(line.variantId, line.quantity + 1)}
            disabled={disabled}
            className="rounded-md border"
            style={{ minHeight: 44, minWidth: 44, borderColor: '#E2E8F0' }}
          >
            +
          </button>
        </div>
      </td>
      <td style={{ padding: '8px 4px' }}>{line.unitPrice}</td>
      <td style={{ padding: '8px 4px' }}>
        {showDiscountInput ? (
          <Input
            type="number"
            min={0}
            step={0.01}
            value={line.discountAmount}
            disabled={disabled}
            onChange={(e) => onDiscountChange(line.variantId, e.target.value)}
            className="text-right"
            style={{ maxWidth: 96, minHeight: 44 }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowDiscountInput(true)}
            disabled={disabled}
            className="text-sm"
            style={{ color: '#0058BA' }}
          >
            Add discount
          </button>
        )}
      </td>
      <td style={{ padding: '8px 4px', fontWeight: 700 }}>{lineTotal(line)}</td>
      <td style={{ padding: '8px 4px' }}>
        <Button
          type="button"
          variant="ghost"
          aria-label={`Remove ${line.name} from cart`}
          onClick={() => onRemove(line.variantId)}
          disabled={disabled}
          style={{ minHeight: 44, minWidth: 44, color: '#64748B' }}
        >
          ✕
        </Button>
      </td>
    </tr>
  )
}
