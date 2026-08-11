import { CustomerDetailView } from '@/components/customers/customer-detail'

export default function CustomerDetailPage({ params }: { params: { customerId: string } }) {
  return <CustomerDetailView customerId={params.customerId} />
}
