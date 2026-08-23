'use client'

/*
 * US sign-in / sign-up.
 *
 * Renders through `InternationalAuthShell` and the same `india-auth.module.css`
 * design system as the India login and signup screens, so the two editions
 * stay visually identical. Only the fields (state / ZIP instead of state /
 * PIN code, no GSTIN) and the destination routes are market-specific.
 */

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { InternationalAuthShell, establishSession } from '@/components/auth/india-auth-shell'
import { resolveUSPostAuthDestination, US_CHECKOUT_PATH } from '@/lib/billing/post-auth-destination'
import styles from '@/components/auth/india-auth.module.css'

type Mode = 'login' | 'signup'

type SignupFields = {
  ownerName: string
  businessName: string
  email: string
  addressLine1: string
  city: string
  state: string
  postalCode: string
}

const initialSignup: SignupFields = {
  ownerName: '', businessName: '', email: '', addressLine1: '', city: '', state: '', postalCode: '',
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
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [signup, setSignup] = useState<SignupFields>(initialSignup)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setOtpSent(false)
    setOtp('')
  }

  function updateSignup(field: keyof SignupFields, value: string) {
    setSignup((current) => ({ ...current, [field]: value }))
  }

  async function handleSendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const purpose = mode === 'login' ? 'login' : 'signup'
      const requestEmail = mode === 'login' ? email : signup.email
      if (mode === 'signup' && !agreed) throw new Error('Please accept the Terms of Service and Privacy Policy to continue.')
      const { error: requestError } = await apiClient.POST('/auth/otp/request', { body: { email: requestEmail, purpose } })
      if (requestError) throw new Error(responseMessage(requestError, 'We could not send a code right now.'))
      setOtpSent(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not send a code right now.')
    } finally {
      setBusy(false)
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const { data, error: requestError } = await apiClient.POST('/auth/login', { body: { email, otp } })
      if (requestError || !data?.session) throw new Error(responseMessage(requestError, 'Invalid or expired code.'))
      const session = await establishSession(data.session)
      if (!session.ok) throw new Error(session.message)
      // Only a tenant without an active entitlement belongs in checkout, so
      // resolve the destination instead of assuming every sign-in is a first
      // one. See lib/billing/post-auth-destination.
      const destination = await resolveUSPostAuthDestination()
      if (session.requiresPin) {
        router.replace(`/terminal/pin?returnTo=${encodeURIComponent(destination)}`)
        return
      }
      router.push(destination)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in is unavailable right now.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const { data, error: requestError } = await apiClient.POST('/auth/signup', {
        body: {
          ownerName: signup.ownerName,
          businessName: signup.businessName,
          email: signup.email,
          otp,
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
      if (session.requiresPin) {
        router.replace(`/terminal/pin?returnTo=${encodeURIComponent(US_CHECKOUT_PATH)}`)
        return
      }
      router.push(US_CHECKOUT_PATH)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not create your account right now.')
    } finally {
      setBusy(false)
    }
  }

  const otpField = (id: string) => (
    <label className={styles.field}>
      <span className={styles.label}>6-digit code<span className={styles.required}>*</span></span>
      <input
        className={styles.input}
        id={id}
        type="text"
        inputMode="numeric"
        pattern="\d{6}"
        maxLength={6}
        placeholder="123456"
        autoComplete="one-time-code"
        required
        value={otp}
        onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
      />
    </label>
  )

  return (
    <InternationalAuthShell mode={mode === 'login' ? 'login' : 'signup'}>
      <h1 className={styles.heading}>
        {mode === 'login' ? 'Good to have you back.' : 'Create your store account.'}
      </h1>
      <p className={styles.subheading}>
        {mode === 'login'
          ? 'Enter your store credentials to continue.'
          : 'Create your account, then choose a paid USD subscription to activate your store.'}
      </p>

      <div className={styles.tabs} role="tablist" aria-label="Authentication mode">
        <button
          className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
          role="tab"
          aria-selected={mode === 'login'}
          type="button"
          onClick={() => switchMode('login')}
        >
          Sign in
        </button>
        <button
          className={`${styles.tab} ${mode === 'signup' ? styles.tabActive : ''}`}
          role="tab"
          aria-selected={mode === 'signup'}
          type="button"
          onClick={() => switchMode('signup')}
        >
          Create account
        </button>
      </div>

      {error && <div className={styles.alert} role="alert" aria-live="polite">{error}</div>}

      {mode === 'login' ? (
        !otpSent ? (
          <form onSubmit={handleSendOtp}>
            <label className={styles.field}>
              <span className={styles.label}>Email address<span className={styles.required}>*</span></span>
              <input
                className={styles.input}
                id="us-login-email"
                type="email"
                placeholder="owner@yourstore.com"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError(null) }}
              />
            </label>
            <button className={styles.primary} type="submit" disabled={busy}>
              {busy ? 'Sending code…' : 'Send code →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <label className={styles.field}>
              <span className={styles.label}>Email address</span>
              <input className={styles.input} type="email" value={email} disabled />
            </label>
            {otpField('us-login-otp')}
            <div className={styles.rememberRow}>
              <button className={styles.link} type="button" onClick={() => { setOtpSent(false); setOtp(''); setError(null) }}>
                Use a different email
              </button>
            </div>
            <button className={styles.primary} type="submit" disabled={busy || otp.length !== 6}>
              {busy ? 'Verifying…' : 'Sign in →'}
            </button>
          </form>
        )
      ) : !otpSent ? (
        <form onSubmit={handleSendOtp}>
          <label className={styles.field}>
            <span className={styles.label}>Full name<span className={styles.required}>*</span></span>
            <input className={styles.input} id="us-name" placeholder="Jane Doe" autoComplete="name" required value={signup.ownerName} onChange={(event) => updateSignup('ownerName', event.target.value)} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Business name<span className={styles.required}>*</span></span>
            <input className={styles.input} id="us-business" placeholder="My Boutique LLC" required value={signup.businessName} onChange={(event) => updateSignup('businessName', event.target.value)} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Email address<span className={styles.required}>*</span></span>
            <input className={styles.input} id="us-email" type="email" placeholder="owner@yourstore.com" autoComplete="email" required value={signup.email} onChange={(event) => updateSignup('email', event.target.value)} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Business address<span className={styles.required}>*</span></span>
            <input className={styles.input} id="us-address" placeholder="100 Congress Ave" required value={signup.addressLine1} onChange={(event) => updateSignup('addressLine1', event.target.value)} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>City<span className={styles.required}>*</span></span>
            <input className={styles.input} id="us-city" placeholder="Austin" required value={signup.city} onChange={(event) => updateSignup('city', event.target.value)} />
          </label>
          {/* `actions` is the module's two-column row; the same pairing India
              uses for City / State and PIN code / GSTIN. */}
          <div className={styles.actions}>
            <label className={styles.field}>
              <span className={styles.label}>State<span className={styles.required}>*</span></span>
              <input className={styles.input} id="us-state" placeholder="Texas" required value={signup.state} onChange={(event) => updateSignup('state', event.target.value)} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>ZIP code<span className={styles.required}>*</span></span>
              <input className={styles.input} id="us-postal" inputMode="numeric" placeholder="78701" required value={signup.postalCode} onChange={(event) => updateSignup('postalCode', event.target.value)} />
            </label>
          </div>
          <label className={styles.agreement}>
            <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
            <span>
              I agree to Ambel POS <Link className={styles.link} href="/us/terms">Terms of Service</Link> and{' '}
              <Link className={styles.link} href="/us/privacy">Privacy Policy</Link>
            </span>
          </label>
          <button className={styles.primary} type="submit" disabled={busy}>
            {busy ? 'Sending code…' : 'Send code →'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignup}>
          <label className={styles.field}>
            <span className={styles.label}>Email address</span>
            <input className={styles.input} type="email" value={signup.email} disabled />
          </label>
          {otpField('us-signup-otp')}
          <div className={styles.rememberRow}>
            <button className={styles.link} type="button" onClick={() => { setOtpSent(false); setOtp(''); setError(null) }}>
              Edit your details
            </button>
          </div>
          <button className={styles.primary} type="submit" disabled={busy || otp.length !== 6}>
            {busy ? 'Creating account…' : 'Create account →'}
          </button>
        </form>
      )}

      <div className={styles.separator}>or</div>
      <p className={styles.footerText}>
        <Link className={styles.link} href="/us">← Back to US retail</Link>
      </p>
    </InternationalAuthShell>
  )
}
