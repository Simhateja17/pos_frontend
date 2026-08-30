'use client'

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import styles from './admin.module.css'
import {
  AdminApiError,
  enrollTotp,
  getAdminContext,
  getVerifiedTotpFactor,
  requestAdminOtp,
  verifyAdminOtp,
  verifyTotp,
} from '@/lib/admin-api'

function regionLabel() {
  if (typeof window !== 'undefined' && window.location.hostname === 'in.ambelpos.com') return 'India'
  return 'International'
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof AdminApiError && error.message) return error.message
  return error instanceof Error ? error.message : fallback
}

/**
 * Supabase Auth already returns `totp.qr_code` as an SVG data URI. Older
 * responses can contain the raw SVG, so only wrap values that are not already
 * usable image sources. Wrapping an existing data URI produces a broken image
 * URL (and is what made the enrollment QR appear as alt text).
 */
function qrImageSource(value: string) {
  const source = value.trim()
  if (/^(data:image\/|https?:\/\/)/i.test(source)) return source
  return `data:image/svg+xml;utf-8,${encodeURIComponent(source)}`
}

function AdminMark() {
  return <div className={styles.mark} aria-hidden="true">A</div>
}

function AuthCard({ title, copy, children }: { title: string; copy: string; children: ReactNode }) {
  return (
    <main className={styles.loginShell}>
      <section className={styles.loginCard} aria-labelledby="admin-auth-title">
        <div className={styles.loginBrand}><AdminMark /><div><div className={styles.brandName}>Ambel Admin</div><div className={styles.brandMeta}>{regionLabel()} control plane</div></div></div>
        <h1 id="admin-auth-title" className={styles.loginHeading}>{title}</h1>
        <p className={styles.loginCopy}>{copy}</p>
        {children}
      </section>
    </main>
  )
}

export function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void getAdminContext().then((context) => {
      if (cancelled) return
      router.replace(context.aal === 'aal2' ? '/admin' : context.requiresMfaSetup ? '/admin/mfa/setup' : '/admin/mfa/challenge')
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [router])

  async function sendCode(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      await requestAdminOtp(email)
      setSent(true)
      setInfo(`If this is an invited ${regionLabel()} administrator, a 6-digit code is on its way.`)
    } catch (cause) {
      setError(errorMessage(cause, 'We could not send an administrator code right now.'))
    } finally {
      setBusy(false)
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const result = await verifyAdminOtp(email, otp)
      router.replace(result.requiresMfaSetup ? '/admin/mfa/setup' : '/admin/mfa/challenge')
    } catch (cause) {
      setError(errorMessage(cause, 'Invalid or expired administrator code.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title="Sign in to Ambel Admin" copy="This is a separate employee control plane. Merchant Owner accounts cannot sign in here.">
      {error && <div className={styles.error} role="alert">{error}</div>}
      {info && <div className={styles.notice} role="status">{info}</div>}
      {!sent ? (
        <form onSubmit={sendCode}>
          <label className={styles.field}><span className={styles.label}>Invited work email</span><input className={styles.input} type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@ambelpos.com" /></label>
          <button className={`${styles.button} ${styles.primary}`} disabled={busy} type="submit">{busy ? 'Sending…' : 'Send email code'}</button>
        </form>
      ) : (
        <form onSubmit={verifyCode}>
          <label className={styles.field}><span className={styles.label}>Email</span><input className={styles.input} type="email" value={email} disabled /></label>
          <label className={styles.field}><span className={styles.label}>6-digit email code</span><input className={styles.input} type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} /></label>
          <div className={styles.formRow}><button className={styles.button} type="button" onClick={() => { setSent(false); setOtp(''); setInfo(null); setError(null) }}>Change email</button><button className={`${styles.button} ${styles.primary}`} disabled={busy || otp.length !== 6} type="submit">{busy ? 'Checking…' : 'Continue'}</button></div>
        </form>
      )}
    </AuthCard>
  )
}

export function AdminMfaSetupPage() {
  const router = useRouter()
  const [enrollment, setEnrollment] = useState<{ id: string; totp: { qr_code: string; secret: string } } | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void getAdminContext().then((context) => {
      if (cancelled) return
      if (context.aal === 'aal2') return router.replace('/admin')
      if (!context.requiresMfaSetup) return router.replace('/admin/mfa/challenge')
      void enrollTotp().then((result) => {
        if (!cancelled) setEnrollment(result as typeof enrollment)
      }).catch((cause) => { if (!cancelled) setError(errorMessage(cause, 'Could not start authenticator setup.')) })
    }).catch((cause) => { if (!cancelled) { setError(errorMessage(cause, 'Your admin session has expired.')); router.replace('/admin/login') } })
    return () => { cancelled = true }
  }, [router])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!enrollment) return
    setBusy(true)
    setError(null)
    try {
      await verifyTotp(enrollment.id, code)
      router.replace('/admin')
    } catch (cause) {
      setError(errorMessage(cause, 'That authenticator code was not accepted.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title="Protect your admin account" copy="Scan this QR code in an authenticator app. You must verify a code before any Admin Panel data can load.">
      {error && <div className={styles.error} role="alert">{error}</div>}
      {enrollment && <>
        <img className={styles.qr} src={qrImageSource(enrollment.totp.qr_code)} alt="Authenticator enrollment QR code" />
        <span className={styles.secret}>{enrollment.totp.secret}</span>
        <p className={styles.muted} style={{ marginTop: 8 }}>If you cannot scan, add the secret manually as a time-based one-time password.</p>
        <form onSubmit={submit} style={{ marginTop: 18 }}>
          <label className={styles.field}><span className={styles.label}>Authenticator code</span><input className={styles.input} type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} /></label>
          <button className={`${styles.button} ${styles.primary}`} disabled={busy || code.length !== 6} type="submit">{busy ? 'Verifying…' : 'Verify and open Admin'}</button>
        </form>
      </>}
      {!enrollment && !error && <div className={styles.notice}>Preparing your authenticator enrollment…</div>}
    </AuthCard>
  )
}

export function AdminMfaChallengePage() {
  const router = useRouter()
  const pathname = usePathname()
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const heading = useMemo(() => pathname?.includes('challenge') ? 'Verify your authenticator' : 'Verify your authenticator', [pathname])

  useEffect(() => {
    let cancelled = false
    void getAdminContext().then((context) => {
      if (cancelled) return
      if (context.aal === 'aal2') return router.replace('/admin')
      if (context.requiresMfaSetup) return router.replace('/admin/mfa/setup')
      void getVerifiedTotpFactor().then((factor) => {
        if (!cancelled) setFactorId(factor?.id ?? null)
      }).catch((cause) => { if (!cancelled) setError(errorMessage(cause, 'Could not load your authenticator.')) })
    }).catch((cause) => { if (!cancelled) { setError(errorMessage(cause, 'Your admin session has expired.')); router.replace('/admin/login') } })
    return () => { cancelled = true }
  }, [router])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!factorId) return
    setBusy(true)
    setError(null)
    try {
      await verifyTotp(factorId, code)
      router.replace('/admin')
    } catch (cause) {
      setError(errorMessage(cause, 'That authenticator code was not accepted.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title={heading} copy="Enter the current code from your authenticator app. The code is checked by the regional Supabase project.">
      {error && <div className={styles.error} role="alert">{error}</div>}
      {factorId ? <form onSubmit={submit}>
        <label className={styles.field}><span className={styles.label}>6-digit authenticator code</span><input className={styles.input} type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" required autoFocus value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} /></label>
        <button className={`${styles.button} ${styles.primary}`} disabled={busy || code.length !== 6} type="submit">{busy ? 'Verifying…' : 'Open Admin Panel'}</button>
      </form> : !error && <div className={styles.notice}>Loading your authenticator factor…</div>}
    </AuthCard>
  )
}
