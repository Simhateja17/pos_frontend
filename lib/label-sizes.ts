'use client'
import { useCallback, useEffect, useState } from 'react'

/**
 * Physical label stock, in millimetres. One label per printed page: thermal
 * label printers (2-inch Bluetooth units, 4-inch desktop units) feed and cut
 * one sticker per page, so the page size IS the label size.
 *
 * Stored per device, not per tenant: the roll loaded in a counter's printer is
 * a property of that counter's hardware, and two counters can differ.
 */
export type LabelSize = { widthMm: number; heightMm: number }

export const LABEL_SIZE_PRESETS: { id: string; name: string; size: LabelSize }[] = [
  { id: '50x25', name: '50 × 25 mm', size: { widthMm: 50, heightMm: 25 } },
  { id: '50x30', name: '50 × 30 mm', size: { widthMm: 50, heightMm: 30 } },
  { id: '40x30', name: '40 × 30 mm', size: { widthMm: 40, heightMm: 30 } },
  { id: '38x25', name: '38 × 25 mm', size: { widthMm: 38, heightMm: 25 } },
  { id: '100x50', name: '100 × 50 mm', size: { widthMm: 100, heightMm: 50 } },
  { id: '100x150', name: '100 × 150 mm (4 × 6 in)', size: { widthMm: 100, heightMm: 150 } },
]

export const DEFAULT_LABEL_SIZE: LabelSize = LABEL_SIZE_PRESETS[0].size

export const LABEL_SIZE_LIMITS = { min: 20, max: 200 }

const STORAGE_KEY = 'ambel.labelSize'

function isValidSize(value: unknown): value is LabelSize {
  if (!value || typeof value !== 'object') return false
  const { widthMm, heightMm } = value as Record<string, unknown>
  return [widthMm, heightMm].every(
    (n) => typeof n === 'number' && Number.isFinite(n) && n >= LABEL_SIZE_LIMITS.min && n <= LABEL_SIZE_LIMITS.max,
  )
}

export function presetIdFor(size: LabelSize): string | null {
  return LABEL_SIZE_PRESETS.find((p) => p.size.widthMm === size.widthMm && p.size.heightMm === size.heightMm)?.id ?? null
}

/** The page rule handed to the print iframe: page size equals label size, no margins. */
export function labelPageStyle(size: LabelSize): string {
  return `@page { size: ${size.widthMm}mm ${size.heightMm}mm; margin: 0; } html, body { margin: 0; padding: 0; }`
}

export function useLabelSize(): [LabelSize, (size: LabelSize) => void] {
  const [size, setSize] = useState<LabelSize>(DEFAULT_LABEL_SIZE)

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
      if (isValidSize(stored)) setSize(stored)
    } catch {
      // Storage unavailable or corrupt: the default size still prints correctly.
    }
  }, [])

  const update = useCallback((next: LabelSize) => {
    setSize(next)
    if (!isValidSize(next)) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Not persisting is acceptable; the choice still applies this session.
    }
  }, [])

  return [size, update]
}
