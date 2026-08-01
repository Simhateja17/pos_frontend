import { redirect } from 'next/navigation'

/**
 * The onboarding wizard is gone. Business identity and tax registration are
 * captured at signup; everything else is set up in-context from the dashboard's
 * setup prompt. Any bookmark or stale link lands on the dashboard.
 */
export default function OnboardingIndexPage() {
  redirect('/app/dashboard')
}
