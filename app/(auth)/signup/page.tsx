'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { establishIndiaSession, IndiaAuthShell } from '@/components/auth/india-auth-shell'
import { IndiaStateCombobox } from '@/components/auth/india-state-combobox'
import styles from '@/components/auth/india-auth.module.css'

type AccountFields = {
  ownerName: string
  phone: string
  email: string
  password: string
}

/**
 * Signup is the only place business identity is captured. Onboarding used to
 * ask for all of this a second time on separate "Business Identity" and
 * "GST & Legal Compliance" screens; those are gone.
 *
 * The GST fields are optional and only revealed once a GSTIN is entered —
 * registration is not mandatory below the ₹40L (goods) / ₹20L (services)
 * turnover threshold, so an unregistered retailer is never asked for them.
 */
type BusinessFields = {
  businessName: string
  tradeName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  taxId: string
  gstStatus: '' | 'regular' | 'composition' | 'unregistered'
  pan: string
}

const DUPLICATE_EMAIL_ERROR = 'An account already exists with this email. Log in instead'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'account' | 'business'>('account')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [account, setAccount] = useState<AccountFields>({
    ownerName: '',
    phone: '',
    email: '',
    password: '',
  })
  const [business, setBusiness] = useState<BusinessFields>({
    businessName: '',
    tradeName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    taxId: '',
    gstStatus: '',
    pan: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setEmailError(null)
    if (!agreed) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.')
      return
    }
    localStorage.setItem(
      'couture.signup.draft',
      JSON.stringify({ ownerName: account.ownerName, phone: account.phone, email: account.email }),
    )
    setStep('business')
  }

  async function handleBusinessSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setEmailError(null)

    if (!business.state) {
      setError('Select your state or Union Territory from the list to continue.')
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error: signupError } = await apiClient.POST('/auth/signup', {
        body: {
          ownerName: account.ownerName,
          businessName: business.businessName,
          tradeName: business.tradeName || undefined,
          email: account.email,
          password: account.password,
          addressLine1: business.addressLine1,
          addressLine2: business.addressLine2 || undefined,
          city: business.city,
          state: business.state,
          postalCode: business.postalCode,
          country: 'IN',
          taxId: business.taxId || undefined,
          gstStatus: business.gstStatus || undefined,
          pan: business.pan || undefined,
          // Derived from the address rather than asked again — for a
          // single-location retailer the place of supply is the store's state.
          placeOfSupply: business.taxId.trim() ? business.state : undefined,
        },
      })

      if (signupError) {
        const message = (signupError as { error?: string }).error
        if (message === DUPLICATE_EMAIL_ERROR) {
          setEmailError(DUPLICATE_EMAIL_ERROR)
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

      const sessionResult = await establishIndiaSession(data.session)
      if (!sessionResult.ok) {
        setError(sessionResult.message)
        return
      }

      localStorage.removeItem('couture.signup.draft')
      router.push('/plans')
    } catch {
      setError("We couldn't create your account right now. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <IndiaAuthShell mode="signup">
      {step === 'account' ? (
        <>
          <h1 className={styles.heading}>Create your store account.</h1>
          <p className={styles.subheading}>14-day free trial · No credit card required.</p>
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
                <span className={styles.countryCode} aria-hidden="true">🇮🇳 +91</span>
                <input
                  className={`${styles.input} ${styles.phoneInput}`}
                  type="tel"
                  inputMode="numeric"
                  placeholder="98200 00000"
                  autoComplete="tel"
                  minLength={10}
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
            <label className={styles.field}>
              <span className={styles.label}>Password<span className={styles.required}>*</span></span>
              <span className={styles.passwordWrap}>
                <input
                  className={styles.input}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={account.password}
                  onChange={(event) => setAccount((current) => ({ ...current, password: event.target.value }))}
                />
                <button
                  className={styles.eye}
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <label className={styles.agreement}>
              <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
              <span>
                I agree to Couture POS <a className={styles.link} href="#terms">Terms of Service</a> and{' '}
                <a className={styles.link} href="#privacy">Privacy Policy</a>
              </span>
            </label>
            <button className={styles.primary} type="submit">Create account &amp; continue →</button>
          </form>
          <div className={styles.separator}>or</div>
          <p className={styles.footerText}>
            Already have an account? <Link className={styles.link} href="/login">Sign in</Link>
          </p>
        </>
      ) : (
        <>
          <h1 className={styles.heading}>Complete your business profile.</h1>
          <p className={styles.subheading}>These details appear on your invoices and tax records.</p>
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
              <input className={styles.input} placeholder="Area or landmark (optional)" value={business.addressLine2} onChange={(event) => setBusiness((current) => ({ ...current, addressLine2: event.target.value }))} />
            </label>
            <div className={styles.actions}>
              <label className={styles.field}>
                <span className={styles.label}>City<span className={styles.required}>*</span></span>
                <input className={styles.input} required value={business.city} onChange={(event) => setBusiness((current) => ({ ...current, city: event.target.value }))} />
              </label>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="signup-state">State<span className={styles.required}>*</span></label>
                <IndiaStateCombobox
                  id="signup-state"
                  required
                  value={business.state}
                  onChange={(state) => {
                    setBusiness((current) => ({ ...current, state }))
                    setError(null)
                  }}
                />
              </div>
            </div>
            <div className={styles.actions}>
              <label className={styles.field}>
                <span className={styles.label}>PIN code<span className={styles.required}>*</span></span>
                <input className={styles.input} inputMode="numeric" required value={business.postalCode} onChange={(event) => setBusiness((current) => ({ ...current, postalCode: event.target.value }))} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>GSTIN</span>
                <input className={styles.input} placeholder="Leave blank if not registered" maxLength={15} value={business.taxId} onChange={(event) => setBusiness((current) => ({ ...current, taxId: event.target.value }))} />
              </label>
            </div>
            {/*
              Shown only once a GSTIN is entered. A business below the
              registration threshold has no GST type, PAN-on-file or place of
              supply to give, so it is never asked.
            */}
            {business.taxId.trim() !== '' && (
              <div className={styles.actions}>
                <label className={styles.field}>
                  <span className={styles.label}>GST registration type</span>
                  <select className={styles.input} value={business.gstStatus} onChange={(event) => setBusiness((current) => ({ ...current, gstStatus: event.target.value as BusinessFields['gstStatus'] }))}>
                    <option value="">Select if known</option>
                    <option value="regular">Regular</option>
                    <option value="composition">Composition</option>
                    <option value="unregistered">Unregistered</option>
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>PAN</span>
                  <input className={styles.input} placeholder="Optional" maxLength={10} value={business.pan} onChange={(event) => setBusiness((current) => ({ ...current, pan: event.target.value }))} />
                </label>
              </div>
            )}
            <div className={styles.actions}>
              <button className={styles.secondary} type="button" onClick={() => setStep('account')}>← Back</button>
              <button className={styles.primary} type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account…' : 'Create account →'}
              </button>
            </div>
          </form>
        </>
      )}
    </IndiaAuthShell>
  )
}
