'use client'
import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'

/**
 * Label symbology, mirroring tenants.barcode_label_format (migration 0050).
 * Kept as a local union rather than imported from the generated API types so
 * this component stays usable in isolation (tests, previews).
 */
export type BarcodeLabelFormat = 'code128' | 'ean13' | 'upca' | 'qr'

/**
 * Which value each symbology encodes, and whether the variant can satisfy it.
 *
 * CODE128 and QR encode our own SKU, so they work for every variant. EAN-13
 * and UPC-A encode the MANUFACTURER barcode and are fixed-length numeric
 * formats — 13 and 12 digits respectively. A variant with no barcode, or one
 * of the wrong length, cannot be rendered in them at all.
 *
 * Rather than print nothing (a blank label is worse than a scannable one in
 * the wrong symbology) such a variant falls back to CODE128 on its own SKU.
 * The caller is told via onFallback so the UI can say so plainly, per the
 * "never render invented data" rule — a label silently printing a different
 * code than the owner selected is exactly that kind of quiet lie.
 */
function resolveEncoding(
  format: BarcodeLabelFormat,
  sku: string,
  barcode: string | null,
): { format: BarcodeLabelFormat; value: string; fellBack: boolean } {
  if (format === 'ean13' || format === 'upca') {
    const requiredDigits = format === 'ean13' ? 13 : 12
    const usable = barcode && new RegExp(`^\\d{${requiredDigits}}$`).test(barcode)
    if (!usable) {
      return { format: 'code128', value: sku, fellBack: true }
    }
    return { format, value: barcode, fellBack: false }
  }
  return { format, value: sku, fellBack: false }
}

const JSBARCODE_FORMAT: Record<Exclude<BarcodeLabelFormat, 'qr'>, string> = {
  code128: 'CODE128',
  ean13: 'EAN13',
  upca: 'UPC',
}

export function BarcodeLabel({
  sku,
  name,
  price,
  barcode = null,
  format = 'code128',
  onFallback,
}: {
  sku: string
  name: string
  price: string
  /** Manufacturer EAN/UPC, when the variant carries one. */
  barcode?: string | null
  format?: BarcodeLabelFormat
  /** Called when this variant could not be rendered in the selected format. */
  onFallback?: (sku: string) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const encoding = resolveEncoding(format, sku, barcode)

  useEffect(() => {
    if (encoding.fellBack) {
      onFallback?.(sku)
    }
    // onFallback is intentionally excluded: callers pass inline closures, and
    // depending on it would re-fire the notice on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sku, encoding.fellBack])

  useEffect(() => {
    if (encoding.format === 'qr') {
      if (!canvasRef.current) return
      // Low error correction and no quiet-zone margin of its own: the label
      // already provides one, and a thermal label has very little room.
      void QRCode.toCanvas(canvasRef.current, encoding.value, {
        errorCorrectionLevel: 'L',
        margin: 1,
        width: 64,
      })
      return
    }

    if (!svgRef.current) return
    JsBarcode(svgRef.current, encoding.value, {
      format: JSBARCODE_FORMAT[encoding.format],
      width: 2,
      height: 40,
      displayValue: false, // SKU/name rendered separately below per D-05 layout
      margin: 4,
    })
  }, [encoding.format, encoding.value])

  return (
    <div className="label">
      {encoding.format === 'qr' ? <canvas ref={canvasRef} /> : <svg ref={svgRef} />}
      <div className="label-name">{name}</div>
      <div className="label-price">{price}</div>
    </div>
  )
}
