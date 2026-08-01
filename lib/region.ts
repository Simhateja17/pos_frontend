/**
 * Region-specific formatting for the India surface.
 *
 * Deliberately dumb: one constant, three formatters, no config plumbing and no
 * tenant lookup. It exists so locale/currency/timezone stop being retyped into
 * every screen that shows a number — not to invent the region-pack machinery
 * before there is a second region to prove it against.
 */
const REGION = {
  locale: 'en-IN',
  currency: 'INR',
  timeZone: 'Asia/Kolkata',
} as const

const currencyFormat = new Intl.NumberFormat(REGION.locale, {
  style: 'currency',
  currency: REGION.currency,
  maximumFractionDigits: 2,
})

const fullDateFormat = new Intl.DateTimeFormat(REGION.locale, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: REGION.timeZone,
})

const shortDateFormat = new Intl.DateTimeFormat(REGION.locale, {
  day: 'numeric',
  month: 'short',
  timeZone: REGION.timeZone,
})

/** Formats a decimal string from the API. */
export function money(value: string | number): string {
  return currencyFormat.format(Number(value))
}

/** "01 Aug 2026" — for page headers. */
export function fullDate(value: Date): string {
  return fullDateFormat.format(value)
}

/** "1 Aug" — for chart axes and dense rows. */
export function shortDate(value: string | Date): string {
  return shortDateFormat.format(typeof value === 'string' ? new Date(value) : value)
}
