'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export type TenderMethod = 'cash' | 'card' | 'check'

export interface TenderRow {
  method: TenderMethod
  amount: string
  referenceCode?: string
}

const METHOD_LABELS: Record<TenderMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  check: 'Check',
}

const ALL_METHODS: TenderMethod[] = ['cash', 'card', 'check']

export function PaymentMethodGrid({
  selected,
  onToggle,
  rows,
  onRowChange,
  onAddRow,
  onRemoveRow,
  disabled = false,
}: {
  selected: TenderMethod[]
  onToggle: (method: TenderMethod) => void
  rows: TenderRow[]
  onRowChange: (index: number, row: TenderRow) => void
  onAddRow: () => void
  onRemoveRow: (index: number) => void
  disabled?: boolean
}) {
  const availableMethodsForNewRow = ALL_METHODS.filter(
    (m) => !rows.some((r) => r.method === m),
  )

  return (
    <div>
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Payment method
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {ALL_METHODS.map((method) => {
          const isSelected = selected.includes(method)
          return (
            <button
              key={method}
              type="button"
              onClick={() => onToggle(method)}
              disabled={disabled}
              className="rounded-md border"
              style={{
                minHeight: 44,
                minWidth: 44,
                borderColor: isSelected ? '#0058BA' : '#E2E8F0',
                backgroundColor: isSelected ? '#0058BA' : 'transparent',
                color: isSelected ? '#FFFFFF' : '#0F172A',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
              }}
            >
              {METHOD_LABELS[method]}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {rows.map((row, index) => (
          <div key={`${row.method}-${index}`} className="flex flex-col gap-2 rounded-md border p-3" style={{ borderColor: '#E2E8F0' }}>
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
                {METHOD_LABELS[row.method]}
              </span>
              <button
                type="button"
                aria-label={`Remove ${METHOD_LABELS[row.method]} payment row`}
                onClick={() => onRemoveRow(index)}
                disabled={disabled}
                style={{ minHeight: 44, minWidth: 44, color: '#64748B' }}
              >
                ✕
              </button>
            </div>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={row.amount}
              disabled={disabled}
              onChange={(e) => onRowChange(index, { ...row, amount: e.target.value })}
              placeholder="$0.00"
              style={{ minHeight: 44 }}
            />
            {row.method === 'card' && (
              <div className="flex flex-col gap-1">
                <label
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Approval code
                </label>
                <Input
                  value={row.referenceCode ?? ''}
                  disabled={disabled}
                  onChange={(e) =>
                    onRowChange(index, { ...row, referenceCode: e.target.value })
                  }
                  placeholder="Enter the code from the card terminal"
                  style={{ minHeight: 44 }}
                />
              </div>
            )}
          </div>
        ))}

        {availableMethodsForNewRow.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={onAddRow}
            disabled={disabled}
            style={{ minHeight: 44 }}
          >
            Add another payment method
          </Button>
        )}
      </div>
    </div>
  )
}
