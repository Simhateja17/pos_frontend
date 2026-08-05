'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { establishSession } from '@/components/auth/india-auth-shell'
import './auth.css'

type Mode = 'login' | 'signup'

type SignupFields = {
  ownerName: string
  businessName: string
  email: string
  password: string
  addressLine1: string
  city: string
  state: string
  postalCode: string
}

const initialSignup: SignupFields = {
  ownerName: '', businessName: '', email: '', password: '', addressLine1: '', city: '', state: '', postalCode: '',
}

function responseMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'error' in error) {
    const message = (error as { error?: unknown }).error
    if (typeof message === 'string' && message) return message
  }
  return fallback
}

export default function USAuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signup, setSignup] = useState<SignupFields>(initialSignup)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const { data, error: requestError } = await apiClient.POST('/auth/login', { body: { email, password } })
      if (requestError || !data?.session) throw new Error(responseMessage(requestError, 'Invalid email or password.'))
      const session = await establishSession(data.session)
      if (!session.ok) throw new Error(session.message)
      router.push('/us/onboarding/1')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in is unavailable right now.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!agreed) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.')
      return
    }
    setBusy(true)
    try {
      const { data, error: requestError } = await apiClient.POST('/auth/signup', {
        body: {
          ownerName: signup.ownerName,
          businessName: signup.businessName,
          email: signup.email,
          password: signup.password,
          addressLine1: signup.addressLine1,
          city: signup.city,
          state: signup.state,
          postalCode: signup.postalCode,
          country: 'US',
        },
      })
      if (requestError || !data?.session) throw new Error(responseMessage(requestError, 'We could not create your account right now.'))
      const session = await establishSession(data.session)
      if (!session.ok) throw new Error(session.message)
      router.push('/us/onboarding/1')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not create your account right now.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="bg-orbs"><div className="orb orb-1" /><div className="orb orb-2" /></div>
      <div className="page">
        <div className="auth-card">
          <div className="auth-logo"><div className="auth-logo-mark">CP</div><span>Couture POS · US</span></div>
          <div className="tab-switcher">
            <button type="button" className={`tab-btn${mode === 'login' ? ' active' : ''}`} onClick={() => switchMode('login')}>Sign in</button>
            <button type="button" className={`tab-btn${mode === 'signup' ? ' active' : ''}`} onClick={() => switchMode('signup')}>Create account</button>
          </div>
          {error && <p role="alert" style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 10, fontSize: 13, marginBottom: 16 }}>{error}</p>}
          {mode === 'login' ? (
            <>
              <h1>Welcome back</h1>
              <p className="subtitle">Sign in to continue to your paid subscription setup.</p>
              <form onSubmit={handleLogin}>
                <div className="form-group"><label htmlFor="us-login-email">Email</label><input id="us-login-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
                <div className="form-group"><label htmlFor="us-login-password">Password</label><input id="us-login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" /></div>
                <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in →'}</button>
              </form>
            </>
          ) : (
            <>
              <h1>Create account</h1>
              <p className="subtitle">Create your account, then choose a paid USD subscription to activate your store.</p>
              <form onSubmit={handleSignup}>
                <div className="form-group"><label htmlFor="us-name">Full name</label><input id="us-name" required autoComplete="name" value={signup.ownerName} onChange={(event) => setSignup((current) => ({ ...current, ownerName: event.target.value }))} placeholder="Jane Doe" /></div>
                <div className="form-group"><label htmlFor="us-business">Business name</label><input id="us-business" required value={signup.businessName} onChange={(event) => setSignup((current) => ({ ...current, businessName: event.target.value }))} placeholder="My Boutique LLC" /></div>
                <div className="form-group"><label htmlFor="us-email">Email</label><input id="us-email" type="email" required autoComplete="email" value={signup.email} onChange={(event) => setSignup((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" /></div>
                <div className="form-group"><label htmlFor="us-password">Password</label><input id="us-password" type="password" minLength={8} required autoComplete="new-password" value={signup.password} onChange={(event) => setSignup((current) => ({ ...current, password: event.target.value }))} placeholder="At least 8 characters" /></div>
                <div className="form-group"><label htmlFor="us-address">Business address</label><input id="us-address" required value={signup.addressLine1} onChange={(event) => setSignup((current) => ({ ...current, addressLine1: event.target.value }))} placeholder="100 Congress Ave" /></div>
                <div className="form-group"><label htmlFor="us-city">City</label><input id="us-city" required value={signup.city} onChange={(event) => setSignup((current) => ({ ...current, city: event.target.value }))} placeholder="Austin" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group"><label htmlFor="us-state">State</label><input id="us-state" required value={signup.state} onChange={(event) => setSignup((current) => ({ ...current, state: event.target.value }))} placeholder="Texas" /></div>
                  <div className="form-group"><label htmlFor="us-postal">ZIP code</label><input id="us-postal" required value={signup.postalCode} onChange={(event) => setSignup((current) => ({ ...current, postalCode: event.target.value }))} placeholder="78701" /></div>
                </div>
                <div className="form-check"><input id="us-terms" type="checkbox" required checked={agreed} onChange={(event) => setAgreed(event.target.checked)} /><label htmlFor="us-terms" style={{ margin: 0, letterSpacing: 'normal', textTransform: 'none' }}>I agree to the Terms of Service and Privacy Policy</label></div>
                <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Creating account…' : 'Create account →'}</button>
              </form>
            </>
          )}
          <p className="auth-link"><a href="/us">← Back to US retail</a></p>
        </div>
      </div>
    </div>
  )
}
