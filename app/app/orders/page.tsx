import Link from 'next/link'
import { Download, Plus, Search } from 'lucide-react'

const orders = [
  ['INV-24850', 'Anika Kapoor', 'Riya S. · C-1', '14:42', 'UPI', 'Paid', '₹4,280'],
  ['INV-24849', 'Walk-in', 'Riya S. · C-1', '14:39', 'Cash', 'Paid', '₹1,240'],
  ['INV-24848', 'Rohit Mehra', 'Aarav P. · C-2', '14:31', 'Card', 'Paid', '₹8,650'],
  ['INV-24847', 'Saanvi Iyer', 'Aarav P. · C-2', '14:18', 'Split', 'Paid', '₹12,400'],
  ['INV-24846', 'Walk-in', 'Riya S. · C-1', '14:09', 'UPI', 'Held', '₹2,100'],
  ['INV-24845', 'Vikram Joshi', 'Meera D. · C-3', '13:58', 'Card', 'Refunded', '₹3,450'],
]

const statusClass: Record<string, string> = {
  Paid: 'bg-emerald-50 text-emerald-700',
  Held: 'bg-amber-50 text-amber-700',
  Refunded: 'bg-blue-50 text-blue-700',
}

export default function OrdersPage() {
  return (
    <main className="p-5 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Sales / Orders</h1>
          <p className="mt-1 text-slate-500">Invoice and held-bill history</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-amber-700">Operational preview · API wiring scheduled with order-management phase</p>
        </div>
        <div className="flex gap-3">
          <button className="flex h-12 items-center gap-2 rounded-xl border bg-white px-4 font-semibold"><Download className="size-4" /> Export</button>
          <Link href="/app/billing" className="flex h-12 items-center gap-2 rounded-xl bg-[#2864c6] px-5 font-semibold text-white"><Plus className="size-4" /> New Bill</Link>
        </div>
      </div>
      <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Today invoices', '6', 'Updates as you bill'],
          ['Held bills', '1', 'Awaiting resume'],
          ['Paid sales', '₹26,570', '4 completed'],
          ['Cancelled / Refunded', '1', '1 refunded'],
        ].map(([label, value, meta], index) => (
          <article key={label} className={`rounded-2xl border p-5 shadow-sm ${index === 0 ? 'border-blue-200 bg-[#edf4ff]' : 'bg-white'}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-4 font-mono text-3xl font-bold">{value}</p>
            <p className="mt-2 text-sm text-slate-500">{meta}</p>
          </article>
        ))}
      </section>
      <section className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div className="flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
            {['Today', 'Yesterday', 'Last 7 days', 'This month'].map((item, index) => <button key={item} className={`rounded-lg px-4 py-2 ${index === 0 ? 'bg-white shadow-sm' : 'text-slate-500'}`}>{item}</button>)}
          </div>
          <label className="flex h-11 items-center gap-2 rounded-xl border px-3">
            <Search className="size-4 text-slate-400" />
            <input className="outline-none" placeholder="Invoice or customer" />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="text-xs font-bold uppercase tracking-wider text-slate-400">
              <tr>{['Invoice', 'Customer', 'Cashier', 'Time', 'Method', 'Status', 'Amount', ''].map((head) => <th key={head} className="px-5 py-4">{head}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order, index) => (
                <tr key={order[0]} className={index === 0 ? 'bg-[#edf4ff]' : ''}>
                  {order.map((cell, cellIndex) => (
                    <td key={`${order[0]}-${cellIndex}`} className={`px-5 py-5 ${cellIndex === 0 || cellIndex === 6 ? 'font-mono font-bold' : ''}`}>
                      {cellIndex === 5 ? <span className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${statusClass[cell]}`}>{cell}</span> : cell}
                    </td>
                  ))}
                  <td className="px-5 py-5"><button className="rounded-lg border px-3 py-2 text-sm font-semibold">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

