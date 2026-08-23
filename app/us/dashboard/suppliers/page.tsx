/*
 * US edition mirror of app/app/suppliers/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
import { SuppliersView } from '@/components/records/suppliers-view'

export default function SuppliersPage() { return <SuppliersView /> }
