export type InventoryStatus = { label: 'Out of stock' | 'Low stock' | 'In stock'; tone: 'red' | 'amber' | 'green' }

export function inventoryStatus(quantity: number, threshold: number): InventoryStatus {
  if (quantity <= 0) return { label: 'Out of stock', tone: 'red' }
  if (quantity <= threshold) return { label: 'Low stock', tone: 'amber' }
  return { label: 'In stock', tone: 'green' }
}

export function inventoryVariantMatches(
  productName: string,
  variant: { sku: string; barcode: string | null; size: string | null; color: string | null; material: string | null },
  rawQuery: string,
): boolean {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return true
  return [productName, variant.sku, variant.barcode, variant.size, variant.color, variant.material]
    .some((value) => value?.toLowerCase().includes(query))
}

export function equalIntraStateTaxSplit(taxTotal: number) {
  const component = Math.round((taxTotal / 2) * 100) / 100
  return {
    cgst: component,
    sgst: component,
    roundingAdjustment: Math.round((taxTotal - component - component) * 100) / 100,
  }
}

export const purchaseStatusFilters = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Partial', value: 'partial' },
  { label: 'Received', value: 'received' },
  { label: 'Cancelled', value: 'cancelled' },
] as const

export function normalizeReorderReason<T extends Record<string, unknown>>(
  reason: T,
): T & { currentStock: number } {
  const currentStock = Number(reason.currentStock ?? reason.stock ?? 0)
  return { ...reason, currentStock }
}
