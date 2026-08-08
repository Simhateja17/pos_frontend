import { redirect } from 'next/navigation'

// `/app` used to expose the legacy all-modules prototype outside the real
// role-aware shell. Enter the operational application through Billing so the
// paired-device lock and staff role guard always run.
export default function AppPage() {
  redirect('/app/billing')
}
