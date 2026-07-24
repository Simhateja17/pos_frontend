import { Plus, Search } from 'lucide-react'

const customers = [
  ['Anika Kapoor', '+91 98201 11420', 'Gold', '₹48,650', '1,840'],
  ['Rohit Mehra', '+91 98920 77140', 'Silver', '₹22,430', '720'],
  ['Saanvi Iyer', '+91 99670 31842', 'Gold', '₹63,200', '2,310'],
  ['Vikram Joshi', '+91 98331 90125', 'Member', '₹14,850', '310'],
]

export default function CustomersPage() {
  return (
    <main className="p-5 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Customers</h1>
          <p className="mt-1 text-slate-500">Profiles, purchase history and loyalty</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-amber-700">Operational preview · customer API expansion pending</p>
        </div>
        <button className="flex h-12 items-center gap-2 rounded-xl bg-[#2864c6] px-5 font-semibold text-white"><Plus className="size-4" /> New customer</button>
      </div>
      <section className="mt-7 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b p-5">
          <Search className="size-5 text-slate-400" />
          <input className="h-10 flex-1 outline-none" placeholder="Search by name, phone or email…" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="text-xs font-bold uppercase tracking-wider text-slate-400"><tr>{['Customer', 'Phone', 'Tier', 'Lifetime value', 'Points', ''].map((head) => <th key={head} className="px-5 py-4">{head}</th>)}</tr></thead>
            <tbody className="divide-y">
              {customers.map((customer) => (
                <tr key={customer[1]}>
                  <td className="px-5 py-5 font-semibold">{customer[0]}</td>
                  <td className="px-5 py-5 text-slate-500">{customer[1]}</td>
                  <td className="px-5 py-5"><span className="rounded-lg bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700">{customer[2]}</span></td>
                  <td className="px-5 py-5 font-mono font-bold">{customer[3]}</td>
                  <td className="px-5 py-5">{customer[4]}</td>
                  <td className="px-5 py-5"><button className="rounded-lg border px-3 py-2 text-sm font-semibold">Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

