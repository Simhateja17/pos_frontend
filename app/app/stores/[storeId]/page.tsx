import { StoreWorkspace } from '@/components/records/store-workspace'

export default function StorePage({ params }: { params: { storeId: string } }) {
  return <StoreWorkspace storeId={params.storeId} />
}
