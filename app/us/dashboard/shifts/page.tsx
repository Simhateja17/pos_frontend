/*
 * US edition mirror of app/app/shifts/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
import { ShiftsView } from '@/components/shifts/shifts-view'

export default function IndiaShiftsPage() { return <ShiftsView /> }
