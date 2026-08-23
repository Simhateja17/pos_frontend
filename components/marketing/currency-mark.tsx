/*
 * The currency glyph used by the marketing section-tags ("Simple, transparent
 * pricing", "Secure checkout", the 404 Pricing tile).
 *
 * It was a hand-drawn ₹ pasted inline into every page that needed it, so the
 * US edition — which is priced in USD and says so two lines further down —
 * announced its pricing with a rupee. Keying the path by region puts one
 * source of truth behind all six call sites: India keeps ₹, INTL gets $.
 *
 * The hand-drawn ₹ was also not the real rupee sign: it had a single top bar,
 * so it read as a P with a leg. ₹ is Devanagari र struck through by TWO
 * parallel horizontal strokes, and that second bar is what identifies it.
 * Rather than redraw it by eye, both glyphs below are lucide's own geometry
 * (`indian-rupee` and `dollar-sign`, v1.26.0, already a dependency of this
 * app), flattened into one `d` each because some call sites need a string.
 *
 * Keep them lucide-shaped: they sit next to lucide icons everywhere in the
 * product, and both are drawn for the same 24×24 / strokeWidth 2 stroke set as
 * the other section-tag icons, so the visual weight already matches.
 *
 * `import type` keeps this module client-safe: the type is erased at compile
 * time, so `next/headers` never reaches the browser bundle.
 */
import type { MarketingRegion } from '@/lib/marketing/region'

/**
 * Raw `d` attributes, for the few callers that build their icons as SVG
 * source strings rather than JSX (see `tilesFor` in not-found-view.tsx).
 *
 * IN  — lucide `indian-rupee`: top bar, second bar, the leg, the leg's stub,
 *       and the bowl. All five subpaths, or it stops being a rupee.
 * INTL— lucide `dollar-sign`: the full-height bar and the S.
 */
export const CURRENCY_GLYPH_PATH: Record<MarketingRegion, string> = {
  IN: 'M6 3h12M6 8h12M6 13h3M6 13l8.5 8M9 13c6.667 0 6.667-10 0-10',
  INTL: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
}

/** The section-tag currency icon for `region`. */
export function CurrencyMark({ region }: { region: MarketingRegion }) {
  return (
    // Round caps and joins are what lucide draws these with; at 14px the rupee's
    // short bars and stub look chipped with the default butt caps. The 404 tile
    // gets the same treatment from `.nf-link .ico svg` in landing.css.
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={CURRENCY_GLYPH_PATH[region]} />
    </svg>
  )
}
