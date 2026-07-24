'use client'
import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

export function BarcodeLabel({
  sku,
  name,
  price,
}: {
  sku: string
  name: string
  price: string
}) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, sku, {
        format: 'CODE128', // D-06 — explicit for clarity, matches jsbarcode's default
        width: 2,
        height: 40,
        displayValue: false, // SKU/name rendered separately below per D-05 layout
        margin: 4,
      })
    }
  }, [sku])

  return (
    <div className="label">
      <svg ref={svgRef} />
      <div className="label-name">{name}</div>
      <div className="label-price">{price}</div>
    </div>
  )
}
