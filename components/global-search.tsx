'use client'

import {
  Boxes,
  ClipboardList,
  CornerDownLeft,
  LoaderCircle,
  Plus,
  Search,
  Truck,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AppNavGroup } from '@/components/app-navigation'
import { globalSearchMatchScore, isScannableBarcode, normalizeSearchValue } from '@/lib/global-search'
import {
  getAuthenticatedCustomers,
  getAuthenticatedProductMatches,
  getAuthenticatedSales,
  getAuthenticatedSuppliers,
  type AppContext,
  type Product,
  type Sale,
  type Supplier,
} from '@/lib/api/authenticated-client'
import styles from './global-search.module.css'

type SearchKind = 'command' | 'product' | 'order' | 'customer' | 'supplier'

type SearchItem = {
  id: string
  kind: SearchKind
  group: string
  title: string
  detail: string
  href: string
  icon: LucideIcon
  score: number
  exactBarcode?: boolean
}

const MAX_PER_GROUP = 6

function productItems(products: Product[], query: string, appPath: (path: string) => string, storeName: string) {
  const items: SearchItem[] = []
  for (const product of products) {
    for (const variant of product.variants) {
      const barcodeExact = Boolean(variant.barcode && normalizeSearchValue(variant.barcode) === normalizeSearchValue(query))
      const score = Math.max(
        globalSearchMatchScore(query, [variant.barcode], 40),
        globalSearchMatchScore(query, [variant.sku], 30),
        globalSearchMatchScore(query, [product.name]),
        globalSearchMatchScore(query, [variant.size, variant.color, variant.material]),
      )
      if (!score) continue
      const attributes = [variant.size, variant.color, variant.material].filter(Boolean).join(' / ')
      items.push({
        id: `product:${variant.id}`,
        kind: 'product',
        group: 'Products',
        title: product.name,
        detail: [variant.sku, attributes, storeName].filter(Boolean).join(' · '),
        href: appPath(`/app/inventory/catalog/${variant.id}`),
        icon: Boxes,
        score,
        exactBarcode: barcodeExact,
      })
    }
  }
  return items.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, MAX_PER_GROUP)
}

function orderItems(sales: Sale[], query: string, appPath: (path: string) => string, storeName: string): SearchItem[] {
  return sales.map((sale) => {
    const bill = sale.invoiceNumber ?? sale.id.slice(0, 8).toUpperCase()
    const customer = sale.customer?.name ?? sale.customer?.billingName ?? sale.customer?.phone ?? 'Walk-in'
    return {
      id: `order:${sale.id}`,
      kind: 'order' as const,
      group: 'Orders',
      title: bill,
      detail: [customer, storeName].filter(Boolean).join(' · '),
      href: appPath(`/app/orders/${sale.id}`),
      icon: ClipboardList,
      score: Math.max(globalSearchMatchScore(query, [sale.invoiceNumber], 30), globalSearchMatchScore(query, [sale.id], 20), globalSearchMatchScore(query, [customer])),
    }
  }).sort((a, b) => b.score - a.score).slice(0, MAX_PER_GROUP)
}

function supplierItems(suppliers: Supplier[], query: string, appPath: (path: string) => string): SearchItem[] {
  return suppliers.map((supplier) => ({
    id: `supplier:${supplier.id}`,
    kind: 'supplier' as const,
    group: 'Suppliers',
    title: supplier.name,
    detail: [supplier.contactName, supplier.phone, supplier.email].filter(Boolean).join(' · ') || 'Supplier',
    href: appPath(`/app/suppliers/${supplier.id}`),
    icon: Truck,
    score: globalSearchMatchScore(query, [supplier.name, supplier.contactName, supplier.phone, supplier.email]),
  })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, MAX_PER_GROUP)
}

function customerItems(customers: Awaited<ReturnType<typeof getAuthenticatedCustomers>>['items'], query: string, appPath: (path: string) => string): SearchItem[] {
  return customers.map((customer) => ({
    id: `customer:${customer.id}`,
    kind: 'customer' as const,
    group: 'Customers',
    title: customer.billingName ?? customer.name ?? 'Unnamed customer',
    detail: [customer.phone, customer.email].filter(Boolean).join(' · ') || 'Customer profile',
    href: appPath(`/app/customers/${customer.id}`),
    icon: Users,
    score: globalSearchMatchScore(query, [customer.billingName, customer.name, customer.phone, customer.email]),
  })).sort((a, b) => b.score - a.score).slice(0, MAX_PER_GROUP)
}

function commandItems(navigation: AppNavGroup[], appPath: (path: string) => string): SearchItem[] {
  const navigationCommands = navigation.flatMap((group) => group.items.map((item) => ({
    id: `command:${item.href}`,
    kind: 'command' as const,
    group: 'Commands',
    title: `Go to ${item.label}`,
    detail: group.label,
    href: appPath(item.href),
    icon: item.icon,
    score: 1,
  })))
  return [
    { id: 'command:new-sale', kind: 'command', group: 'Commands', title: 'New Sale', detail: 'Start checkout', href: appPath('/app/billing'), icon: Plus, score: 1 },
    { id: 'command:add-product', kind: 'command', group: 'Commands', title: 'Add Product', detail: 'Create a catalog item', href: appPath('/app/inventory/catalog/new'), icon: Boxes, score: 1 },
    { id: 'command:add-customer', kind: 'command', group: 'Commands', title: 'Add Customer', detail: 'Create a customer profile', href: `${appPath('/app/customers')}?new=1`, icon: UserPlus, score: 1 },
    ...navigationCommands,
  ] as SearchItem[]
}

function commandMatches(commands: SearchItem[], query: string) {
  if (!query.trim()) return commands.slice(0, 8)
  return commands.map((command) => ({ ...command, score: globalSearchMatchScore(query, [command.title, command.detail]) }))
    .filter((command) => command.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PER_GROUP)
}

function shortcutLabel() {
  if (typeof navigator === 'undefined') return 'Ctrl K'
  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? '⌘ K' : 'Ctrl K'
}

export function GlobalSearch({
  context,
  navigation,
  appPath,
}: {
  context: AppContext
  navigation: AppNavGroup[]
  appPath: (path: string) => string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const requestRef = useRef(0)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<SearchItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [searchFailed, setSearchFailed] = useState(false)
  const [shortcut, setShortcut] = useState('Ctrl K')
  const commands = useMemo(() => commandItems(navigation, appPath), [appPath, navigation])
  const visibleCommands = useMemo(() => commandMatches(commands, query), [commands, query])
  const items = useMemo(() => [...visibleCommands, ...records], [records, visibleCommands])

  const close = useCallback(() => {
    setOpen(false)
    setActiveIndex(0)
  }, [])

  const choose = useCallback((item: SearchItem) => {
    close()
    setQuery('')
    router.push(item.href)
  }, [close, router])

  useEffect(() => setShortcut(shortcutLabel()), [])

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if (event.key.toLocaleLowerCase() !== 'k' || (!event.ctrlKey && !event.metaKey)) return
      event.preventDefault()
      setOpen(true)
      inputRef.current?.focus()
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close()
    }
    window.addEventListener('keydown', onShortcut)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onShortcut)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [close])

  useEffect(() => close(), [pathname, close])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      requestRef.current += 1
      setRecords([])
      setLoading(false)
      setSearchFailed(false)
      return
    }
    const requestId = ++requestRef.current
    const timer = window.setTimeout(() => {
      setLoading(true)
      setSearchFailed(false)
      void Promise.allSettled([
        getAuthenticatedProductMatches(trimmed),
        getAuthenticatedSales({ search: trimmed, limit: MAX_PER_GROUP }),
        getAuthenticatedCustomers({ search: trimmed, limit: MAX_PER_GROUP }),
        getAuthenticatedSuppliers(),
      ]).then(([products, sales, customers, suppliers]) => {
        if (requestRef.current !== requestId) return
        const next: SearchItem[] = []
        if (products.status === 'fulfilled') next.push(...productItems(products.value, trimmed, appPath, context.store?.name ?? 'Business-wide'))
        if (sales.status === 'fulfilled') next.push(...orderItems(sales.value.items, trimmed, appPath, context.store?.name ?? 'Business-wide'))
        if (customers.status === 'fulfilled') next.push(...customerItems(customers.value.items, trimmed, appPath))
        if (suppliers.status === 'fulfilled') next.push(...supplierItems(suppliers.value, trimmed, appPath))
        setRecords(next)
        setSearchFailed([products, sales, customers, suppliers].every((result) => result.status === 'rejected'))
        setLoading(false)

        const barcodeMatch = next.find((item) => item.kind === 'product' && item.exactBarcode)
        if (barcodeMatch && isScannableBarcode(trimmed)) choose(barcodeMatch)
      })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [appPath, choose, context.store?.name, query])

  useEffect(() => setActiveIndex((current) => Math.min(current, Math.max(items.length - 1, 0))), [items.length])

  const grouped = useMemo(() => {
    const order = ['Commands', 'Products', 'Orders', 'Customers', 'Suppliers']
    return order.map((group) => ({ group, items: items.filter((item) => item.group === group) })).filter((entry) => entry.items.length)
  }, [items])

  return (
    <div className={`search ${styles.root}`} ref={rootRef}>
      <Search aria-hidden="true" />
      <input
        ref={inputRef}
        value={query}
        role="combobox"
        aria-label="Search products, orders, customers, suppliers, or commands"
        aria-expanded={open}
        aria-controls="global-search-results"
        aria-activedescendant={open && items[activeIndex] ? `global-search-${items[activeIndex].id}` : undefined}
        autoComplete="off"
        placeholder="Search products, orders, customers, suppliers, or commands..."
        onFocus={() => setOpen(true)}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); setActiveIndex(0) }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') { event.preventDefault(); close(); inputRef.current?.blur(); return }
          if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, items.length - 1)); return }
          if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); return }
          if (event.key === 'Enter' && open && items[activeIndex]) { event.preventDefault(); choose(items[activeIndex]) }
        }}
      />
      <span className={`kbd ${styles.shortcut}`}>{shortcut}</span>

      {open && (
        <div className={styles.panel} id="global-search-results" role="listbox" aria-label="Global search results">
          {grouped.map((entry) => (
            <section className={styles.group} key={entry.group} aria-label={entry.group}>
              <div className={styles.groupLabel}>{entry.group}</div>
              {entry.items.map((item) => {
                const index = items.indexOf(item)
                const Icon = item.icon
                return (
                  <button
                    id={`global-search-${item.id}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`${styles.result} ${index === activeIndex ? styles.active : ''}`}
                    type="button"
                    key={item.id}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(item)}
                  >
                    <span className={styles.icon}><Icon aria-hidden="true" /></span>
                    <span className={styles.copy}><strong>{item.title}</strong><small>{item.detail}</small></span>
                    {index === activeIndex && <CornerDownLeft className={styles.enter} aria-hidden="true" />}
                  </button>
                )
              })}
            </section>
          ))}
          {loading && <div className={styles.status}><LoaderCircle className={styles.spinner} /> Searching current business scope...</div>}
          {!loading && query.trim().length === 1 && <div className={styles.status}>Type one more character to search records.</div>}
          {!loading && query.trim().length >= 2 && records.length === 0 && !searchFailed && <div className={styles.status}>No matching records found.</div>}
          {!loading && searchFailed && <div className={styles.error}>Search is temporarily unavailable. Check your connection and try again.</div>}
          <footer className={styles.footer}><span>↑↓ Navigate</span><span>↵ Open</span><span>Esc Close</span></footer>
        </div>
      )}
    </div>
  )
}
