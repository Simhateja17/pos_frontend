/*
 * US edition mirror of app/app/setup/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
import { GuidedSetupView } from '@/components/setup/guided-setup-view'

export default function SetupPage() {
  return <GuidedSetupView />
}
