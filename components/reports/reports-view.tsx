'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Info } from 'lucide-react'
import {
  type ReportCatalog,
  type ReportKind,
  type ReportTable,
  getAuthenticatedReport,
  getAuthenticatedReportCatalog,
} from '@/lib/api/authenticated-client'
import { Card, CardHead, CardPad, DataTable, PageHead, Seg, SectionLabel } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

const GROUPS = [
  { label: 'Sales', value: 'sales' },
  { label: 'Payments', value: 'payments' },
  { label: 'Purchases', value: 'purchases' },
  { label: 'Stock', value: 'stock' },
  { label: 'Staff', value: 'staff' },
] as const

type Group = (typeof GROUPS)[number]['value']

function isoDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

function cell(value: string | number | null, money: boolean): string {
  if (value === null || value === undefined) return '-'
  if (money) return currency.format(Number(value))
  return String(value)
}

/**
 * CSV of exactly what is on screen: same columns, same rows, unformatted
 * numbers so a spreadsheet can total them. Built from the report the server
 * returned, so an export can never disagree with the table above it.
 */
function toCsv(report: ReportTable): string {
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const lines = [report.columns.map((column) => escape(column.label)).join(',')]
  for (const row of report.rows) {
    lines.push(report.columns.map((column) => escape(row[column.key])).join(','))
  }
  if (report.totals) {
    lines.push(report.columns.map((column) => escape(report.totals?.[column.key])).join(','))
  }
  return lines.join('\n')
}

function download(report: ReportTable) {
  const blob = new Blob([toCsv(report)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${report.id}-${report.range.from}-to-${report.range.to}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function ReportsView() {
  const [catalog, setCatalog] = useState<ReportCatalog | null>(null)
  const [group, setGroup] = useState<Group>('sales')
  const [kind, setKind] = useState<ReportKind>('sales-by-day')
  const [from, setFrom] = useState(isoDaysAgo(29))
  const [to, setTo] = useState(isoDaysAgo(0))
  const [includeImported, setIncludeImported] = useState(true)

  const [report, setReport] = useState<ReportTable | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        setCatalog(await getAuthenticatedReportCatalog())
      } catch {
        setCatalog(null)
      }
    })()
  }, [])

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      setReport(
        await getAuthenticatedReport({ kind, from, to, includeImported: includeImported ? 'true' : 'false' }),
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That report could not be run.')
    } finally {
      setLoading(false)
    }
  }, [kind, from, to, includeImported])

  useEffect(() => {
    void run()
  }, [run])

  const inGroup = useMemo(
    () => (catalog?.reports ?? []).filter((entry) => entry.group === group),
    [catalog, group],
  )

  function selectGroup(next: Group) {
    setGroup(next)
    const first = (catalog?.reports ?? []).find((entry) => entry.group === next)
    if (first) setKind(first.kind)
  }

  return (
    <>
      <PageHead
        title="Reports"
        sub="Sales, payments, purchases, stock and staff activity over a date range"
        actions={
          <button
            className="btn btn-grad"
            type="button"
            disabled={!report || report.rows.length === 0}
            onClick={() => report && download(report)}
          >
            <Download size={15} /> Export CSV
          </button>
        }
      />

      <Card>
        <CardHead title="Choose a report" right={<Seg items={GROUPS} active={group} onSelect={selectGroup} ariaLabel="Report group" />} />
        <CardPad style={{ paddingTop: 4 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {inGroup.map((entry) => (
              <button
                key={entry.kind}
                type="button"
                className={entry.kind === kind ? 'btn btn-sm btn-grad' : 'btn btn-sm btn-ghost'}
                onClick={() => setKind(entry.kind)}
              >
                {entry.title}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
            <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
              <SectionLabel>From</SectionLabel>
              <input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} />
            </label>
            <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
              <SectionLabel>To</SectionLabel>
              <input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} />
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5 }}>
              <input
                type="checkbox"
                checked={includeImported}
                onChange={(event) => setIncludeImported(event.target.checked)}
              />
              Include imported history
            </label>
          </div>
        </CardPad>
      </Card>

      <Card>
        {loading ? (
          <CardPad>
            <LoadingState label="Running the report" rows={6} />
          </CardPad>
        ) : error ? (
          <CardPad>
            <ErrorState message={error} onRetry={() => void run()} />
          </CardPad>
        ) : !report ? null : (
          <>
            <CardHead
              title={report.title}
              sub={`${report.description} · ${report.range.from} to ${report.range.to}`}
            />
            {report.unavailable.length > 0 && (
              <CardPad style={{ paddingTop: 0, paddingBottom: 4 }}>
                {report.unavailable.map((entry) => (
                  <p key={entry.what} style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 6 }}>
                    <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>
                      <strong>{entry.what}:</strong> {entry.reason}
                    </span>
                  </p>
                ))}
              </CardPad>
            )}
            {report.rows.length === 0 ? (
              <CardPad>
                <EmptyState
                  title="Nothing in this range"
                  body="No records fall between the dates you chose. Widen the range, or check back once the store has traded."
                />
              </CardPad>
            ) : (
              <DataTable
                headerAlign="center"
                cols={report.columns.map((column) => ({
                  label: column.label,
                  align: column.align === 'right' ? ('right' as const) : undefined,
                }))}
              >
                {report.rows.map((row, index) => (
                  <tr key={index}>
                    {report.columns.map((column) => (
                      <td
                        key={column.key}
                        style={column.align === 'right' ? { textAlign: 'right' } : undefined}
                      >
                        {cell(row[column.key] ?? null, column.money)}
                      </td>
                    ))}
                  </tr>
                ))}
                {report.totals && (
                  <tr style={{ fontWeight: 600 }}>
                    {report.columns.map((column) => (
                      <td
                        key={column.key}
                        style={column.align === 'right' ? { textAlign: 'right' } : undefined}
                      >
                        {report.totals?.[column.key] === undefined
                          ? ''
                          : cell(report.totals[column.key] ?? null, column.money)}
                      </td>
                    ))}
                  </tr>
                )}
              </DataTable>
            )}
          </>
        )}
      </Card>
    </>
  )
}
