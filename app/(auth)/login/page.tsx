'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { BrandMark, establishIndiaSession, IndiaAuthShell } from '@/components/auth/india-auth-shell'
import styles from '@/components/auth/india-auth.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setEmailError(null)
    setResetMessage(null)
    setIsSubmitting(true)
    try {
      const { data, error: loginError, response } = await apiClient.POST('/auth/login', {
        body: { email, password },
      })

      if (loginError || !data?.session) {
        if (response.status === 400) {
          setEmailError('Enter a valid email address and password.')
        } else if (response.status === 401) {
          setError('Invalid email or password.')
        } else {
          setError('Sign-in is unavailable right now. Please try again.')
        }
        return
      }

      const sessionResult = await establishIndiaSession(data.session)
      if (!sessionResult.ok) {
        setError(sessionResult.message)
        return
      }

      router.push('/app/dashboard')
    } catch {
      setError('Sign-in is unavailable right now. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleForgotPassword() {
    setError(null)
    setEmailError(null)
    setResetMessage(null)
    if (!email) {
      setError('Enter your email above first, then click “Forgot password?”')
      return
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)
    if (resetError) {
      setError('We could not send the reset email. Please try again.')
      return
    }
    setResetMessage('Check your email for a password reset link.')
  }

  if (!showForm) {
    return (
      <main className={styles.splash}>
        <div className={styles.rings} aria-hidden="true" />
        <div className={styles.splashContent}>
          <BrandMark splash />
          <div className={styles.splashBadge}>✦ India&apos;s most complete retail suite</div>
          <h1 className={styles.splashHeading}>Retail, reimagined.<br />For every Indian store.</h1>
          <p className={styles.splashDescription}>GST-native · AI-powered · Offline-first<br />From first bill to GSTR-1 — one POS.</p>
          <div className={styles.splashActions}>
            <Link className={styles.splashPrimary} href="/signup">Create your store account →</Link>
            <button className={styles.splashSecondary} type="button" onClick={() => setShowForm(true)}>Sign in to existing account</button>
          </div>
          <div className={styles.splashProof}>
            <span>✓ 14-day free trial</span><span>✓ No credit card</span><span>✓ GST-compliant</span>
          </div>
        </div>
        <p className={styles.copyright}>© 2026 Couture Retail Technologies Pvt Ltd</p>
      </main>
    )
  }

  return (
    <IndiaAuthShell mode="login">
      <h1 className={styles.heading}>Good to have you back.</h1>
      <p className={styles.subheading}>Enter your store credentials to continue.</p>
      <div className={styles.tabs} role="tablist" aria-label="Sign-in method">
        <button className={styles.tab} role="tab" aria-selected={false} type="button" onClick={() => setError('Mobile sign-in is not enabled yet. Please use your email address.')}>Mobile number</button>
        <button className={`${styles.tab} ${styles.tabActive}`} role="tab" aria-selected type="button">Email address</button>
      </div>
      {error && <div className={styles.alert} role="alert">{error}</div>}
      {resetMessage && <div className={`${styles.alert} ${styles.success}`} role="status">{resetMessage}</div>}
      <form onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.label}>Email address<span className={styles.required}>*</span></span>
          <input className={`${styles.input} ${emailError ? styles.inputError : ''}`} type="email" placeholder="owner@yourstore.com" autoComplete="email" required aria-invalid={Boolean(emailError)} aria-describedby={emailError ? 'login-email-error' : undefined} value={email} onChange={(event) => setEmail(event.target.value)} />
          {emailError && <span className={styles.fieldError} id="login-email-error">{emailError}</span>}
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Password<span className={styles.required}>*</span></span>
          <span className={styles.passwordWrap}>
            <input className={styles.input} type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            <button className={styles.eye} type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
        <div className={styles.rememberRow}>
          <label className={styles.remember}><input type="checkbox" /> Remember this device</label>
          <button className={styles.link} type="button" onClick={handleForgotPassword}>Forgot password?</button>
        </div>
        <button className={styles.primary} type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in →'}</button>
      </form>
      <div className={styles.separator}>or</div>
      <p className={styles.footerText}>New to Couture POS? <Link className={styles.link} href="/signup">Create a store account</Link></p>
    </IndiaAuthShell>
  )
}
