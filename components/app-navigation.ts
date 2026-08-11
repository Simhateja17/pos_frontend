import {
  BadgeIndianRupee,
  BarChart3,
  Bell,
  BookText,
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
  WalletCards,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'

export type AppNavItem = {
  label: string
  href: string
  icon: LucideIcon
  /**
   * Product-capability label from the approved design (not store data).
   * Marks modules that are announced but have no Phase 1-3 backend contract —
   * those routes render the explicit unavailable state.
   */
  badge?: 'new'
  /** Visible to, and route-authorized for, a PIN-logged cashier. */
  cashierAccessible?: boolean
  /**
   * Owner-only module (Phase 8). Stores is the only one: a manager or cashier
   * belongs to exactly one shop and has no business enumerating the others.
   *
   * This hides the nav entry — it is NOT the permission. The server refuses a
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
      { label: 'Sales / Orders', href: '/app/orders', icon: ClipboardList, cashierAccessible: true },
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
      { label: 'Credit / Debit Notes', href: '/app/credit-notes', icon: BookText },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Reports', href: '/app/reports', icon: ClipboardList },
      { label: 'Analytics', href: '/app/analytics', icon: BarChart3 },
      { label: 'AI Copilot', href: '/app/copilot', icon: Sparkles },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Import Data', href: '/app/import', icon: Upload },
      { label: 'Offline & Sync', href: '/app/offline-sync', icon: RefreshCw },
      { label: 'Hardware & Devices', href: '/app/hardware', icon: Usb },
      { label: 'Customer Display', href: '/app/customer-display', icon: Monitor },
      { label: 'Email', href: '/app/email', icon: Mail },
      { label: 'Notifications', href: '/app/notifications', icon: Bell },
      { label: 'Settings', href: '/app/settings', icon: Settings },
    ],
  },
]

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
  return APP_NAVIGATION.some((group) =>
    group.items.some(
      (item) => item.cashierAccessible && (pathname === item.href || pathname.startsWith(`${item.href}/`)),
    ),
  )
}

export function roleCanAccessAppPath(role: 'owner' | 'manager' | 'cashier', pathname: string): boolean {
  const candidates = APP_NAVIGATION.flatMap((group) => group.items)
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)
  const matched = candidates[0]
  if (!matched) return role !== 'cashier'
  if (matched.ownerOnly) return role === 'owner'
  if (role === 'cashier') return Boolean(matched.cashierAccessible)
  return true
}
