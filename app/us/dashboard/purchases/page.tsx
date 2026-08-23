/*
 * US edition mirror of app/app/purchases/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
import { PurchasesView } from '@/components/records/purchases-view'

export default function PurchasesPage() { return <PurchasesView /> }
