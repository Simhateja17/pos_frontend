/*
 * US edition mirror of app/app/email/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
import { EmailView } from '@/components/comms/email-view'

export default function EmailPage() { return <EmailView /> }
