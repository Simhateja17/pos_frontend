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
    items: [{ label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Billing', href: '/app/billing', icon: ShoppingBag },
      { label: 'Sales / Orders', href: '/app/orders', icon: ClipboardList, badge: '342' },
      { label: 'Returns & Exchange', href: '/app/returns', icon: RotateCcw },
      { label: 'Register & Shifts', href: '/app/shifts', icon: WalletCards },
    ],
  },
  {
    label: 'Stock & Catalog',
    items: [
      { label: 'Inventory', href: '/app/inventory', icon: Boxes },
      { label: 'Catalog', href: '/app/inventory/catalog', icon: PackageSearch },
    ],
  },
  {
    label: 'Customers & Team',
    items: [
      { label: 'Customers', href: '/app/customers', icon: Users },
      { label: 'Team & Access', href: '/app/settings/members', icon: Settings },
    ],
  },
  {
    label: 'Money',
    items: [{ label: 'Payments', href: '/app/payments', icon: BadgeIndianRupee }],
  },
]

