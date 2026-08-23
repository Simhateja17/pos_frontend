/*
 * US edition mirror of app/app/settings/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
import { SettingsView } from '@/components/settings/settings-view'

export default function SettingsPage() {
  return <SettingsView />
}
