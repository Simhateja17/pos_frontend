'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function OnboardingCompletePage() {
  const [summary, setSummary] = useState<{
    draft: Record<string, string>
    storeType: string
    plan: string
  }>({ draft: {}, storeType: '', plan: '' })

  useEffect(() => {
    try {
      setSummary({
        draft: JSON.parse(window.localStorage.getItem('couture.onboarding.draft') ?? '{}'),
        storeType: window.localStorage.getItem('couture.onboarding.storeType') ?? '',
        plan: window.localStorage.getItem('couture.onboarding.plan') ?? '',
      })
    } catch {
      setSummary({ draft: {}, storeType: '', plan: '' })
    }
  }, [])

  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-gradient-to-br from-[#071a3d] via-[#143778] to-[#2b62bd] p-5 text-white">
      <div className="w-full max-w-2xl text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full border-2 border-emerald-400/50 bg-emerald-400/10 text-4xl text-emerald-300">✓</div>
        <h1 className="mt-8 font-heading text-4xl font-bold">Your store is ready!</h1>
        <p className="mt-3 text-lg text-white/65">You&apos;ve completed setup. Here&apos;s a summary of your configuration.</p>
        <div className="mt-9 rounded-2xl border border-white/20 bg-white/10 p-6 text-left backdrop-blur">
          {[
            ['Category', summary.storeType || 'Fashion & Apparel'],
            ['Plan', summary.plan || 'Growth'],
            ['Store name', summary.draft.storeName ?? summary.draft.brandName ?? 'Your store'],
            ['Billing counters', summary.draft.counters ?? '2 counters'],
            ['GST mode', summary.draft.gstMode ?? 'Exclusive (GST separate)'],
            ['Team', summary.draft.cashierCount ? `${summary.draft.cashierCount} cashier accounts` : 'Ready to add staff'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-6 border-b border-white/10 py-4 last:border-0">
              <span className="text-white/55">{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <Link href="/app/dashboard" className="mt-8 flex h-14 w-full items-center justify-center rounded-xl bg-white font-bold text-[#245ebf]">
          Launch Dashboard →
        </Link>
        <Link href="/onboarding/1" className="mt-4 inline-block text-sm text-white/50">Review setup again</Link>
      </div>
    </main>
  )
}
