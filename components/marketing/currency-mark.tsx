/*
 * The currency mark in the marketing section-tags ("Simple, transparent
 * pricing", "Secure checkout", the 404 Pricing tile).
 *
 * This was a hand-drawn SVG glyph pasted inline into every page that needed
 * it, and it was wrong twice over. The US edition — priced in USD, and saying
 * so two lines further down — announced its pricing with a rupee. And the
 * rupee itself had a single top bar, which makes it the Devanagari letter र,
 * not ₹: the rupee is र struck through by TWO parallel horizontal strokes.
 *
 * Redrawing it by hand was the wrong instinct. Even lucide's `indian-rupee`,
 * which is at least structurally a rupee, is a loose icon reading of it: big
 * round bowl, shallow leg, bars set wide. Next to the real character it is
 * visibly not the same mark.
 *
 * So render the character. U+20B9 sits in Plus Jakarta Sans's latin-ext subset
 * (`unicode-range: U+20AD-20C0`, already loaded in app/layout.js), so ₹ comes
 * out in the badge's own typeface at the badge's own weight — which is the
 * only way it is going to look exactly like ₹.
 *
 * `import type` keeps this module client-safe: the type is erased at compile
 * time, so `next/headers` never reaches the browser bundle.
 */
import type { MarketingRegion } from '@/lib/marketing/region'

/** The edition's currency sign. */
export const CURRENCY_SIGN: Record<MarketingRegion, string> = {
  IN: '₹',
  INTL: '$',
}

/**
 * The same mark as SVG source, for callers that build their icons as strings
 * rather than JSX (see `tilesFor` in not-found-view.tsx).
 *
 * `.nf-link .ico svg` paints its icons with `stroke:currentColor;fill:none`
 * for the stroke-drawn tile icons, so this has to invert that pair itself.
 */
export const CURRENCY_GLYPH_SVG: Record<MarketingRegion, string> = {
  IN: `<text x="12" y="19" text-anchor="middle" font-size="21" font-weight="700" fill="currentColor" stroke="none">${CURRENCY_SIGN.IN}</text>`,
  INTL: `<text x="12" y="19" text-anchor="middle" font-size="21" font-weight="700" fill="currentColor" stroke="none">${CURRENCY_SIGN.INTL}</text>`,
}

/** The section-tag currency mark for `region`. */
export function CurrencyMark({ region }: { region: MarketingRegion }) {
  return (
    // The tag itself is 12px/700 with `letter-spacing:.1em` and sets the gap to
    // the label, so: cancel the tracking (it would add a phantom space after a
    // one-character span) and size the mark to the 14px the outgoing icon
    // occupied, so the badge's rhythm does not shift.
    <span
      aria-hidden="true"
      style={{ fontSize: 15, fontWeight: 800, lineHeight: 1, letterSpacing: 0 }}
    >
      {CURRENCY_SIGN[region]}
    </span>
  )
}
