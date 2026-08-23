/*
 * US edition mirror of app/app/stores/[storeId]/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
import { StoreWorkspace } from '@/components/records/store-workspace'

export default function StorePage({ params }: { params: { storeId: string } }) {
  return <StoreWorkspace storeId={params.storeId} />
}
