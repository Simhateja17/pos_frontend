import Link from 'next/link'
import { MembersView } from '@/components/members/members-view'

export default function FirstCounterPinPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#FFFDF7', padding: '28px clamp(16px, 4vw, 48px)' }}>
      <div style={{ margin: '0 auto', maxWidth: 1180 }}>
        <Link
          href="/terminal/pin"
          style={{ display: 'inline-block', marginBottom: 18, color: '#0058BA', fontSize: 13, fontWeight: 600 }}
        >
          ← Back to register
        </Link>
        <MembersView firstPinSetup />
      </div>
    </main>
  )
}
