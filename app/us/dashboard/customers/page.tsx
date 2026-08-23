/*
 * US edition mirror of app/app/customers/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
import { CustomersView } from '@/components/records/customers-view'

export default function CustomersPage() { return <CustomersView /> }
