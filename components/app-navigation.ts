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
      { label: 'Billing', href: '/app/billing', icon: ShoppingBag },
      { label: 'Sales / Orders', href: '/app/orders', icon: ClipboardList },
      { label: 'Register', href: '/app/shifts', icon: WalletCards },
      { label: 'Returns & Exchange', href: '/app/returns', icon: RotateCcw },
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
    ],
  },
  {
    label: 'Customers & Team',
    items: [
      { label: 'Customers', href: '/app/customers', icon: Users },
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
