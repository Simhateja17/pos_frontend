/*
 * US edition mirror of app/app/payments/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
import { PaymentsView } from '@/components/records/payments-view'

export default function PaymentsPage() { return <PaymentsView /> }
