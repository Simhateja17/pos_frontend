'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'
import styles from '@/components/india-migration.module.css'

/**
 * "What kind of shop is this?" — restored, with a real job this time.
 *
 * The original version of this screen was removed because it drove nothing: it
 * promised to configure GST slabs, HSN codes and catalog structure, and no code
 * did any of that. It now does exactly one visible thing — seeds a starter
 * category list the owner can edit — and claims nothing else. It gates no
 * feature and is skippable.
 */
const BUSINESS_TYPES = [
  ['🛒', 'supermarket', 'Supermarket', 'Self-service, barcoded packaged goods'],
  ['🏪', 'grocery', 'Grocery / Kirana', 'Staples, loose and packed'],
  ['🥐', 'bakery', 'Bakery', 'Breads, cakes, savouries'],
  ['🧺', 'general', 'General store', 'A bit of everything'],
  ['👗', 'apparel', 'Clothing & footwear', 'Sizes, colours, styles'],
  ['📱', 'electronics', 'Electronics', 'Phones, accessories, appliances'],
  ['✏️', 'other', 'Something else', 'Start with an empty list'],
] as const

type BusinessType = (typeof BUSINESS_TYPES)[number][1]

export default function StoreTypePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<BusinessType>('supermarket')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function seedAndContinue() {
    setSaving(true)
    setMessage('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        await apiClient.POST('/categories/seed', {
          body: { businessType: selected },
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
      }
    } catch {
      // Seeding is a convenience, not a gate — a failure must not trap the
      // owner on this screen. They can add categories from the app instead.
      setMessage('We couldn’t set up your starter categories — you can add them from Categories later.')
    }

    setSaving(false)
    router.push('/app/dashboard')
  }

  return (
    <main className={styles.selectionPage}>
      <div className={styles.selectionCanvas}>
        <div className={styles.selectionBrand}>
          <span className={styles.selectionLogo}>C</span>
          <strong>Couture POS</strong>
        </div>
        <header className={styles.selectionHeader}>
          <h1>What kind of shop do you run?</h1>
          <p>We’ll start you off with a matching set of product categories. You can change them any time.</p>
        </header>
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.categoryGrid}>
          {BUSINESS_TYPES.map(([emoji, id, name, description]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              className={`${styles.categoryCard} ${selected === id ? styles.categoryCardSelected : ''}`}
            >
              <span className={styles.categoryEmoji}>{emoji}</span>
              <strong className={styles.categoryName}>{name}</strong>
              <span className={styles.categoryDescription}>{description}</span>
            </button>
          ))}
        </div>
        <button className={styles.primaryAction} onClick={seedAndContinue} disabled={saving}>
          {saving ? 'Setting up…' : 'Continue →'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/app/dashboard')}
          style={{
            display: 'block',
            margin: '14px auto 0',
            background: 'none',
            border: 0,
            color: '#64748B',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Skip — I’ll set up categories myself
        </button>
      </div>
    </main>
  )
}
