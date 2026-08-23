/*
 * US edition mirror of app/app/orders/[saleId]/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
import { SaleDetailView } from '@/components/records/sale-detail-view'

export default function SaleDetailPage({ params }: { params: { saleId: string } }) {
  return <SaleDetailView saleId={params.saleId} />
}
