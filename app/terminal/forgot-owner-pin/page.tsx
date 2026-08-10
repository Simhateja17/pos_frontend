'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Mail, ShieldCheck } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotOwnerPinPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function requestRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const { error: requestError } = await apiClient.POST('/auth/owner-pin-recovery/request', {
      body: { email: email.trim() },
    })

    setIsSubmitting(false)
    if (requestError) {
      setError((requestError as { error?: string }).error ?? 'Could not send the recovery email. Please try again shortly.')
      return
    }
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-[#FFFDF7] px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <Card className="w-full border-[#DDE5EF] bg-white shadow-[0_18px_55px_rgba(28,45,72,0.10)]">
          <CardHeader className="border-b border-[#E8EDF3] bg-[#FBFCFE] px-6 py-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#0058BA]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0058BA]">Owner recovery</p>
                <h1 className="mt-1 text-2xl font-semibold text-[#172033]">Forgot owner PIN?</h1>
                <p className="mt-2 text-sm leading-6 text-[#64748B]">
                  Verify your owner email and we&apos;ll send a secure link to set a new four-digit register PIN.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 py-6">
            {submitted ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-[#CFE6DA] bg-[#F1FBF5] px-4 py-4 text-sm leading-6 text-[#276749]">
                  <div className="mb-2 flex items-center gap-2 font-semibold"><Mail className="h-4 w-4" /> Check your email</div>
                  If this email belongs to an Ambel POS owner, a secure recovery link is on its way. Open that link to choose a new PIN.
                </div>
                <p className="text-xs leading-5 text-[#64748B]">The link is single-use and expires quickly. Check spam if you do not see it.</p>
                <Button asChild variant="outline" className="h-11"><Link href="/terminal/pin">Back to register</Link></Button>
              </div>
            ) : (
              <form onSubmit={requestRecovery} className="flex flex-col gap-5">
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="owner-email">Owner email address</Label>
                  <Input
                    id="owner-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="owner@yourstore.com"
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="h-11 bg-[#0058BA] text-white hover:bg-[#004A9D]">
                  {isSubmitting ? 'Sending recovery link…' : 'Email recovery link'}
                </Button>
                <Link href="/terminal/pin" className="text-center text-sm font-medium text-[#0058BA] hover:underline">Back to register</Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
