'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getAuthenticatedAppContext } from '@/lib/api/authenticated-client'
import { setActiveStoreId } from '@/lib/store-context'

type ActivationState = 'verifying' | 'expired' | 'failed'

/**
 * Landing page for the "Activate your store" email sent from the mobile app.
 * The single-use Supabase token arrives in the fragment (never sent to a
 * server), is removed from the address bar immediately, and signs the owner in
 * so they reach the plans page without typing an email or code.
 */
export default function ActivatePage() {
  const router = useRouter()
  const started = useRef(false)
  const [state, setState] = useState<ActivationState>('verifying')

  useEffect(() => {
    // The token is single use; React strict mode must not spend it twice.
    if (started.current) return
    started.current = true

    const params = new URLSearchParams(window.location.hash.slice(1))
    window.history.replaceState(null, '', window.location.pathname)
    const tokenHash = params.get('token_hash')
    const region = params.get('region') === 'INTL' ? 'INTL' : 'IN'
    if (!tokenHash) {
      setState('expired')
      return
    }

    void (async () => {
      // Never carry another business's counter identity or store scope into
      // this owner's session.
      window.sessionStorage.removeItem('operatorToken')
      window.sessionStorage.removeItem('registerLocked')
      setActiveStoreId(null)

      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
      if (error) {
        setState('expired')
        return
      }
      try {
        await getAuthenticatedAppContext()
      } catch {
        setState('failed')
        return
      }
      router.replace(region === 'INTL' ? '/plans?region=INTL&return=app' : '/plans?return=app')
    })()
  }, [router])

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px 16px' }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: 28 }}>
        {state === 'verifying' && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Signing you in…</h1>
            <p style={{ color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>Taking you to your Ambel POS plans.</p>
          </>
        )}
        {state === 'expired' && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>This link has expired</h1>
            <p style={{ color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>
              Activation links work once and expire after a short time. Open the Ambel POS app and tap
              {' '}<strong>Resend email</strong> to get a new one.
            </p>
          </>
        )}
        {state === 'failed' && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>We couldn&apos;t open your store</h1>
            <p style={{ color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>
              You&apos;re signed in, but your store details didn&apos;t load. Check your connection, then open the
              Ambel POS app and tap <strong>Resend email</strong>.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
