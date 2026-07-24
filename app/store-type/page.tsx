'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const categories = [
  ['👗', 'Fashion & Apparel', 'Clothing, ethnic wear, western'],
  ['💄', 'Beauty & Wellness', 'Cosmetics, salon, spa'],
  ['📱', 'Electronics & Gadgets', 'Phones, accessories, tech'],
  ['👟', 'Footwear', 'Shoes, sandals, sports'],
  ['💎', 'Jewellery', 'Gold, diamond, fashion jewellery'],
  ['📚', 'Books & Stationery', 'Books, gifts, office supplies'],
  ['💊', 'Pharmacy & Healthcare', 'OTC medicine, wellness'],
  ['🛒', 'Grocery & FMCG', 'Supermarket, convenience'],
  ['🏪', 'Multi-brand / Other', 'General retail, mixed categories'],
]

export default function StoreTypePage() {
  const router = useRouter()
  const [selected, setSelected] = useState('Fashion & Apparel')

  function continueSetup() {
    window.localStorage.setItem('couture.onboarding.storeType', selected)
    router.push('/plans')
  }

  return (
    <main className="min-h-screen bg-[#f4f5f8] px-5 py-10 text-[#111827] md:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-xl bg-[#285fb9] text-xl font-black text-white">C</div>
            <strong className="font-heading text-xl">Couture POS</strong>
          </div>
        </div>
        <div className="text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tight">What kind of store do you run?</h1>
          <p className="mt-3 text-lg text-slate-500">
            We&apos;ll configure GST slabs, HSN codes and catalog structure for your category.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(([emoji, name, description]) => {
            const active = selected === name
            return (
              <button
                key={name}
                type="button"
                onClick={() => setSelected(name)}
                className={`min-h-40 rounded-2xl border-2 bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  active ? 'border-[#2864c6] bg-[#edf3ff]' : 'border-[#e2e5ea]'
                }`}
              >
                <span className="text-3xl">{emoji}</span>
                <strong className="mt-4 block text-base">{name}</strong>
                <span className="mt-1 block text-sm text-slate-500">{description}</span>
              </button>
            )
          })}
        </div>
        <Button className="mx-auto mt-6 flex h-14 w-full max-w-sm text-base" onClick={continueSetup}>
          Continue →
        </Button>
      </div>
    </main>
  )
}

