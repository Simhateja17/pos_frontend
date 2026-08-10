import { redirect } from 'next/navigation'

/**
 * The onboarding wizard is gone. Business identity and tax registration are
 * captured at signup; everything else is set up in-context from the dashboard's
 * setup prompt. A stale link returns to the paid subscription step.
 */
export default function OnboardingIndexPage() {
  redirect('/plans')
}
