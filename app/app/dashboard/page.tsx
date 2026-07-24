import Link from 'next/link'
import { ArrowUpRight, Boxes, IndianRupee, PackageOpen, ReceiptIndianRupee, WalletCards } from 'lucide-react'

const metrics = [
  { label: "Today's sales", value: '₹4.84 L', meta: '▲ 12.4% vs yesterday', icon: IndianRupee },
  { label: 'Avg bill value', value: '₹2,550', meta: '▲ 8.0% 30-day avg', icon: ReceiptIndianRupee },
  { label: 'Gross margin', value: '37.8%', meta: 'Target 40%', icon: ArrowUpRight },
  { label: 'Cash drawer', value: '₹50,240', meta: '1 mismatch · C-3', icon: WalletCards },
  { label: 'Low stock', value: '14', meta: '3 critical · 11 reorder', icon: Boxes },
]

export default function DashboardPage() {
  return (
    <main className="p-5 md:p-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-slate-500">Today · Mumbai · Bandra</p>
        </div>
        <Link
          href="/app/billing"
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#2b64c5] px-5 font-semibold text-white shadow-lg shadow-blue-200"
        >
          <PackageOpen className="size-5" /> Open Register
        </Link>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map(({ label, value, meta, icon: Icon }, index) => (
          <article
            key={label}
            className={`rounded-2xl border p-5 shadow-sm ${
              index === 0 ? 'border-blue-200 bg-[#edf4ff]' : 'border-[#e2e5ea] bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
              <Icon className="size-4 text-slate-400" />
            </div>
            <p className="mt-4 font-mono text-3xl font-bold">{value}</p>
            <p className="mt-2 text-sm text-slate-500">{meta}</p>
          </article>
        ))}
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <article className="min-h-[430px] rounded-2xl border border-[#e2e5ea] bg-white p-6 shadow-sm">
          <h2 className="font-heading text-xl font-bold">Sales trend</h2>
          <p className="text-sm text-slate-500">Last 14 days · revenue and profit</p>
          <div className="mt-10 flex h-64 items-end gap-3 border-b border-dashed border-slate-200">
            {[28, 42, 36, 58, 72, 62, 48, 55, 75, 66, 82, 73, 91, 84].map((height, index) => (
              <div key={index} className="flex h-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-[#cfe0ff] to-[#76a1ef]"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-[#e2e5ea] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold">Action Center</h2>
            <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">7 items</span>
          </div>
          <div className="mt-5 space-y-3">
            {[
              ['2 refunds awaiting approval', 'High priority · SLA 12 min'],
              ['Counter 3 cash variance — ₹100', 'Reason pending · SLA past due'],
              ['Purchase order due today', '180 units · 0 received'],
              ['Product out of stock', 'Last sold 12 hrs ago'],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-xl border p-4">
                <strong className="block text-sm">{title}</strong>
                <span className="mt-1 block text-xs text-slate-500">{detail}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}
