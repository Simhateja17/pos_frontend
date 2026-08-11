import { redirect } from 'next/navigation'

/**
 * Compatibility route for emailed/old onboarding links. Readiness is now
 * server-derived and per-store, so the legacy completion screen is no longer
 * a source of truth.
 */
export default function OnboardingCompleteRedirect() {
  redirect('/app/setup')
}
