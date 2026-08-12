/**
 * Ambel design-system primitives.
 *
 * These are 1:1 React ports of the helper functions in the approved prototype
 * (the approved retail prototype): head(), kpis(), tabs(), seg(),
 * dataTable(), flag(), cb(), tg(). They emit exactly the same markup and class
 * names, so they inherit the design-system CSS already present in
 * `app/globals.css` (all 150 prototype classes are there).
 *
 * Rule: screens compose these. Do not hand-roll Tailwind equivalents: that is
 * what caused the visual drift from the approved design in the first place.
 */
import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

/* ---------- page head ---------- */

export function PageHead({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h2>{title}</h2>
        {sub ? <div className="sub">{sub}</div> : null}
      </div>
      {actions ? <div className="head-actions">{actions}</div> : null}
    </div>
  )
}

/* ---------- KPI row ---------- */

export type KpiItem = {
  label: string
  value: ReactNode
  meta?: ReactNode
  /**
   * Opt in to the brand-tinted "lead" treatment. Off by default: a whole row of
   * tiles reads as one set of figures, and tinting the first one purely because
   * it is first made the row look inconsistent rather than emphasised.
   */
  lead?: boolean
  flag?: FlagKind
  /** Optional drill-through destination. When set, the tile renders as a link. */
  href?: string
}

/**
 * The column count is published as the `--kpi-cols` custom property rather than
 * as an inline `grid-template-columns`. An inline declaration is unbeatable by
 * a stylesheet rule, so the desktop column count would survive every mobile
 * breakpoint; a custom property lets the media queries in globals.css repack
 * the row to whatever fits the viewport.
 */
export function KpiRow({ items, cols }: { items: KpiItem[]; cols?: number }) {
  return (
    <div className="kpi-row" style={{ '--kpi-cols': cols ?? items.length } as CSSProperties}>
      {items.map((k) => {
        const body = (
          <>
            <div className="kl">
              {k.label}
              {k.flag ? <Flag kind={k.flag} /> : null}
            </div>
            <div className="kv">{k.value}</div>
            <div className="km">{k.meta ?? ''}</div>
          </>
        )
        return k.href ? (
          <Link
            key={k.label}
            href={k.href}
            className={`kpi ${k.lead ? 'lead' : ''}`}
            style={{ display: 'block', color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}
          >
            {body}
          </Link>
        ) : (
          <div key={k.label} className={`kpi ${k.lead ? 'lead' : ''}`}>
            {body}
          </div>
        )
      })}
    </div>
  )
}

/* ---------- cards ---------- */

export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  )
}

export function CardHead({ title, sub, right, style }: { title?: ReactNode; sub?: ReactNode; right?: ReactNode; style?: CSSProperties }) {
  return (
    <div className="card-h" style={style}>
      <div>
        {title ? <h3>{title}</h3> : null}
        {sub ? <div className="ch-sub">{sub}</div> : null}
      </div>
      {right}
    </div>
  )
}

export function CardPad({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="card-pad" style={style}>
      {children}
    </div>
  )
}

export function Split2({ children }: { children: ReactNode }) {
  return <div className="split-2">{children}</div>
}

export function SectionLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="section-label" style={style}>
      {children}
    </div>
  )
}

/* ---------- tabs / segmented control ---------- */

export function Tabs<T extends string>({
  items,
  active,
  onSelect,
  ariaLabel,
  disabled,
}: {
  items: readonly { label: string; value: T }[]
  active: T
  onSelect: (value: T) => void
  ariaLabel?: string
  disabled?: boolean
}) {
  return (
    <div className="tabs" role="tablist" aria-label={ariaLabel}>
      {items.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={t.value === active}
          disabled={disabled}
          onClick={() => onSelect(t.value)}
          className={`tab ${t.value === active ? 'active' : ''}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Seg<T extends string>({
  items,
  active,
  onSelect,
  ariaLabel,
  disabled,
}: {
  items: readonly { label: string; value: T }[]
  active: T
  onSelect: (value: T) => void
  ariaLabel?: string
  disabled?: boolean
}) {
  return (
    <div className="seg" role="group" aria-label={ariaLabel}>
      {items.map((t) => (
        <b
          key={t.value}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-pressed={t.value === active}
          className={t.value === active ? 'active' : ''}
          onClick={() => !disabled && onSelect(t.value)}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              onSelect(t.value)
            }
          }}
        >
          {t.label}
        </b>
      ))}
    </div>
  )
}

/* ---------- badges & flags ---------- */

export type BadgeTone = 'green' | 'amber' | 'red' | 'blue' | 'grey' | 'gold'

export function Badge({ tone = 'grey', dot, children }: { tone?: BadgeTone; dot?: 'g' | 'a' | 'r'; children: ReactNode }) {
  return (
    <span className={`badge b-${tone}`}>
      {dot ? <span className={`dot-${dot}`} /> : null}
      {children}
    </span>
  )
}

export type FlagKind = 'NEW' | '★' | 'AI' | 'IMPROVE' | 'EXISTING'

const FLAG_CLASS: Record<FlagKind, string> = {
  NEW: 'new',
  '★': 'star',
  AI: 'ai',
  IMPROVE: 'improve',
  EXISTING: 'exist',
}

export function Flag({ kind }: { kind: FlagKind }) {
  return <span className={`flag ${FLAG_CLASS[kind]}`}>{kind}</span>
}

/* ---------- data table ---------- */

export function DataTable({
  cols,
  children,
  minWidth,
}: {
  cols: readonly (string | { label: string; align?: 'right' | 'center' })[]
  children: ReactNode
  minWidth?: number
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={minWidth ? { minWidth } : undefined}>
        <thead>
          <tr>
            {cols.map((c, i) => {
              const label = typeof c === 'string' ? c : c.label
              const align = typeof c === 'string' ? undefined : c.align
              return (
                <th key={`${label}-${i}`} style={align ? { textAlign: align } : undefined}>
                  {label}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

/* ---------- list rows ---------- */

export function ListRow({
  icon,
  tone = 'blue',
  title,
  sub,
  action,
  style,
}: {
  icon: ReactNode
  tone?: BadgeTone
  title: ReactNode
  sub?: ReactNode
  action?: ReactNode
  style?: CSSProperties
}) {
  return (
    <div className="lrow" style={style}>
      <div className={`lico b-${tone}`}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div className="lt">{title}</div>
        {sub ? <div className="ls">{sub}</div> : null}
      </div>
      {action}
    </div>
  )
}

/* ---------- form-ish atoms ---------- */

export function Checkbox({ on }: { on: boolean }) {
  return (
    <div className={`cb ${on ? 'on' : ''}`}>
      {on ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : null}
    </div>
  )
}

export function Toggle({ on }: { on: boolean }) {
  return <div className={`tg ${on ? 'on' : ''}`} />
}

/* ---------- modal (1:1 port of the prototype's openModal/closeModal) ---------- */

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal">
        <div className="modal-h">
          <h3>{title}</h3>
          <span className="modal-x" onClick={onClose} role="button" tabIndex={0} aria-label="Close">
            ✕
          </span>
        </div>
        <div className="modal-b">{children}</div>
        {footer ? <div className="modal-f">{footer}</div> : null}
      </div>
    </div>
  )
}

/* ---------- field (1:1 port of the prototype's fld() helper) ---------- */

export function Fld({
  id,
  label,
  children,
}: {
  id: string
  label: ReactNode
  children: ReactNode
}) {
  return (
    <label className="fld" htmlFor={id}>
      <span>{label}</span>
      {children}
    </label>
  )
}

/* ---------- search field (topbar + in-card) ---------- */

export function SearchField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  width,
  kbd,
  flex,
}: {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  ariaLabel?: string
  width?: number | string
  kbd?: string
  flex?: boolean
}) {
  return (
    <div className="search" style={{ ...(width ? { width, maxWidth: width } : null), ...(flex ? { flex: 1, maxWidth: 'none' } : null) }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
      />
      {kbd ? <span className="kbd">{kbd}</span> : null}
    </div>
  )
}
