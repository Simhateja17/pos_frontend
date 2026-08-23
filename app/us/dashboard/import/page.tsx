/*
 * US edition mirror of app/app/import/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
import { ImportView } from '@/components/import/import-view'

export default function ImportPage() { return <ImportView /> }
