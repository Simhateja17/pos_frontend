export const FEAT_ICONS: Record<string, string> = {
  bill: '<path d="M5.5 8.5h13l-1 11a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8z"/><path d="M8.7 8.5V6.2a3.3 3.3 0 0 1 6.6 0v2.3"/>',
  bolt: '<path d="M12.6 2.4 5 13.6h5.2l-1 8L17 10.4h-5.2z"/>',
  inventory: '<path d="M3.2 8.4 12 3.8l8.8 4.6-8.8 4.6z"/><path d="M3.2 8.4v7.3l8.8 4.6 8.8-4.6V8.4M12 13v7.7"/>',
  channels: '<circle cx="12" cy="12" r="2.4"/><path d="M7.2 7.2a6.8 6.8 0 0 0 0 9.6M16.8 7.2a6.8 6.8 0 0 1 0 9.6M4.2 4.2a11 11 0 0 0 0 15.6M19.8 4.2a11 11 0 0 1 0 15.6"/>',
  staff: '<circle cx="9" cy="8.2" r="3.1"/><path d="M3.5 19.4a5.5 5.5 0 0 1 11 0"/><path d="M16 5.4a3 3 0 0 1 0 5.8M17.2 13.6a5.5 5.5 0 0 1 3.3 5.3"/>',
  reports: '<path d="M4.2 4v14.8a1.5 1.5 0 0 0 1.5 1.5H20.5"/><path d="M8 15.2l3.6-4.1 3 2.6L20.2 7.6"/><circle cx="20.2" cy="7.6" r="1.1" fill="currentColor" stroke="none"/>',
  customer: '<circle cx="12" cy="8" r="3.6"/><path d="M5.6 20.2a6.4 6.4 0 0 1 12.8 0"/>',
  challan: '<path d="M2.6 6.4A1.5 1.5 0 0 1 4.1 5h8.4a1.5 1.5 0 0 1 1.5 1.5V16H2.6z"/><path d="M14 9h3.6l3.4 3.6V16H14z"/><circle cx="7" cy="18.4" r="2"/><circle cx="17.4" cy="18.4" r="2"/>',
  payments: '<rect x="2.5" y="5.5" width="19" height="13" rx="2.6"/><path d="M2.5 9.6h19"/><path d="M5.8 14.6H10"/>',
};

export type Feature = [icon: string, title: string, body: string, badge3: string, badge4: string];

export const FEATURES: Feature[] = [
  ["bill", "Billing & Cart", "Ultra-fast billing with barcode scan, product search, multi-cashier, split payment, and real-time GST calculation on every line.", "EXISTING", ""],
  ["bolt", "AI Copilot", "Ask your store anything. Copilot reads live data (stock, sales, customers) and proposes actions with data basis, requiring your approval.", "NEW", "AI"],
  ["inventory", "Inventory & Variants", "Size × colour matrix editor, batch tracking, expiry alerts, smart reorder with Prophet forecasting, and one-click barcode labels.", "", "★"],
  ["channels", "Omnichannel", "POS + website + Instagram + marketplace, all sharing one live stock pool. Orders flow in from every channel automatically.", "NEW", ""],
  ["staff", "Staff & Commissions", "Role-based permissions, shift scheduling, attendance, and an AI coaching score that nudges cashiers on the POS in real time.", "NEW", "★"],
  ["reports", "GST & Reports", "GSTR-1 ready reports, daily P&L, custom builder, scheduled exports, plus a direct filing API to the GST portal (coming).", "", ""],
  ["customer", "Loyalty & CRM", "Tiered points, gift cards, WhatsApp campaigns, DND-safe DLT templates, and AI-segmented audience builder.", "", "IMPROVE"],
  ["challan", "Delivery Challan", "Legally-required B2B and inter-branch dispatch documents, one-click convert to tax invoice on delivery.", "NEW", ""],
  ["payments", "Payments & Settlement", "UPI, card, cash, split, with PSP-level UTR matching, daily settlement reconciliation, and failed-payment resolution.", "", "★"],
];

/**
 * US edition feature set. Same `Feature` tuple and same `FEAT_ICONS` keys as
 * India so both editions render through the identical `.feat-card` grid; only
 * the copy is market-specific.
 */
export const US_FEATURES: Feature[] = [
  ["bill", "Fast Checkout", "Payment-first checkout with barcode scan, variant picker, split tender and tap/chip card capture in a handful of taps.", "EXISTING", ""],
  ["reports", "Sales Tax Automation", "State, county, city and special-district nexus resolved per transaction, with product taxability and exemption certificates.", "NEW", "★"],
  ["channels", "Omnichannel Sync", "One stock pool across store POS, Shopify storefront and social shops. BOPIS and ship-from-store fulfil out of the same inventory.", "NEW", ""],
  ["bolt", "Offline-First Billing", "Keep selling when the internet drops. Sales, tax and card authorisations are stored locally and reconciled the moment you reconnect.", "", "★"],
  ["inventory", "Inventory & Variants", "Size × colour × material matrix, multi-location transfers, purchase orders and reorder suggestions across every channel.", "", "★"],
  ["challan", "BOPIS & Pickup", "Buy-online-pickup-in-store queues, staging shelves, promise times and late-pickup follow-up built into the associate view.", "NEW", ""],
  ["payments", "Payments & Hardware", "Tap/chip readers, cash drawers, receipt and label printers paired from one screen, with store-and-forward card fallback.", "", ""],
  ["customer", "Digital Receipts & Returns", "Email and SMS receipts by default, printed on request, each carrying a return barcode and the full tax breakdown.", "", "IMPROVE"],
  ["staff", "Reports & Staff", "Best sellers, gross margin, tax liability, omnichannel mix and per-associate performance, scheduled straight to your inbox.", "", ""],
];
