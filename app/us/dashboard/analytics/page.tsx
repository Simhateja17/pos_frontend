import { redirect } from 'next/navigation'

/** Preserve old US bookmarks after Analytics became the Demand Planning home. */
export default function AnalyticsRedirect() {
  redirect('/us/dashboard/demand-planning')
}
