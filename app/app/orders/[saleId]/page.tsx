import { SaleDetailView } from '@/components/records/sale-detail-view'

export default function SaleDetailPage({ params }: { params: { saleId: string } }) {
  return <SaleDetailView saleId={params.saleId} />
}
