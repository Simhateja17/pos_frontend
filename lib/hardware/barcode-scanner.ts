export type ScannableVariant = { sku: string; barcode?: string | null }

export function exactScannerMatches<T extends { variant: ScannableVariant }>(catalog: T[], input: string): T[] {
  const value = input.trim()
  if (!value) return []
  return catalog.filter(({ variant }) => variant.barcode === value || variant.sku.toLowerCase() === value.toLowerCase())
}
