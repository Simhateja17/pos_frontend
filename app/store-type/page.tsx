'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'
import styles from '@/components/india-migration.module.css'
const DRAFT = 'couture.india.onboarding.unsent.selection'
const categories = [['👗','fashion','Fashion & Apparel','Clothing, ethnic wear, western'],['💄','beauty','Beauty & Wellness','Cosmetics, salon, spa'],['📱','electronics','Electronics & Gadgets','Phones, accessories, tech'],['👟','footwear','Footwear','Shoes, sandals, sports'],['💎','jewellery','Jewellery','Gold, diamond, fashion jewellery'],['📚','books','Books & Stationery','Books, gifts, office supplies'],['💊','pharmacy','Pharmacy & Healthcare','OTC medicine, wellness'],['🛒','grocery','Grocery & FMCG','Supermarket, convenience'],['🏪','multi','Multi-brand / Other','General retail, mixed categories']] as const
export default function StoreTypePage() {
  const router = useRouter()
  const [selected, setSelected] = useState('fashion')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem(DRAFT) ?? '{}')
    setSelected(saved.storeCategory ?? 'fashion')
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const { data } = await apiClient.GET('/onboarding', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const persisted = data?.data[1]?.storeCategory
      if (persisted) setSelected(persisted)
    })().catch(() => setMessage('Your saved category will be loaded when the connection is available.'))
  }, [])

  function continueSetup() {
    const saved = JSON.parse(sessionStorage.getItem(DRAFT) ?? '{}')
    sessionStorage.setItem(DRAFT, JSON.stringify({ ...saved, storeCategory: selected }))
    router.push('/plans')
  }

  return (
    <main className={styles.selectionPage}>
      <div className={styles.selectionCanvas}>
        <div className={styles.selectionBrand}>
          <span className={styles.selectionLogo}>C</span>
          <strong>Couture POS</strong>
        </div>
        <header className={styles.selectionHeader}>
          <h1>What kind of store do you run?</h1>
          <p>We’ll configure GST slabs, HSN codes and catalog structure for your category.</p>
        </header>
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.categoryGrid}>
          {categories.map(([emoji, id, name, description]) => (
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
        <button className={styles.primaryAction} onClick={continueSetup}>Continue →</button>
      </div>
    </main>
  )
}
