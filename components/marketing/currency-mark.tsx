/*
 * The currency glyph used by the marketing section-tags ("Simple, transparent
 * pricing", "Secure checkout", the 404 Pricing tile).
 *
 * It was a hand-drawn ₹ pasted inline into every page that needed it, so the
 * US edition — which is priced in USD and says so two lines further down —
 * announced its pricing with a rupee. Keying the path by region puts one
 * source of truth behind all six call sites: India keeps ₹, INTL gets $.
 *
 * Both glyphs are drawn for the same 24×24 / strokeWidth 2 stroke set as the
 * other section-tag icons, so they sit at the same visual weight.
 *
 * `import type` keeps this module client-safe: the type is erased at compile
 * time, so `next/headers` never reaches the browser bundle.
 */
import type { MarketingRegion } from '@/lib/marketing/region'

/**
 * Raw `d` attributes, for the few callers that build their icons as SVG
 * source strings rather than JSX (see `TILES` in not-found-view.tsx).
 */
export const CURRENCY_GLYPH_PATH: Record<MarketingRegion, string> = {
  IN: 'M7.5 5h9M9.5 5a3.8 3.8 0 0 1 0 8H7.5l7.5 6.2',
  INTL: 'M12 2.6v18.8M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
}

/** The section-tag currency icon for `region`. */
export function CurrencyMark({ region }: { region: MarketingRegion }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={CURRENCY_GLYPH_PATH[region]} />
    </svg>
  )
}
