import Link from 'next/link'
import { ArrowRight, Construction, LayoutDashboard } from 'lucide-react'

function titleFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ')
}

export default function UnavailableModulePage({ params }: { params: { module: string } }) {
  const title = titleFromSlug(params.module) || 'This module'

  return (
    <main className="grid min-h-[calc(100vh-84px)] place-items-center p-5 md:p-8">
      <section className="w-full max-w-3xl rounded-3xl border bg-white p-8 shadow-sm md:p-12">
        <div className="grid size-14 place-items-center rounded-2xl bg-[#edf4ff] text-[#2864c6]">
          <LayoutDashboard className="size-7" />
        </div>
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.14em] text-[#2864c6]">India application</p>
        <h1 className="mt-3 font-heading text-4xl font-bold">{title} is unavailable</h1>
        <p className="mt-4 max-w-2xl text-lg leading-7 text-slate-500">This route does not have a connected India workflow yet, so it cannot show store data or preview content.</p>
        <div className="mt-8 grid gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:grid-cols-[auto_1fr]">
          <Construction className="size-6 text-amber-700" />
          <div>
            <strong className="block text-amber-900">No data is available for this module</strong>
            <p className="mt-1 text-sm text-amber-800">Choose an available area from the navigation, or return to the dashboard. This message is deliberate: the application will not substitute sample store information.</p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/app/dashboard" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2864c6] px-5 font-semibold text-white">Back to Dashboard <ArrowRight className="size-4" /></Link>
        </div>
      </section>
    </main>
  )
}
