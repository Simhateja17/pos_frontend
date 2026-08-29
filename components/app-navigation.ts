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

export type AppNavItem = {
  label: string
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
  items: AppNavItem[]
}

export const APP_NAVIGATION: AppNavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Feature Map', href: '/app/feature-map', icon: Grid2X2 }],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
      { label: 'Billing', href: '/app/billing', icon: ShoppingBag, cashierAccessible: true },
      { label: 'Sales / Bills', href: '/app/orders', icon: ClipboardList, cashierAccessible: true },
      { label: 'Register', href: '/app/shifts', icon: WalletCards, cashierAccessible: true },
      { label: 'Returns & Exchange', href: '/app/returns', icon: RotateCcw, cashierAccessible: true },
      { label: 'Sales Channels', href: '/app/sales-channels', icon: Radio },
      { label: 'Delivery Challan', href: '/app/delivery-challan', icon: Truck },
    ],
  },
  {
    label: 'Stock & Catalog',
    items: [
      { label: 'Inventory', href: '/app/inventory', icon: Boxes },
      { label: 'Categories', href: '/app/inventory/categories', icon: FolderTree },
      { label: 'Purchases', href: '/app/purchases', icon: Warehouse },
      { label: 'Suppliers', href: '/app/suppliers', icon: Truck },
      { label: 'Stores', href: '/app/stores', icon: Store, ownerOnly: true },
      { label: 'Transfers', href: '/app/transfers', icon: RefreshCw },
    ],
  },
  {
    label: 'Customers & Team',
    items: [
      { label: 'Customers', href: '/app/customers', icon: Users, cashierAccessible: true },
      { label: 'WhatsApp Connect', href: '/app/whatsapp-connect', icon: MessageCircle },
      { label: 'Staff', href: '/app/settings/members', icon: UserCog },
    ],
  },
  {
    label: 'Money',
    items: [
      { label: 'Payments', href: '/app/payments', icon: BadgeIndianRupee },
      { label: 'Expenses', href: '/app/expenses', icon: Wallet },
      { label: 'Receivables', href: '/app/receivables', icon: ReceiptText },
      { label: 'GST Documents', href: '/app/documents', icon: ReceiptText, cashierAccessible: true },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Reports', href: '/app/reports', icon: ClipboardList },
      { label: 'Demand Planning', href: '/app/demand-planning', icon: BarChart3 },
      { label: 'AI Copilot', href: '/app/copilot', icon: Sparkles },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Guided Setup', href: '/app/setup', icon: Rocket },
      { label: 'Import Data', href: '/app/import', icon: Upload, ownerOnly: true },
      { label: 'Offline & Sync', href: '/app/offline-sync', icon: RefreshCw },
      { label: 'Hardware & Devices', href: '/app/hardware', icon: Usb },
      { label: 'Customer Display', href: '/app/customer-display', icon: Monitor },
      { label: 'Email', href: '/app/email', icon: Mail },
      { label: 'Notifications', href: '/app/notifications', icon: Bell },
      { label: 'Settings', href: '/app/settings', icon: Settings },
    ],
  },
]

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
