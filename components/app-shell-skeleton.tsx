'use client'

/**
 * Loading placeholders for the app shell.
 *
 * The shell re-checks the register lock and reloads store context on every
 * route change. That work used to replace the entire screen with a centred
 * "Opening register…" line, so the sidebar and topbar blinked out between
 * pages. These skeletons let the chrome stay put and only the parts that are
 * genuinely unknown shimmer.
 */
import { KpiSkeleton, Sk } from '@/components/couture/states'

/** Rows per nav group. Fixed, not random: the markup has to match on the server. */
const NAV_GROUPS = [4, 5, 4]
/** Deterministic label widths so the rows look like a menu, not a barcode. */
const LABEL_WIDTHS = ['72%', '58%', '81%', '64%', '76%']

/**
 * Sidebar rows shown until the signed-in role is known. The menu is filtered by
 * role, so rendering real items before context arrives would flash entries a
 * cashier is not allowed to see.
 */
export function ShellNavSkeleton() {
  return (
    <div aria-hidden="true" style={{ pointerEvents: 'none' }}>
      {NAV_GROUPS.map((rows, group) => (
        <div key={group}>
          <div className="sb-group">
            <Sk w={68} h={8} r={4} />
          </div>
          {Array.from({ length: rows }, (_, row) => (
            <div className="nav-item" key={row}>
              <Sk w={17} h={17} r={5} style={{ flexShrink: 0 }} />
              <Sk w={LABEL_WIDTHS[(group + row) % LABEL_WIDTHS.length]} h={9} r={5} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Page-shaped placeholder for `<main>`: heading, actions, KPI row and a table
 * card, i.e. the layout nearly every app screen opens with. Keeping the shape
 * means the real page settles into place instead of shoving the view around.
 */
export function ShellContentSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading page">
      <div className="page-head">
        <div>
          <Sk w={208} h={22} r={7} />
          <Sk w={272} h={11} r={5} style={{ marginTop: 10 }} />
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Sk w={104} h={36} r={9} />
          <Sk w={128} h={36} r={9} />
        </div>
      </div>

      <KpiSkeleton cols={4} />

      <div className="card">
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <Sk w={164} h={13} r={6} />
        </div>
        <div style={{ padding: '14px 16px' }}>
          {Array.from({ length: 6 }, (_, row) => (
            <Sk key={row} h={42} r={9} style={{ marginBottom: 8 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
