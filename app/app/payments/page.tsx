import { ArrowDownLeft, ArrowUpRight, Download } from 'lucide-react'

export default function PaymentsPage() {
  return (
    <main className="p-5 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Payments & Settlement</h1>
          <p className="mt-1 text-slate-500">Tender mix, settlements and reconciliation</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-amber-700">Operational preview · payment-provider integration pending</p>
        </div>
        <button className="flex h-12 items-center gap-2 rounded-xl border bg-white px-4 font-semibold"><Download className="size-4" /> Export</button>
      </div>
      <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Collected today', '₹4.84 L', '342 payments'],
          ['UPI settlement', '₹2.18 L', 'Expected 8:00 PM'],
          ['Card settlement', '₹1.46 L', 'Expected T+1'],
          ['Cash recorded', '₹1.20 L', 'Across 3 counters'],
        ].map(([label, value, meta]) => (
          <article key={label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-4 font-mono text-3xl font-bold">{value}</p>
            <p className="mt-2 text-sm text-slate-500">{meta}</p>
          </article>
        ))}
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-xl font-bold">Tender mix</h2>
          <div className="mt-6 space-y-5">
            {[['UPI', 45, '₹2.18 L'], ['Card', 30, '₹1.46 L'], ['Cash', 25, '₹1.20 L']].map(([label, width, amount]) => (
              <div key={String(label)}>
                <div className="mb-2 flex justify-between text-sm"><span>{label}</span><strong>{amount}</strong></div>
                <div className="h-3 rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#4d7fd5]" style={{ width: `${width}%` }} /></div>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-xl font-bold">Settlement activity</h2>
          <div className="mt-5 divide-y">
            {[
              [ArrowDownLeft, 'Razorpay UPI settlement', '₹84,220', 'Received'],
              [ArrowDownLeft, 'Card batch · HDFC', '₹46,800', 'Received'],
              [ArrowUpRight, 'Refund batch', '₹8,420', 'Processing'],
            ].map(([Icon, label, amount, status]) => {
              const ActivityIcon = Icon as typeof ArrowDownLeft
              return <div key={String(label)} className="flex items-center gap-4 py-4"><div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><ActivityIcon className="size-5" /></div><div className="flex-1"><strong className="block text-sm">{label as string}</strong><span className="text-xs text-slate-500">{status as string}</span></div><strong className="font-mono">{amount as string}</strong></div>
            })}
          </div>
        </article>
      </section>
    </main>
  )
}
