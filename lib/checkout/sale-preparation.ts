type DiscountLine = {
  unitPrice: string
  quantity: number
  discountAmount: string
}

export type DiscountMode = 'none' | 'percent' | 'amount'

function finiteNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function serializeMoneyIfPresent(value: string | undefined): string | undefined {
  const parsed = finiteNumber(value)
  return parsed === null ? undefined : parsed.toFixed(2)
}

export function serializeOptionalMoney(value: string): string | undefined {
  const parsed = finiteNumber(value)
  return parsed !== null && parsed > 0 ? parsed.toFixed(2) : undefined
}

export function serializeOptionalPercent(value: string): string | undefined {
  const parsed = finiteNumber(value)
  return parsed !== null && parsed > 0 ? parsed.toFixed(2) : undefined
}

export function checkoutDiscountState(lines: DiscountLine[], mode: DiscountMode, rawCartDiscount: string) {
  const grossSubtotal = lines.reduce((sum, line) => sum + Number(line.unitPrice) * line.quantity, 0)
  let error: string | null = null
  let lineDiscountTotal = 0
  const lineDiscountAmounts: number[] = []

  for (const line of lines) {
    const lineValue = Number(line.unitPrice) * line.quantity
    const discount = finiteNumber(line.discountAmount) ?? 0
    if (discount < 0) {
      error ??= 'A line discount cannot be negative.'
      lineDiscountAmounts.push(0)
      continue
    }
    if (discount > lineValue) {
      error ??= 'A line discount cannot exceed the line value.'
      lineDiscountAmounts.push(0)
      continue
    }
    lineDiscountTotal += discount
    lineDiscountAmounts.push(discount)
  }

  const subtotalAfterLineDiscount = grossSubtotal - lineDiscountTotal
  const cartValue = finiteNumber(rawCartDiscount) ?? 0
  let cartDiscount = 0
  if (mode !== 'none') {
    if (cartValue < 0) {
      error ??= 'The whole-bill discount cannot be negative.'
    } else if (mode === 'percent' && cartValue > 100) {
      error ??= 'The whole-bill discount cannot exceed 100%.'
    } else {
      cartDiscount = mode === 'percent'
        ? subtotalAfterLineDiscount * cartValue / 100
        : cartValue
      if (cartDiscount > subtotalAfterLineDiscount) {
        error ??= 'The whole-bill discount cannot exceed the cart subtotal.'
        cartDiscount = 0
      }
    }
  }

  return {
    grossSubtotal,
    lineDiscountAmounts,
    lineDiscountTotal,
    cartDiscount,
    totalDiscount: lineDiscountTotal + cartDiscount,
    discountedSubtotal: subtotalAfterLineDiscount - cartDiscount,
    error,
  }
}

export function saleContentSignature<T extends { clientSaleId: string }>(sale: T): string {
  const { clientSaleId: _ignored, ...content } = sale
  return JSON.stringify(content)
}
