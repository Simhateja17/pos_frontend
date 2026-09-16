import type { Metadata } from 'next'

/**
 * Metadata for the International edition.
 *
 * `app/us/page.js` is a client component and so cannot export `metadata` of
 * its own. Without this layout the US homepage silently inherited the root
 * layout's India copy ("GST-native POS for Indian retail"), which told search
 * engines that our highest-CPC page was about Indian GST.
 *
 * Targets `retail pos system` (US vol 8,100, CPC $78.13) — the term whose
 * live SERP is Square, Shopify, Lightspeed and Oracle, i.e. our actual
 * competitors. Deliberately NOT "inventory forecasting software": that phrase
 * is what the product does, but it draws 140 searches a month.
 *
 * No `alternates.canonical` here: this layout covers the whole /us/* subtree,
 * and middleware.ts already emits per-path canonical Link headers.
 */
export const metadata: Metadata = {
  title: 'Retail POS System That Tells You What to Reorder | Ambel POS',
  description:
    'A retail POS system for small and multi-location stores. Fast checkout, stock you can trust, billing that survives a connection drop. Every night it works out what to reorder and how much.',
}

export default function UsLayout({ children }: { children: React.ReactNode }) {
  return children
}
