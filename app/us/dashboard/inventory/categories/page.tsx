/*
 * US edition mirror of app/app/inventory/categories/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
import { CategoriesView } from '@/components/inventory/categories-view'

export default function CategoriesPage() {
  return <CategoriesView />
}
