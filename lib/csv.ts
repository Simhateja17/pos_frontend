/**
 * REPORT-01 — CSV export.
 *
 * Exports are built from the rows already on screen, so a file can never
 * disagree with the table the owner was looking at. Numbers go out unformatted
 * so a spreadsheet can total them; formatting is a display concern.
 */

function escapeCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(headers: readonly string[], rows: readonly (readonly unknown[])[]): string {
  return [headers.map(escapeCell).join(','), ...rows.map((row) => row.map(escapeCell).join(','))].join('\n')
}

export function downloadCsv(fileName: string, headers: readonly string[], rows: readonly (readonly unknown[])[]) {
  // A BOM so Excel opens UTF-8 correctly — without it, ₹ and accented product
  // names arrive mangled, which is exactly the trust problem this phase is about.
  const blob = new Blob(['﻿', toCsv(headers, rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
