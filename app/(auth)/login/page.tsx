'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { establishIndiaSession, IndiaAuthShell } from '@/components/auth/india-auth-shell'
import styles from '@/components/auth/india-auth.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [accountNotFound, setAccountNotFound] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function sendOtp() {
    setError(null)
    setEmailError(null)
    setInfoMessage(null)
    setAccountNotFound(false)
    setIsSendingOtp(true)
    try {
      const { error: requestError, response } = await apiClient.POST('/auth/otp/request', {
        body: { email, purpose: 'login' },
      })
      if (requestError) {
        if (response.status === 404) {
          setAccountNotFound(true)
          return
        }
        setError('We could not send a code right now. Please try again.')
        return
      }
      setOtpSent(true)
      setInfoMessage(`We sent a 6-digit code to ${email}.`)
    } catch {
      setError('We could not send a code right now. Please try again.')
    } finally {
      setIsSendingOtp(false)
    }
  }

  function handleSendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendOtp()
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setEmailError(null)
    setIsSubmitting(true)
    try {
      const { data, error: loginError, response } = await apiClient.POST('/auth/login', {
        body: { email, otp },
      })

      if (loginError || !data?.session) {
        if (response.status === 400) {
          setError('Enter the 6-digit code from your email.')
        } else if (response.status === 401) {
          setError('Invalid or expired code. Please try again.')
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

  function handleChangeEmail() {
    setOtpSent(false)
    setOtp('')
    setError(null)
    setInfoMessage(null)
    setAccountNotFound(false)
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
      {accountNotFound && (
        <div className={styles.alert} role="alert">
          No account found with this email. <Link className={styles.link} href="/signup">Create a store account first</Link>.
        </div>
      )}
      {infoMessage && <div className={`${styles.alert} ${styles.success}`} role="status">{infoMessage}</div>}
      {!otpSent ? (
        <form onSubmit={handleSendOtp}>
          <label className={styles.field}>
            <span className={styles.label}>Email address<span className={styles.required}>*</span></span>
            <input className={`${styles.input} ${emailError ? styles.inputError : ''}`} type="email" placeholder="owner@yourstore.com" autoComplete="email" required aria-invalid={Boolean(emailError)} aria-describedby={emailError ? 'login-email-error' : undefined} value={email} onChange={(event) => { setEmail(event.target.value); setAccountNotFound(false); setError(null) }} />
            {emailError && <span className={styles.fieldError} id="login-email-error">{emailError}</span>}
          </label>
          <button className={styles.primary} type="submit" disabled={isSendingOtp}>{isSendingOtp ? 'Sending code…' : 'Send code →'}</button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <label className={styles.field}>
            <span className={styles.label}>Email address</span>
            <input className={styles.input} type="email" value={email} disabled />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>6-digit code<span className={styles.required}>*</span></span>
            <input className={styles.input} type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} placeholder="123456" autoComplete="one-time-code" required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} />
          </label>
          <div className={styles.rememberRow}>
            <button className={styles.link} type="button" onClick={handleChangeEmail}>Use a different email</button>
            <button className={styles.link} type="button" disabled={isSendingOtp} onClick={() => void sendOtp()}>Resend code</button>
          </div>
          <button className={styles.primary} type="submit" disabled={isSubmitting || otp.length !== 6}>{isSubmitting ? 'Verifying…' : 'Sign in →'}</button>
        </form>
      )}
      <div className={styles.separator}>or</div>
      <p className={styles.footerText}>New to Ambel POS? <Link className={styles.link} href="/signup">Create a store account</Link></p>
    </IndiaAuthShell>
  )
}
