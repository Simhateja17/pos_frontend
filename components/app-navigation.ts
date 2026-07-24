import {
  BadgeIndianRupee,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  PackageSearch,
  RotateCcw,
  Settings,
  ShoppingBag,
  Users,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'

export type AppNavItem = {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
}

export type AppNavGroup = {
  label: string
  items: AppNavItem[]
}

export const APP_NAVIGATION: AppNavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Feature Map', href: '/app/feature-map', icon: LayoutDashboard },
      { label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Billing', href: '/app/billing', icon: ShoppingBag },
      { label: 'Sales / Orders', href: '/app/orders', icon: ClipboardList, badge: '342' },
      { label: 'Returns & Exchange', href: '/app/returns', icon: RotateCcw },
      { label: 'Register & Shifts', href: '/app/shifts', icon: WalletCards },
      { label: 'Sales Channels', href: '/app/sales-channels', icon: ClipboardList, badge: 'new' },
      { label: 'Delivery Challan', href: '/app/delivery-challan', icon: ClipboardList, badge: 'new' },
    ],
  },
  {
    label: 'Stock & Catalog',
    items: [
      { label: 'Inventory', href: '/app/inventory', icon: Boxes },
      { label: 'Catalog', href: '/app/inventory/catalog', icon: PackageSearch },
      { label: 'Purchases', href: '/app/purchases', icon: ClipboardList },
      { label: 'Suppliers', href: '/app/suppliers', icon: Users },
    ],
  },
  {
    label: 'Customers & Team',
    items: [
      { label: 'Customers', href: '/app/customers', icon: Users },
      { label: 'Team & Access', href: '/app/settings/members', icon: Settings },
      { label: 'WhatsApp Connect', href: '/app/whatsapp-connect', icon: Users, badge: 'new' },
    ],
  },
  {
    label: 'Money',
    items: [
      { label: 'Payments', href: '/app/payments', icon: BadgeIndianRupee },
      { label: 'Expenses', href: '/app/expenses', icon: BadgeIndianRupee },
      { label: 'Receivables', href: '/app/receivables', icon: BadgeIndianRupee, badge: 'new' },
      { label: 'Credit / Debit Notes', href: '/app/credit-notes', icon: BadgeIndianRupee, badge: 'new' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Reports', href: '/app/reports', icon: ClipboardList },
      { label: 'Analytics', href: '/app/analytics', icon: LayoutDashboard },
      { label: 'AI Copilot', href: '/app/copilot', icon: LayoutDashboard, badge: 'new' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Onboarding', href: '/onboarding/1', icon: Settings },
      { label: 'Offline & Sync', href: '/app/offline-sync', icon: Settings, badge: 'new' },
      { label: 'Hardware & Devices', href: '/app/hardware', icon: Settings, badge: 'new' },
      { label: 'Customer Display', href: '/app/customer-display', icon: Settings, badge: 'new' },
      { label: 'Notifications', href: '/app/notifications', icon: Settings, badge: 'new' },
      { label: 'Settings', href: '/app/settings', icon: Settings },
    ],
  },
]
