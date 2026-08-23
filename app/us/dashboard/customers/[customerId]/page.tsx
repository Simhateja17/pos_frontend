/*
 * US edition mirror of app/app/customers/[customerId]/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
import { CustomerDetailView } from '@/components/customers/customer-detail'

export default function CustomerDetailPage({ params }: { params: { customerId: string } }) {
  return <CustomerDetailView customerId={params.customerId} />
}
