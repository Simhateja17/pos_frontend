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
