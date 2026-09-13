'use client'

/**
 * Which edition an in-app screen is rendering for, and everything that varies
 * with it.
 *
 * The app modules under `/app/*` (India) and `/us/dashboard/*` (US) are the
 * SAME components — same markup, same design system, same API client. Only the
 * content varies: currency and date formatting, the words for tax and payments,
 * and the base path every internal link is built from. This context is how a
 * shared component finds that out.
 *
 * It replaces the single hardcoded pack in `lib/region.ts`, whose own comment
 * said it was deliberately dumb "until there is a second region to prove it
 * against". `/us/dashboard/*` is that second region.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { MarketingRegion } from '@/lib/marketing/region'

type RegionPack = {
  locale: string
  currency: string
  currencySymbol: string
  /**
   * Business-day boundaries come from the backend already resolved to the
   * tenant's timezone. India pins a display timezone because every India tenant
   * is in one; the US spans six, so dates are rendered in the viewer's own zone
   * rather than silently relabelled to one coast.
   */
  timeZone?: string
  /** What this edition calls its indirect tax, in sentence case. */
  taxLabel: string
  /** Base path for in-app routes. */
  basePath: string
  /** Where an unauthenticated shell sends the visitor. */
  signInPath: string
}

export const REGION_PACKS: Record<MarketingRegion, RegionPack> = {
  IN: {
    locale: 'en-IN',
    currency: 'INR',
    currencySymbol: '₹',
    timeZone: 'Asia/Kolkata',
    taxLabel: 'GST',
    basePath: '/app',
    signInPath: '/login',
  },
  INTL: {
    locale: 'en-US',
    currency: 'USD',
    currencySymbol: '$',
    taxLabel: 'Sales tax',
    basePath: '/us/dashboard',
    signInPath: '/us/auth',
  },
}

export type AppRegionValue = {
  region: MarketingRegion
  pack: RegionPack
  /** Locale for date/time text: the pack locale, or the viewer's language (`te-IN`). */
  dateLocale: string
  /** Formats a decimal string from the API in this edition's currency. */
  money: (value: string | number) => string
  /** "01 Aug 2026" — for page headers. */
  fullDate: (value: Date) => string
  /** "1 Aug" — for chart axes and dense rows. */
  shortDate: (value: string | Date) => string
  /**
   * Rewrites an in-app path onto this edition's base.
   *
   * Shared components are written with India's `/app/...` paths because that is
   * where they were born; this maps them onto `/us/dashboard/...` for the US
   * edition. Anything already outside `/app` (a marketing or auth route) is
   * returned untouched.
   */
  appPath: (path: string) => string
}

const AppRegionContext = createContext<AppRegionValue | null>(null)

/**
 * `dateLocale` lets the India edition render month names in the viewer's
 * chosen language (e.g. `te-IN`). Currency keeps the pack locale: Indian
 * digit grouping with Western numerals is what Telugu shopkeepers read.
 */
export function buildRegionValue(region: MarketingRegion, dateLocale?: string): AppRegionValue {
  const pack = REGION_PACKS[region]

  const currencyFormat = new Intl.NumberFormat(pack.locale, {
    style: 'currency',
    currency: pack.currency,
    maximumFractionDigits: 2,
  })
  const fullDateFormat = new Intl.DateTimeFormat(dateLocale ?? pack.locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: pack.timeZone,
  })
  const shortDateFormat = new Intl.DateTimeFormat(dateLocale ?? pack.locale, {
    day: 'numeric',
    month: 'short',
    timeZone: pack.timeZone,
  })

  return {
    region,
    pack,
    dateLocale: dateLocale ?? pack.locale,
    money: (value) => currencyFormat.format(Number(value)),
    fullDate: (value) => fullDateFormat.format(value),
    shortDate: (value) => shortDateFormat.format(typeof value === 'string' ? new Date(value) : value),
    appPath: (path) => (path.startsWith('/app') ? `${pack.basePath}${path.slice('/app'.length)}` : path),
  }
}

export function AppRegionProvider({
  region,
  dateLocale,
  children,
}: {
  region: MarketingRegion
  dateLocale?: string
  children: ReactNode
}) {
  const value = useMemo(() => buildRegionValue(region, dateLocale), [region, dateLocale])
  return <AppRegionContext.Provider value={value}>{children}</AppRegionContext.Provider>
}

/**
 * India is the default so that every existing `/app/*` screen keeps working
 * unchanged if it renders outside a provider (a test, a Storybook-style
 * harness). The US shell always provides one.
 */
const INDIA_FALLBACK = buildRegionValue('IN')

export function useAppRegion(): AppRegionValue {
  return useContext(AppRegionContext) ?? INDIA_FALLBACK
}
