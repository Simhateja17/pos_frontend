/*
 * US edition mirror of app/app/settings/members/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
import { MembersView } from '@/components/members/members-view'

export default function IndiaMembersPage() { return <MembersView /> }
