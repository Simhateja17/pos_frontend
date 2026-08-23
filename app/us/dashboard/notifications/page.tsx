/*
 * US edition mirror of app/app/notifications/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
import { NotificationsView } from '@/components/notifications/notifications-view'

export default function NotificationsPage() {
  return <NotificationsView />
}
