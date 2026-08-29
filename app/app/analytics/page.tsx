import { redirect } from 'next/navigation'

/** Preserve old bookmarks after Analytics became the Demand Planning home. */
export default function AnalyticsRedirect() {
  redirect('/app/demand-planning')
}
