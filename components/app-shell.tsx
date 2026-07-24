'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, ChevronDown, Menu, Search, X } from 'lucide-react'
import { APP_NAVIGATION } from '@/components/app-navigation'

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== '/app/dashboard' && pathname.startsWith(`${href}/`))
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (pathname === '/app') return children

  const current =
    APP_NAVIGATION.flatMap((group) => group.items).find((item) => isActive(pathname, item.href))
      ?.label ?? 'Couture POS'

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#111827]">
      {mobileOpen && (
        <button
          className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[320px] flex-col border-r border-[#e5e7eb] bg-white transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[84px] items-center gap-3 border-b border-[#eef0f3] px-6">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#2c67c9] to-[#6d9cff] text-xl font-black text-white shadow-lg shadow-blue-200">
            C
          </div>
          <div className="min-w-0">
            <strong className="block truncate font-heading text-xl">Couture POS</strong>
            <span className="text-sm text-slate-500">Retail operations suite</span>
          </div>
          <button
            className="ml-auto rounded-lg p-2 text-slate-500 lg:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          {APP_NAVIGATION.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition ${
                        active
                          ? 'bg-[#eef4ff] text-[#245ebf]'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                      }`}
                    >
                      {active && (
                        <span className="absolute -left-4 h-7 w-1 rounded-r-full bg-[#2b65c5]" />
                      )}
                      <Icon className="size-[19px]" strokeWidth={1.8} />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-[#eef0f3] p-5 text-xs text-slate-400">
          <p>Progress auto-saved.</p>
          <p className="mt-1">Online · Sync active</p>
        </div>
      </aside>

      <div className="lg:pl-[320px]">
        <header className="sticky top-0 z-30 flex min-h-[84px] items-center gap-4 border-b border-[#e5e7eb] bg-white/95 px-4 backdrop-blur md:px-6">
          <button
            className="rounded-xl border p-2.5 text-slate-600 lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <div className="hidden min-w-fit text-sm text-slate-500 xl:block">
            Couture POS / <strong className="text-slate-900">{current}</strong>
          </div>
          <label className="relative flex h-12 min-w-0 flex-1 items-center rounded-xl border border-[#dfe3ea] bg-white shadow-sm">
            <Search className="ml-4 size-5 shrink-0 text-slate-400" />
            <input
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-slate-400"
              placeholder="Search orders, products, customers, suppliers… or type a command"
            />
            <kbd className="mr-3 hidden rounded-md border bg-slate-50 px-2 py-1 text-xs text-slate-400 md:block">
              ⌘K
            </kbd>
          </label>
          <button className="hidden h-12 items-center gap-2 rounded-xl bg-[#2b62bd] px-4 text-sm font-semibold text-white md:flex">
            Mumbai · Bandra <ChevronDown className="size-4" />
          </button>
          <button className="relative grid size-12 shrink-0 place-items-center rounded-xl border bg-white">
            <Bell className="size-5" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
          <div className="hidden items-center gap-3 2xl:flex">
            <div className="grid size-12 place-items-center rounded-full bg-[#4b7ddb] font-bold text-white">
              PM
            </div>
            <div className="leading-tight">
              <strong className="block text-sm">Pooja Menon</strong>
              <span className="text-xs text-slate-500">Store Manager · Bandra</span>
            </div>
          </div>
        </header>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}

