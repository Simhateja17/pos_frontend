import {
  BadgeIndianRupee,
  BarChart3,
  DollarSign,
  Bell,
  Boxes,
  FolderTree,
  ClipboardList,
  Grid2X2,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Monitor,
  Radio,
  ReceiptText,
  RefreshCw,
  Rocket,
  RotateCcw,
  Settings,
  CreditCard,
  ShoppingBag,
  Store,
  Sparkles,
  Truck,
  Upload,
  Usb,
  UserCog,
  Users,
  Wallet,
  Landmark,
  WalletCards,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import type { MarketingRegion } from '@/lib/marketing/region'
import type { MessageKey, Translate } from '@/lib/i18n/i18n'
import type { Locale } from '@/lib/i18n/locale'

export type AppNavItem = {
  label: string
  /** Dictionary key for the label; absent on US-only extras (English-only edition). */
  labelKey?: MessageKey
  href: string
  icon: LucideIcon
  /**
   * Product-capability label from the approved design (not store data).
   * Marks modules that are announced but have no Phase 1-3 backend contract:
   * those routes render the explicit unavailable state.
   */
  badge?: 'new'
  /** Visible to, and route-authorized for, a PIN-logged cashier. */
  cashierAccessible?: boolean
  /**
   * Owner-only module. A manager or cashier must not see or enter modules whose
   * backend contract is entirely owner-gated.
   *
   * This hides the nav entry: it is NOT the permission. The server refuses a
   * non-owner's store writes regardless of what the sidebar shows.
   */
  ownerOnly?: boolean
}

export type AppNavGroup = {
  label: string
  labelKey: MessageKey
  items: AppNavItem[]
}

export const APP_NAVIGATION: AppNavGroup[] = [
  {
    label: 'Overview',
    labelKey: 'nav.groups.overview',
    items: [{ label: 'Feature Map', labelKey: 'nav.items.featureMap', href: '/app/feature-map', icon: Grid2X2 }],
  },
  {
    label: 'Sales',
    labelKey: 'nav.groups.sales',
    items: [
      { label: 'Dashboard', labelKey: 'nav.items.dashboard', href: '/app/dashboard', icon: LayoutDashboard },
      { label: 'Billing', labelKey: 'nav.items.billing', href: '/app/billing', icon: ShoppingBag, cashierAccessible: true },
      { label: 'Sales / Bills', labelKey: 'nav.items.orders', href: '/app/orders', icon: ClipboardList, cashierAccessible: true },
      { label: 'Register', labelKey: 'nav.items.shifts', href: '/app/shifts', icon: WalletCards, cashierAccessible: true },
      { label: 'Returns & Exchange', labelKey: 'nav.items.returns', href: '/app/returns', icon: RotateCcw, cashierAccessible: true },
      { label: 'Sales Channels', labelKey: 'nav.items.salesChannels', href: '/app/sales-channels', icon: Radio },
      { label: 'Delivery Challan', labelKey: 'nav.items.deliveryChallan', href: '/app/delivery-challan', icon: Truck },
    ],
  },
  {
    label: 'Stock & Catalog',
    labelKey: 'nav.groups.stock',
    items: [
      { label: 'Inventory', labelKey: 'nav.items.inventory', href: '/app/inventory', icon: Boxes },
      { label: 'Categories', labelKey: 'nav.items.categories', href: '/app/inventory/categories', icon: FolderTree },
      { label: 'Purchases', labelKey: 'nav.items.purchases', href: '/app/purchases', icon: Warehouse },
      { label: 'Suppliers', labelKey: 'nav.items.suppliers', href: '/app/suppliers', icon: Truck },
      { label: 'Stores', labelKey: 'nav.items.stores', href: '/app/stores', icon: Store, ownerOnly: true },
      { label: 'Transfers', labelKey: 'nav.items.transfers', href: '/app/transfers', icon: RefreshCw },
    ],
  },
  {
    label: 'Customers & Team',
    labelKey: 'nav.groups.customersTeam',
    items: [
      { label: 'Customers', labelKey: 'nav.items.customers', href: '/app/customers', icon: Users, cashierAccessible: true },
      { label: 'WhatsApp Connect', labelKey: 'nav.items.whatsapp', href: '/app/whatsapp-connect', icon: MessageCircle },
      { label: 'Staff', labelKey: 'nav.items.staff', href: '/app/settings/members', icon: UserCog },
    ],
  },
  {
    label: 'Money',
    labelKey: 'nav.groups.money',
    items: [
      { label: 'Payments', labelKey: 'nav.items.payments', href: '/app/payments', icon: BadgeIndianRupee },
      { label: 'Expenses', labelKey: 'nav.items.expenses', href: '/app/expenses', icon: Wallet },
      { label: 'Receivables', labelKey: 'nav.items.receivables', href: '/app/receivables', icon: ReceiptText, cashierAccessible: true },
      { label: 'GST Documents', labelKey: 'nav.items.documents', href: '/app/documents', icon: ReceiptText, cashierAccessible: true },
    ],
  },
  {
    label: 'Insights',
    labelKey: 'nav.groups.insights',
    items: [
      { label: 'Reports', labelKey: 'nav.items.reports', href: '/app/reports', icon: ClipboardList },
      { label: 'Demand Planning', labelKey: 'nav.items.demandPlanning', href: '/app/demand-planning', icon: BarChart3 },
      { label: 'AI Copilot', labelKey: 'nav.items.copilot', href: '/app/copilot', icon: Sparkles },
    ],
  },
  {
    label: 'System',
    labelKey: 'nav.groups.system',
    items: [
      { label: 'Guided Setup', labelKey: 'nav.items.setup', href: '/app/setup', icon: Rocket },
      { label: 'Import Data', labelKey: 'nav.items.import', href: '/app/import', icon: Upload, ownerOnly: true },
      { label: 'Offline & Sync', labelKey: 'nav.items.offlineSync', href: '/app/offline-sync', icon: RefreshCw },
      { label: 'Hardware & Devices', labelKey: 'nav.items.hardware', href: '/app/hardware', icon: Usb },
      { label: 'Customer Display', labelKey: 'nav.items.customerDisplay', href: '/app/customer-display', icon: Monitor },
      { label: 'Email', labelKey: 'nav.items.email', href: '/app/email', icon: Mail },
      { label: 'Notifications', labelKey: 'nav.items.notifications', href: '/app/notifications', icon: Bell },
      { label: 'Plan & subscription', labelKey: 'nav.items.subscription', href: '/app/subscription', icon: CreditCard, ownerOnly: true },
      { label: 'Settings', labelKey: 'nav.items.settings', href: '/app/settings', icon: Settings },
    ],
  },
]

/**
 * Nav labels in the active language. English keeps `label`, which also
 * carries the US edition's overrides ("Tax Documents"); other languages exist
 * only for the India edition and read the dictionary.
 */
export function localizeNavigation(groups: AppNavGroup[], locale: Locale, t: Translate): AppNavGroup[] {
  if (locale === 'en') return groups
  return groups.map((group) => ({
    ...group,
    label: t(group.labelKey),
    items: group.items.map((item) => (item.labelKey ? { ...item, label: t(item.labelKey) } : item)),
  }))
}

/**
 * How the US edition differs from the India tree above.
 *
 * The STRUCTURE is deliberately identical — same seven groups, same order, same
 * role gating — because both editions are the same product. Only the content
 * moves: modules that exist solely for Indian regulation or channels are
 * dropped, tax vocabulary changes, and the rupee icon becomes a dollar. Keyed
 * by the India href so the two lists cannot silently drift apart.
 */
type RegionItemOverride = {
  /** Not part of this edition at all. */
  drop?: true
  label?: string
  icon?: LucideIcon
}

const INTL_OVERRIDES: Record<string, RegionItemOverride> = {
  // A delivery challan is an Indian goods-transport document; there is no US
  // equivalent that maps onto the same backend contract.
  '/app/delivery-challan': { drop: true },
  // WhatsApp is the India-first customer channel. The US edition reaches
  // customers over the Email module that is already in the System group.
  '/app/whatsapp-connect': { drop: true },
  '/app/documents': { label: 'Tax Documents' },
  '/app/payments': { icon: DollarSign },
}

/**
 * Items that exist only in the US tree, inserted after the given India href.
 *
 * Sales tax is configured per jurisdiction and is a daily concern for a US
 * retailer, so it earns a nav entry of its own; India's single GST registration
 * is captured at signup and lives in Settings.
 */
const INTL_EXTRAS: Record<string, AppNavItem[]> = {
  '/app/payments': [{ label: 'Sales Tax', href: '/app/settings/tax', icon: Landmark }],
}

function itemsForRegion(items: AppNavItem[], region: MarketingRegion): AppNavItem[] {
  if (region === 'IN') return items

  const result: AppNavItem[] = []
  for (const item of items) {
    const override = INTL_OVERRIDES[item.href]
    if (override?.drop) continue
    result.push(override ? { ...item, ...(override.label ? { label: override.label } : {}), ...(override.icon ? { icon: override.icon } : {}) } : item)
    for (const extra of INTL_EXTRAS[item.href] ?? []) result.push(extra)
  }
  return result
}

/**
 * The India-relative href every nav item is declared with.
 *
 * Shared screens are written against `/app/...`; `appPath()` in
 * `lib/app-region.tsx` rebases them onto `/us/dashboard/...`. Role checks run
 * the mapping backwards so one permission table serves both editions.
 */
export function toIndiaPath(pathname: string): string {
  return pathname.startsWith('/us/dashboard')
    ? `/app${pathname.slice('/us/dashboard'.length)}`
    : pathname
}

export function navigationForRegionRole(
  region: MarketingRegion,
  role?: 'owner' | 'manager' | 'cashier',
): AppNavGroup[] {
  return navigationForRole(role)
    .map((group) => ({ ...group, items: itemsForRegion(group.items, region) }))
    .filter((group) => group.items.length > 0)
}

export function navigationForRole(role?: 'owner' | 'manager' | 'cashier'): AppNavGroup[] {
  if (!role) return []

  const visible = (item: AppNavItem) => {
    if (item.ownerOnly && role !== 'owner') return false
    if (role === 'cashier') return Boolean(item.cashierAccessible)
    return true
  }

  return APP_NAVIGATION
    .map((group) => ({ ...group, items: group.items.filter(visible) }))
    .filter((group) => group.items.length > 0)
}

export function cashierCanAccessAppPath(pathname: string): boolean {
  const path = toIndiaPath(pathname)
  return APP_NAVIGATION.some((group) =>
    group.items.some(
      (item) => item.cashierAccessible && (path === item.href || path.startsWith(`${item.href}/`)),
    ),
  )
}

export function roleCanAccessAppPath(role: 'owner' | 'manager' | 'cashier', pathname: string): boolean {
  const path = toIndiaPath(pathname)
  const candidates = APP_NAVIGATION.flatMap((group) => group.items)
    .filter((item) => path === item.href || path.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)
  const matched = candidates[0]
  if (!matched) return role !== 'cashier'
  if (matched.ownerOnly) return role === 'owner'
  if (role === 'cashier') return Boolean(matched.cashierAccessible)
  return true
}
