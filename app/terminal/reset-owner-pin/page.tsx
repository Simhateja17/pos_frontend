'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type LinkState = 'checking' | 'ready' | 'expired'

export default function ResetOwnerPinPage() {
  const [linkState, setLinkState] = useState<LinkState>('checking')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setLinkState(data.session ? 'ready' : 'expired')
    })
    return () => { cancelled = true }
  }, [])

  async function savePin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pin.length !== 4 || pin !== confirmPin) {
      setError('Enter the same four-digit PIN twice.')
      return
    }
    setError(null)
    setIsSaving(true)
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    const { error: requestError } = await apiClient.POST('/auth/owner-pin-recovery/confirm', {
      body: { pin },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    setIsSaving(false)
    if (requestError) {
      setError((requestError as { error?: string }).error ?? 'This recovery link is invalid or has expired.')
      return
    }
    setSaved(true)
  }

  return (
    <main className="min-h-screen bg-[#FFFDF7] px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <Card className="w-full border-[#DDE5EF] bg-white shadow-[0_18px_55px_rgba(28,45,72,0.10)]">
          <CardHeader className="border-b border-[#E8EDF3] bg-[#FBFCFE] px-6 py-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#0058BA]">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0058BA]">Owner recovery</p>
                <h1 className="mt-1 text-2xl font-semibold text-[#172033]">Create a new owner PIN</h1>
                <p className="mt-2 text-sm leading-6 text-[#64748B]">This replaces your old register PIN. Your existing owner register sessions will be locked.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 py-6">
            {linkState === 'checking' && <p className="text-sm text-[#64748B]">Verifying your secure recovery link…</p>}
            {linkState === 'expired' && (
              <div className="flex flex-col gap-4">
                <Alert variant="destructive"><AlertDescription>This recovery link is invalid or has expired. Request a fresh one to continue.</AlertDescription></Alert>
                <Button asChild className="h-11 bg-[#0058BA] text-white hover:bg-[#004A9D]"><Link href="/terminal/forgot-owner-pin">Request a new link</Link></Button>
              </div>
            )}
            {linkState === 'ready' && (saved ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-[#CFE6DA] bg-[#F1FBF5] px-4 py-4 text-sm leading-6 text-[#276749]"><span className="mb-2 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Owner PIN updated</span>Your new PIN is ready. Return to the register and use it to unlock the counter.</div>
                <Button asChild className="h-11 bg-[#0058BA] text-white hover:bg-[#004A9D]"><Link href="/terminal/pin">Return to register</Link></Button>
              </div>
            ) : (
              <form onSubmit={savePin} className="flex flex-col gap-5">
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="flex flex-col gap-2"><Label htmlFor="new-owner-pin">New four-digit PIN</Label><Input id="new-owner-pin" type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{4}" maxLength={4} required value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} /></div>
                <div className="flex flex-col gap-2"><Label htmlFor="confirm-owner-pin">Confirm new PIN</Label><Input id="confirm-owner-pin" type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{4}" maxLength={4} required value={confirmPin} onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 4))} /></div>
                <Button type="submit" disabled={isSaving || pin.length !== 4 || confirmPin.length !== 4} className="h-11 bg-[#0058BA] text-white hover:bg-[#004A9D]">{isSaving ? 'Saving new PIN…' : 'Save new owner PIN'}</Button>
              </form>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
