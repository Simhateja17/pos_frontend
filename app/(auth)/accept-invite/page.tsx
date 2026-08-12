'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

type SessionState = 'loading' | 'present' | 'absent'

const GENERIC_ERROR = 'Something went wrong. Try again.'

function labelStyle() {
  return {
    fontSize: '13px',
    fontWeight: 700 as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  }
}

export default function AcceptInvitePage() {
  const router = useRouter()
  const [sessionState, setSessionState] = useState<SessionState>('loading')

  const [password, setPassword] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const [pin, setPin] = useState('')
  const [pinSaved, setPinSaved] = useState(false)
  const [pinError, setPinError] = useState<string | null>(null)
  const [isSavingPin, setIsSavingPin] = useState(false)

  useEffect(() => {
    let cancelled = false

    // Supabase JS v2's client (detectSessionInUrl: true by default) automatically
    // exchanges the invite link's token for a real session on page load. This page
    // never hand-parses the URL's raw token itself: it only waits for the SDK's
    // own token-exchange result.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSessionState(data.session ? 'present' : 'absent')
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      if (session) setSessionState('present')
    })

    // If no session ever establishes (invalid/expired link), stop waiting after a
    // short grace period so the fallback copy renders instead of an infinite spinner.
    const timeout = setTimeout(() => {
      if (cancelled) return
      setSessionState((current) => (current === 'loading' ? 'absent' : current))
    }, 5000)

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (passwordSaved && pinSaved) {
      router.push('/')
    }
  }, [passwordSaved, pinSaved, router])

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError(null)
    setIsSavingPassword(true)

    const { error } = await supabase.auth.updateUser({ password })

    setIsSavingPassword(false)

    if (error) {
      setPasswordError(GENERIC_ERROR)
      return
    }

    setPasswordSaved(true)
  }

  async function handlePinSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPinError(null)
    setIsSavingPin(true)

    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    const { error } = await apiClient.POST('/auth/set-pin', {
      body: { pin },
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    })

    setIsSavingPin(false)

    if (error) {
      setPinError(GENERIC_ERROR)
      return
    }

    setPinSaved(true)
  }

  return (
    // Centring lives here rather than in the shared auth layout: this surface is
    // a lone card, unlike the login/signup shell which is a full-screen layout.
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-10 sm:py-16">
      <Card className="w-full max-w-[400px]" style={{ backgroundColor: '#FFFFFF' }}>
        <CardHeader>
          <h1
            className="mb-2"
            style={{
              fontFamily: 'Sora, sans-serif',
              fontSize: '28px',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            Welcome to the team
          </h1>
          {sessionState === 'present' && (
            <p className="text-sm" style={{ color: '#64748B' }}>
              Set a password and PIN to finish activating your account.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {sessionState === 'loading' && (
            <p className="text-sm" style={{ color: '#64748B' }}>
              Activating your invite…
            </p>
          )}

          {sessionState === 'absent' && (
            <Alert variant="destructive">
              <AlertDescription>
                This invite link is invalid or has expired. Ask your manager to send a
                new one.
              </AlertDescription>
            </Alert>
          )}

          {sessionState === 'present' && (
            <div className="flex flex-col gap-6">
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                <h2
                  style={{
                    fontFamily: 'Sora, sans-serif',
                    fontSize: '20px',
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  Set a password
                </h2>
                {passwordError && (
                  <Alert variant="destructive">
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}
                {passwordSaved ? (
                  <p className="text-sm" style={{ color: '#0058BA' }}>
                    Password set.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="password" style={labelStyle()}>
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSavingPassword}
                      className="w-full"
                      style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
                    >
                      Save password
                    </Button>
                  </>
                )}
              </form>

              <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
                <h2
                  style={{
                    fontFamily: 'Sora, sans-serif',
                    fontSize: '20px',
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  Set your 4-digit PIN
                </h2>
                {pinError && (
                  <Alert variant="destructive">
                    <AlertDescription>{pinError}</AlertDescription>
                  </Alert>
                )}
                {pinSaved ? (
                  <p className="text-sm" style={{ color: '#0058BA' }}>
                    PIN set.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="pin" style={labelStyle()}>
                        PIN
                      </Label>
                      <Input
                        id="pin"
                        inputMode="numeric"
                        pattern="\d{4}"
                        maxLength={4}
                        required
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSavingPin || pin.length !== 4}
                      className="w-full"
                      style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
                    >
                      Save PIN
                    </Button>
                  </>
                )}
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
