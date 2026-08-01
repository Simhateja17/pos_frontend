/**
 * Unit of measure, mirroring the backend's `UnitOfMeasureSchema` (0031).
 *
 * A variant's price is always per ONE of its unit, and the unit is what decides
 * whether a fractional quantity is meaningful. This lives per-variant, not
 * per-product, so one product can carry both forms of the same commodity —
 * loose rice (kg, priced per kg) and a pre-packed bag (piece, priced per pack).
 */
export const UNITS = [
  { value: 'piece', label: 'Piece' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'gram', label: 'Gram (g)' },
  { value: 'litre', label: 'Litre (L)' },
  { value: 'ml', label: 'Millilitre (ml)' },
  { value: 'metre', label: 'Metre (m)' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'set', label: 'Set' },
  { value: 'pair', label: 'Pair' },
] as const

export type Unit = (typeof UNITS)[number]['value']

/** Units sold by weight, volume or length — the only ones that may be fractional. */
const FRACTIONAL_UNITS: readonly string[] = ['kg', 'gram', 'litre', 'ml', 'metre']

export function allowsFractionalQuantity(unit: string): boolean {
  return FRACTIONAL_UNITS.includes(unit)
}

/** Short suffix for displaying a quantity, e.g. "2.5 kg". Piece reads better bare. */
export function unitSuffix(unit: string): string {
  switch (unit) {
    case 'kg':
      return 'kg'
    case 'gram':
      return 'g'
    case 'litre':
      return 'L'
    case 'ml':
      return 'ml'
    case 'metre':
      return 'm'
    case 'piece':
      return ''
    default:
      return unit
  }
}

/** "₹60.00 / kg" for weighed goods; plain price for discrete ones. */
export function priceLabel(price: string, unit: string): string {
  const suffix = unitSuffix(unit)
  return suffix ? `${price} / ${suffix}` : price
}
