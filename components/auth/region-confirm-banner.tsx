import Link from 'next/link'
import type { MarketingRegion } from '@/lib/marketing/region'
import styles from './india-auth.module.css'

const OTHER_REGION: Record<MarketingRegion, MarketingRegion> = { IN: 'INTL', INTL: 'IN' }
const LABEL: Record<MarketingRegion, string> = { IN: 'India', INTL: 'International' }

// The one moment region-detection accuracy actually matters (per the
// grilling session): browsing a wrong price is a one-click fix, but an
// account created in the wrong region can never move afterward (each region
// is a fully separate backend/database). So this is a visible, explicit
// confirmation, never a silent inheritance from whatever the marketing page
// auto-detected.
export function RegionConfirmBanner({ region, currentPath }: { region: MarketingRegion; currentPath: string }) {
  const other = OTHER_REGION[region]
  return (
    <div className={styles.alert} role="status" style={{ background: 'var(--surface-2, #f4f4f5)', color: 'inherit' }}>
      Creating your account for <strong>{LABEL[region]}</strong>.{' '}
      <Link className={styles.link} href={`${currentPath}?region=${other}`}>Not right? Switch to {LABEL[other]}</Link>
    </div>
  )
}
