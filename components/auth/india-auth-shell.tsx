import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import styles from './india-auth.module.css'

type AuthShellProps = {
  mode: 'signup' | 'login'
  children: ReactNode
}

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

export function BrandMark({ splash = false }: { splash?: boolean }) {
  return (
    <div className={`${styles.mark} ${splash ? styles.splashMark : ''}`}>
      <span className={styles.markBox}>
        {/* The legacy prototype uses this exact shipped brand asset. */}
        <img src="/logo.png" alt="" />
      </span>
      <span className={styles.markName}>Couture POS</span>
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
          Couture Retail Technologies<br />
          GST: 27ABCDE1234F1Z5
        </p>
      </aside>
      <section className={styles.formCanvas}>
        <div className={styles.formInner}>{children}</div>
      </section>
    </main>
  )
}
