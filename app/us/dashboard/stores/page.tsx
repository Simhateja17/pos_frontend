/*
 * US edition mirror of app/app/stores/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
import { StoresView } from '@/components/records/stores-view'

export default function StoresPage() { return <StoresView /> }
