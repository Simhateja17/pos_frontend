/*
 * US edition mirror of app/app/inventory/catalog/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// The catalog list now lives on /app/inventory itself, so this route just
// forwards there rather than keeping a second, identical product table.
export default function CatalogPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/app/inventory')
  }, [router])

  return null
}
