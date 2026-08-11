'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { MembersView } from '@/components/members/members-view'

function safeReturnTo(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  return value
}

export default function FirstCounterPinPage() {
  const [returnTo, setReturnTo] = useState('/terminal/pin')
  useEffect(() => {
    const value = safeReturnTo(new URLSearchParams(window.location.search).get('returnTo'))
    if (value) setReturnTo(value)
  }, [])
  return (
    <main style={{ minHeight: '100vh', background: '#FFFDF7', padding: '28px clamp(16px, 4vw, 48px)' }}>
      <div style={{ margin: '0 auto', maxWidth: 1180 }}>
        <Link
          href={returnTo === '/terminal/pin' ? '/terminal/pin' : { pathname: '/terminal/pin', query: { returnTo } }}
          style={{ display: 'inline-block', marginBottom: 18, color: '#0058BA', fontSize: 13, fontWeight: 600 }}
        >
          ← Back to register
        </Link>
        <MembersView firstPinSetup returnTo={returnTo} />
      </div>
    </main>
  )
}
