/**
 * Unit of measure, mirroring the backend's `UnitOfMeasureSchema` (0031, widened by 0077).
 *
 * A variant's price is always per ONE of its unit, and the unit is what decides
 * whether a fractional quantity is meaningful. This lives per-variant, not
 * per-product, so one product can carry both forms of the same commodity —
 * loose rice (kg, priced per kg) and a pre-packed bag (piece, priced per pack).
 *
 * India sells loose goods in metric units; the international edition (US, UK,
 * everywhere else) sells them in US-customary units instead — most retail
 * outside India isn't metric at the register. `unitsForRegion` is what a
 * region-aware screen should render in a "sold by" dropdown; `UNITS` (India's
 * metric-only list) stays as the default export for existing India call sites.
 */
const METRIC_UNITS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'gram', label: 'Gram (g)' },
  { value: 'litre', label: 'Litre (L)' },
  { value: 'ml', label: 'Millilitre (ml)' },
  { value: 'metre', label: 'Metre (m)' },
] as const

const US_CUSTOMARY_UNITS = [
  { value: 'lb', label: 'Pound (lb)' },
  { value: 'oz', label: 'Ounce (oz)' },
  { value: 'gallon', label: 'Gallon (gal)' },
  { value: 'quart', label: 'Quart (qt)' },
  { value: 'pint', label: 'Pint (pt)' },
  { value: 'floz', label: 'Fluid ounce (fl oz)' },
  { value: 'yard', label: 'Yard (yd)' },
  { value: 'foot', label: 'Foot (ft)' },
  { value: 'inch', label: 'Inch (in)' },
] as const

const COUNTED_UNITS = [
  { value: 'piece', label: 'Piece' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'set', label: 'Set' },
  { value: 'pair', label: 'Pair' },
] as const

/** India: metric only. Kept as the default export for existing `/app` call sites. */
export const UNITS = [
  { value: 'piece', label: 'Piece' },
  ...METRIC_UNITS,
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'set', label: 'Set' },
  { value: 'pair', label: 'Pair' },
] as const

/** International edition: metric (UK and most of the world) plus US-customary. */
export const INTL_UNITS = [
  { value: 'piece', label: 'Piece' },
  ...METRIC_UNITS,
  ...US_CUSTOMARY_UNITS,
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'set', label: 'Set' },
  { value: 'pair', label: 'Pair' },
] as const

/** All unit values across every region — for validation/display helpers that aren't region-specific. */
const ALL_UNITS = [...COUNTED_UNITS, ...METRIC_UNITS, ...US_CUSTOMARY_UNITS] as const

export type Unit = (typeof ALL_UNITS)[number]['value']

/** Picks the unit list a "sold by" dropdown should offer for this edition. */
export function unitsForRegion(region: 'IN' | 'INTL'): typeof UNITS | typeof INTL_UNITS {
  return region === 'INTL' ? INTL_UNITS : UNITS
}

/** Units sold by weight, volume or length — the only ones that may be fractional. */
const FRACTIONAL_UNITS: readonly string[] = [
  'kg', 'gram', 'litre', 'ml', 'metre',
  'lb', 'oz', 'gallon', 'quart', 'pint', 'floz', 'yard', 'foot', 'inch',
]

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
    case 'lb':
      return 'lb'
    case 'oz':
      return 'oz'
    case 'gallon':
      return 'gal'
    case 'quart':
      return 'qt'
    case 'pint':
      return 'pt'
    case 'floz':
      return 'fl oz'
    case 'yard':
      return 'yd'
    case 'foot':
      return 'ft'
    case 'inch':
      return 'in'
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
