'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { establishSession, InternationalAuthShell } from '@/components/auth/india-auth-shell'
import { RegionConfirmBanner } from '@/components/auth/region-confirm-banner'
import styles from '@/components/auth/india-auth.module.css'

// V1 International rollout: US, UK, Europe, UAE — per the stated "Western
// and Middle Eastern markets" scope, not a full country list.
const COUNTRIES = [
  { code: 'US', name: 'United States', phone: '+1' },
  { code: 'GB', name: 'United Kingdom', phone: '+44' },
  { code: 'IE', name: 'Ireland', phone: '+353' },
  { code: 'DE', name: 'Germany', phone: '+49' },
  { code: 'FR', name: 'France', phone: '+33' },
  { code: 'NL', name: 'Netherlands', phone: '+31' },
  { code: 'ES', name: 'Spain', phone: '+34' },
  { code: 'IT', name: 'Italy', phone: '+39' },
  { code: 'AE', name: 'United Arab Emirates', phone: '+971' },
] as const

type CountryCode = (typeof COUNTRIES)[number]['code']

type AccountFields = {
  ownerName: string
  countryCode: CountryCode
  phone: string
  email: string
}

type BusinessFields = {
  businessName: string
  tradeName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: CountryCode
  taxId: string
}

const DUPLICATE_EMAIL_ERROR = 'An account already exists with this email. Log in instead'

export function InternationalSignupForm() {
  const router = useRouter()
  const [step, setStep] = useState<'account' | 'otp' | 'business'>('account')
  const [agreed, setAgreed] = useState(false)
  const [account, setAccount] = useState<AccountFields>({
    ownerName: '',
    countryCode: 'US',
    phone: '',
    email: '',
  })
  const [otp, setOtp] = useState('')
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [business, setBusiness] = useState<BusinessFields>({
    businessName: '',
    tradeName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    taxId: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setEmailError(null)
    if (!agreed) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.')
      return
    }
    setIsSendingOtp(true)
    try {
      const { error: requestError } = await apiClient.POST('/auth/otp/request', {
        body: { email: account.email, purpose: 'signup' },
      })
      if (requestError) {
        setError('We could not send a code right now. Please try again.')
        return
      }
      localStorage.setItem(
        'couture.signup.draft',
        JSON.stringify({ ownerName: account.ownerName, phone: account.phone, email: account.email }),
      )
      setStep('otp')
    } catch {
      setError('We could not send a code right now. Please try again.')
    } finally {
      setIsSendingOtp(false)
    }
  }

  function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setStep('business')
  }

  async function handleBusinessSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setEmailError(null)
    setIsSubmitting(true)

    try {
      const { data, error: signupError } = await apiClient.POST('/auth/signup', {
        body: {
          ownerName: account.ownerName,
          businessName: business.businessName,
          tradeName: business.tradeName || undefined,
          email: account.email,
          otp,
          addressLine1: business.addressLine1,
          addressLine2: business.addressLine2 || undefined,
          city: business.city,
          state: business.state,
          postalCode: business.postalCode,
          country: business.country,
          taxId: business.taxId || undefined,
        },
      })

      if (signupError) {
        const message = (signupError as { error?: string }).error
        if (message === DUPLICATE_EMAIL_ERROR) {
          setEmailError(DUPLICATE_EMAIL_ERROR)
          setStep('account')
        } else if (message === 'Invalid or expired code') {
          setError('That code is invalid or expired. Please request a new one.')
          setStep('otp')
        } else {
          setError(
            message === 'Invalid request'
              ? 'Check the required business details and try again.'
              : "We couldn't create your account right now. Please try again.",
          )
        }
        return
      }

      if (!data?.session) {
        setError("We couldn't create your account right now. Please try again.")
        return
      }

      const sessionResult = await establishSession(data.session)
      if (!sessionResult.ok) {
        setError(sessionResult.message)
        return
      }

      localStorage.removeItem('couture.signup.draft')
      if (sessionResult.requiresPin) {
        router.replace('/terminal/pin?returnTo=%2Fplans%3Fregion%3DINTL')
        return
      }

      router.push('/plans?region=INTL')
    } catch {
      setError("We couldn't create your account right now. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCountry = COUNTRIES.find((c) => c.code === account.countryCode) ?? COUNTRIES[0]

  return (
    <InternationalAuthShell mode="signup">
      {step === 'account' ? (
        <>
          <RegionConfirmBanner region="INTL" currentPath="/signup" />
          <h1 className={styles.heading}>Create your store account.</h1>
          <p className={styles.subheading}>Create your account, then choose a paid subscription to activate your store.</p>
          {error && <div className={styles.alert} role="alert">{error}</div>}
          <form onSubmit={handleAccountSubmit}>
            <label className={styles.field}>
              <span className={styles.label}>Full name<span className={styles.required}>*</span></span>
              <input
                className={styles.input}
                placeholder="Your name"
                autoComplete="name"
                required
                value={account.ownerName}
                onChange={(event) => setAccount((current) => ({ ...current, ownerName: event.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Mobile number<span className={styles.required}>*</span></span>
              <span className={styles.phoneRow}>
                <select
                  className={styles.countryCode}
                  aria-label="Country code"
                  value={account.countryCode}
                  onChange={(event) => setAccount((current) => ({ ...current, countryCode: event.target.value as CountryCode }))}
                >
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.phone} {c.name}</option>)}
                </select>
                <input
                  className={`${styles.input} ${styles.phoneInput}`}
                  type="tel"
                  inputMode="tel"
                  placeholder="555 123 4567"
                  autoComplete="tel"
                  minLength={7}
                  required
                  value={account.phone}
                  onChange={(event) => setAccount((current) => ({ ...current, phone: event.target.value }))}
                />
              </span>
              <span className={styles.hint}>Used as your store contact number</span>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Email address</span>
              <input
                type="email"
                placeholder="owner@yourstore.com"
                autoComplete="email"
                required
                value={account.email}
                className={`${styles.input} ${emailError ? styles.inputError : ''}`}
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'signup-email-error' : undefined}
                onChange={(event) => setAccount((current) => ({ ...current, email: event.target.value }))}
              />
              {emailError && <span className={styles.fieldError} id="signup-email-error">{emailError}</span>}
            </label>
            <label className={styles.agreement}>
              <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
              <span>
                I agree to Ambel POS <a className={styles.link} href="#terms">Terms of Service</a> and{' '}
                <a className={styles.link} href="#privacy">Privacy Policy</a>
              </span>
            </label>
            <button className={styles.primary} type="submit" disabled={isSendingOtp}>{isSendingOtp ? 'Sending code…' : 'Send code →'}</button>
          </form>
          <div className={styles.separator}>or</div>
          <p className={styles.footerText}>
            Already have an account? <Link className={styles.link} href="/login">Sign in</Link>
          </p>
        </>
      ) : step === 'otp' ? (
        <>
          <h1 className={styles.heading}>Verify your email.</h1>
          <p className={styles.subheading}>Enter the 6-digit code we sent to {account.email}.</p>
          {error && <div className={styles.alert} role="alert">{error}</div>}
          <form onSubmit={handleOtpSubmit}>
            <label className={styles.field}>
              <span className={styles.label}>6-digit code<span className={styles.required}>*</span></span>
              <input
                className={styles.input}
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
            <div className={styles.actions}>
              <button className={styles.secondary} type="button" onClick={() => setStep('account')}>← Back</button>
              <button className={styles.primary} type="submit" disabled={otp.length !== 6}>Continue →</button>
            </div>
          </form>
        </>
      ) : (
        <>
          <h1 className={styles.heading}>Complete your business profile.</h1>
          <p className={styles.subheading}>These details appear on your invoices and receipts.</p>
          {error && <div className={styles.alert} role="alert">{error}</div>}
          {emailError && <div className={styles.fieldError} role="alert">Email address: {emailError}</div>}
          <form onSubmit={handleBusinessSubmit}>
            <label className={styles.field}>
              <span className={styles.label}>Business name<span className={styles.required}>*</span></span>
              <input className={styles.input} placeholder="Your registered business name" required value={business.businessName} onChange={(event) => setBusiness((current) => ({ ...current, businessName: event.target.value }))} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Trade / brand name</span>
              <input className={styles.input} placeholder="Only if different from the registered name" value={business.tradeName} onChange={(event) => setBusiness((current) => ({ ...current, tradeName: event.target.value }))} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Business address<span className={styles.required}>*</span></span>
              <input className={styles.input} placeholder="Address line 1" required value={business.addressLine1} onChange={(event) => setBusiness((current) => ({ ...current, addressLine1: event.target.value }))} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Address line 2</span>
              <input className={styles.input} placeholder="Suite / unit (optional)" value={business.addressLine2} onChange={(event) => setBusiness((current) => ({ ...current, addressLine2: event.target.value }))} />
            </label>
            <div className={styles.actions}>
              <label className={styles.field}>
                <span className={styles.label}>City<span className={styles.required}>*</span></span>
                <input className={styles.input} required value={business.city} onChange={(event) => setBusiness((current) => ({ ...current, city: event.target.value }))} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>State / province<span className={styles.required}>*</span></span>
                <input className={styles.input} required value={business.state} onChange={(event) => setBusiness((current) => ({ ...current, state: event.target.value }))} />
              </label>
            </div>
            <div className={styles.actions}>
              <label className={styles.field}>
                <span className={styles.label}>Postal code<span className={styles.required}>*</span></span>
                <input className={styles.input} required value={business.postalCode} onChange={(event) => setBusiness((current) => ({ ...current, postalCode: event.target.value }))} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Country<span className={styles.required}>*</span></span>
                <select className={styles.input} required value={business.country} onChange={(event) => setBusiness((current) => ({ ...current, country: event.target.value as CountryCode }))}>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </label>
            </div>
            <label className={styles.field}>
              <span className={styles.label}>Tax ID / VAT / EIN</span>
              <input className={styles.input} placeholder="Leave blank if not applicable" maxLength={30} value={business.taxId} onChange={(event) => setBusiness((current) => ({ ...current, taxId: event.target.value }))} />
            </label>
            <div className={styles.actions}>
              <button className={styles.secondary} type="button" onClick={() => setStep('otp')}>← Back</button>
              <button className={styles.primary} type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account…' : 'Create account →'}
              </button>
            </div>
          </form>
        </>
      )}
    </InternationalAuthShell>
  )
}
