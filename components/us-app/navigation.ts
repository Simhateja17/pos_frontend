import {
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Printer,
  ReceiptText,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'

export type UsNavId = 'dash' | 'checkout' | 'tax' | 'sync' | 'stock' | 'orders' | 'hardware' | 'reports'

export const NAMES: Record<UsNavId, string> = {
  dash: 'Dashboard',
  checkout: 'Fast Checkout',
  tax: 'Sales Tax',
  sync: 'Offline Sync',
  stock: 'Inventory + Variants',
  orders: 'Orders',
  hardware: 'Hardware Setup',
  reports: 'Reports',
}

export const NAV_GROUPS: ReadonlyArray<{
  label: string
  items: ReadonlyArray<{ id: UsNavId; href: string; icon: LucideIcon }>
}> = [
  {
    label: 'Core',
    items: [
      { id: 'dash', href: '/us/dashboard', icon: LayoutDashboard },
      { id: 'checkout', href: '/us/dashboard/billing', icon: CreditCard },
      { id: 'tax', href: '/us/dashboard/settings/tax', icon: ReceiptText },
      { id: 'sync', href: '/us/dashboard/sync', icon: RefreshCw },
    ],
  },
  {
    label: 'Retail operations',
    items: [
      { id: 'stock', href: '/us/dashboard/inventory', icon: Boxes },
      { id: 'orders', href: '/us/dashboard/orders', icon: ClipboardList },
      { id: 'hardware', href: '/us/dashboard/hardware', icon: Printer },
      { id: 'reports', href: '/us/dashboard/reports', icon: BarChart3 },
    ],
  },
]

export function navIdForPath(pathname: string): UsNavId {
  if (pathname.startsWith('/us/dashboard/billing')) return 'checkout'
  if (pathname.startsWith('/us/dashboard/settings/tax')) return 'tax'
  if (pathname.startsWith('/us/dashboard/sync')) return 'sync'
  if (pathname.startsWith('/us/dashboard/inventory')) return 'stock'
  if (pathname.startsWith('/us/dashboard/orders')) return 'orders'
  if (pathname.startsWith('/us/dashboard/hardware')) return 'hardware'
  if (pathname.startsWith('/us/dashboard/reports')) return 'reports'
  return 'dash'
}
