/*
 * US edition mirror of app/app/settings/terminals/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
import { TerminalsView } from '@/components/settings/terminals-view'

export default function TerminalsPage() {
  return <TerminalsView />
}
