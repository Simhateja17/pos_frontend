/**
 * Ambel POS brand mark: "H · Counterform".
 *
 * The A is the counterform: a solid rounded tile with the letter cut out of it,
 * broken by a full-width base band and a crossbar notch. Because the silhouette
 * stays a solid tile, it survives down to favicon size where an outlined mark
 * would fall apart.
 *
 * Geometry is authored on a 120x120 grid so every size is one uniform scale.
 * The counter is truncated at y=94 (where the base band starts) rather than
 * drawn full-height and covered, so the tile's rounded bottom corners stay clean
 * without a clip path.
 */

import styles from './ambel-mark.module.css'

const TILE = '#4285F4'
const PAPER = '#FFFFFF'

/**
 * The tile carries the same ramp as the primary hero button
 * (--brand-dark → --brand-1 → --brand-2 on a 120deg diagonal), and now the same
 * motion: the stops animate on the 6s gradShift cycle that sweeps that button
 * (see ambel-mark.module.css). It is painted in userSpaceOnUse coordinates so
 * the base band samples the same ramp as the tile behind it instead of
 * restarting the gradient inside its own bounding box.
 *
 * The id is a constant: every brand-tone mark on a page declares an identical
 * gradient, so duplicate defs resolve to the same paint. The inverse tone stays
 * flat white, so it never shares this id.
 */
const TILE_GRADIENT_ID = 'ambel-mark-tile'

export type AmbelMarkProps = {
  /** Rendered width and height in px. */
  size?: number
  /** `brand` = blue tile on light surfaces. `inverse` = white tile for dark/blue panels. */
  tone?: 'brand' | 'inverse'
  className?: string
  /** Accessible name. Omit on decorative marks that sit beside the wordmark. */
  title?: string
}

export function AmbelMark({ size = 38, tone = 'brand', className, title }: AmbelMarkProps) {
  const tile = tone === 'inverse' ? PAPER : `url(#${TILE_GRADIENT_ID})`
  const counter = tone === 'inverse' ? TILE : PAPER

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      // Inline so container rules like `.nav-logo-mark svg { stroke: #fff }`
      // cannot repaint or resize the mark.
      style={{ width: size, height: size, display: 'block', stroke: 'none', flexShrink: 0 }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {tone !== 'inverse' && (
        <defs>
          <linearGradient id={TILE_GRADIENT_ID} gradientUnits="userSpaceOnUse" x1="8" y1="30" x2="112" y2="90">
            <stop offset="0" stopColor="#06337A" className={styles.stopDark} />
            <stop offset="0.5" stopColor="#0058BA" className={styles.stopMid} />
            <stop offset="1" stopColor="#6C9FFF" className={styles.stopLight} />
          </linearGradient>
        </defs>
      )}
      <rect width="120" height="120" rx="34" fill={tile} />
      <path d="M60 0L107 94L75.95 94L60 49.2L44.05 94L13 94Z" fill={counter} />
      <rect x="26" y="85" width="68" height="9" rx="4.5" fill={tile} />
    </svg>
  )
}

export default AmbelMark
