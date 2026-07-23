'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setResetMessage(null)
    setIsSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsSubmitting(false)

    if (signInError) {
      setError('Invalid email or password')
      return
    }

    // Real post-login destination (owner/manager dashboard) lands in a later
    // phase (Phase 7). Redirect to the app root as a placeholder authenticated
    // route for now.
    router.push('/')
  }

  async function handleForgotPassword() {
    setError(null)
    setResetMessage(null)

    if (!email) {
      setError('Enter your email above first, then click "Forgot password?"')
      return
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)

    if (resetError) {
      setError('Invalid email or password')
      return
    }

    setResetMessage('Check your email for a password reset link.')
  }

  return (
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
          Log in
        </h1>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {resetMessage && (
          <Alert className="mb-4">
            <AlertDescription>{resetMessage}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="email"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="password"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="self-start text-sm"
            style={{ color: '#0058BA' }}
          >
            Forgot password?
          </button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
          >
            Log in
          </Button>
          <p className="text-center text-sm" style={{ color: '#64748B' }}>
            Don&apos;t have an account?{' '}
            <a href="/signup" style={{ color: '#0058BA' }}>
              Sign up
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
