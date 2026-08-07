import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getAuthenticatedAppContext } from '@/lib/api/authenticated-client'
import styles from './india-auth.module.css'

type AuthShellProps = {
  mode: 'signup' | 'login'
  children: ReactNode
}

type BackendSession = {
  accessToken: string
  refreshToken: string
}

/**
 * Installs only the backend-minted Supabase session and proves that it can
 * resolve the current India store context before callers navigate. Keeping the
 * token handling here prevents login and signup from drifting into different
 * authentication paths.
 */
export async function establishSession(session: BackendSession) {
  const { error } = await supabase.auth.setSession({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
  })

  if (error) {
    return { ok: false as const, message: 'We could not start your secure session. Please try again.' }
  }

  try {
    await getAuthenticatedAppContext()
    return { ok: true as const }
  } catch {
    // Do not leave a partially usable session around when its tenant context
    // cannot be verified. The underlying error can contain transport details,
    // so the UI intentionally receives only safe copy.
    await supabase.auth.signOut()
    return { ok: false as const, message: 'We could not open your store context. Please try again.' }
  }
}

// Kept as a compatibility alias for the existing India auth screens while
// the US route uses the same verified Supabase-session installation path.
export const establishIndiaSession = establishSession

const content = {
  signup: {
    heading: <>One platform.<br />Every store detail.</>,
    description: 'From GST billing to loyalty rewards — built for Indian retail.',
    benefits: [
      'GST-native invoicing from day 1',
      'Offline billing — works without internet',
      'AI Copilot reads your live store data',
      '22 integrated modules, one subscription',
    ],
  },
  login: {
    heading: <>Welcome back to your store.</>,
    description: 'Billing, inventory, loyalty and compliance — all in one place.',
    benefits: [
      '2,400+ stores across India',
      '₹18 Cr+ GMV processed monthly',
      'GST-compliant from day one',
      'Works fully offline',
    ],
  },
}

export function BrandMark() {
  return (
    <div className={styles.mark}>
      <span className={styles.markBox}>
        {/* The legacy prototype uses this exact shipped brand asset. */}
        <img src="/logo.png" alt="" />
      </span>
      <span className={styles.markName}>Ambel POS</span>
    </div>
  )
}

export function IndiaAuthShell({ mode, children }: AuthShellProps) {
  const panel = content[mode]

  return (
    <main className={styles.screen}>
      <aside className={styles.brand}>
        <div className={styles.brandContent}>
          <BrandMark />
          <h2 className={styles.brandHeading}>{panel.heading}</h2>
          <p className={styles.brandDescription}>{panel.description}</p>
          <div className={styles.benefits}>
            {panel.benefits.map((benefit) => (
              <div className={styles.benefit} key={benefit}>
                <span className={styles.check}><Check aria-hidden="true" /></span>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
        <p className={styles.brandFooter}>
          Ambel Retail Technologies<br />
          GST: 27ABCDE1234F1Z5
        </p>
      </aside>
      <section className={styles.formCanvas}>
        <div className={styles.formInner}>{children}</div>
      </section>
    </main>
  )
}
