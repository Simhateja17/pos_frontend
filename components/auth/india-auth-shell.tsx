import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { AmbelMark } from '@/components/brand/ambel-mark'
import { supabase } from '@/lib/supabase/client'
import {
  AuthenticatedRequestError,
  getAuthenticatedAppContext,
} from '@/lib/api/authenticated-client'
import {
  establishSessionWith,
  type BackendSession,
} from '@/lib/auth/session-establishment'
import styles from './india-auth.module.css'
import { setActiveStoreId } from '@/lib/store-context'

type AuthShellProps = {
  mode: 'signup' | 'login'
  children: ReactNode
}

/**
 * Installs only the backend-minted Supabase session and proves that it can
 * resolve the current India store context before callers navigate. Keeping the
 * token handling here prevents login and signup from drifting into different
 * authentication paths.
 */
export async function establishSession(session: BackendSession) {
  return establishSessionWith(session, {
    installSession: async (nextSession) => supabase.auth.setSession({
      access_token: nextSession.accessToken,
      refresh_token: nextSession.refreshToken,
    }),
    loadContext: async () => {
      // A tab can be reused after signing out of another business. Store scope
      // belongs to the authenticated business, so never carry an old UUID into
      // the newly established session.
      setActiveStoreId(null)
      await getAuthenticatedAppContext()
    },
    signOut: () => supabase.auth.signOut(),
    isRegisterLockedError: (error) =>
      error instanceof AuthenticatedRequestError && error.kind === 'register_locked',
  })
}

// Kept as a compatibility alias for the existing India auth screens while
// the US route uses the same verified Supabase-session installation path.
export const establishIndiaSession = establishSession

const content = {
  signup: {
    heading: <>One platform.<br />Every store detail.</>,
    description: 'From GST billing to loyalty rewards, built for Indian retail.',
    benefits: [
      'GST-native invoicing from day 1',
      'Offline billing, works without internet',
      'AI Copilot reads your live store data',
      '22 integrated modules, one subscription',
    ],
  },
  login: {
    heading: <>Welcome back to your store.</>,
    description: 'Billing, inventory, loyalty and compliance, all in one place.',
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
        {/* Inverse tone: the brand panel behind this is deep navy. */}
        <AmbelMark size={40} tone="inverse" />
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
          Couture Services Private Limited<br />
          GST: 37AAMCC4557F1ZF
        </p>
      </aside>
      <section className={styles.formCanvas}>
        <div className={styles.formInner}>{children}</div>
      </section>
    </main>
  )
}
