'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Play, RefreshCw } from 'lucide-react'
import { AuthenticatedRequestError, getAuthenticatedReport, getAuthenticatedReportCatalog, type ReportCatalog, type ReportKind, type ReportTable } from '@/lib/api/authenticated-client'
import { downloadCsv } from '@/lib/csv'
import { UsCard, UsCardBody, UsCardHeader, UsEmptyState, UsErrorState, UsLoadingState, UsPageHead } from './states'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

function localDate(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function errorMessage(error: unknown) { return error instanceof AuthenticatedRequestError || error instanceof Error ? error.message : 'Reports are unavailable right now.' }

export function UsReportsView() {
  const [catalog, setCatalog] = useState<ReportCatalog | null>(null)
  const [selectedKind, setSelectedKind] = useState<ReportKind | ''>('')
  const [from, setFrom] = useState(() => { const date = new Date(); date.setDate(date.getDate() - 30); return localDate(date) })
  const [to, setTo] = useState(() => localDate(new Date()))
  const [includeImported, setIncludeImported] = useState(false)
  const [report, setReport] = useState<ReportTable | null>(null)
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true)
    setError(null)
    try {
      const nextCatalog = await getAuthenticatedReportCatalog()
      setCatalog(nextCatalog)
      setSelectedKind((current) => current || nextCatalog.reports[0]?.kind || '')
    } catch (nextError) {
      setError(errorMessage(nextError))
    } finally {
      setLoadingCatalog(false)
    }
  }, [])

  useEffect(() => { void loadCatalog() }, [loadCatalog])

  async function runReport() {
    if (!selectedKind) return
    if (from > to) {
      setError('The report start date must be on or before the end date.')
      return
    }
    setRunning(true)
    setError(null)
    try {
      setReport(await getAuthenticatedReport({ kind: selectedKind, from, to, includeImported: includeImported ? 'true' : 'false' }))
    } catch (nextError) {
      setError(errorMessage(nextError))
    } finally {
      setRunning(false)
    }
  }

  const selectedReport = catalog?.reports.find((entry) => entry.kind === selectedKind)
  const groupedReports = useMemo(() => {
    if (!catalog) return []
    return ['sales', 'payments', 'purchases', 'stock', 'staff'].map((group) => ({ group, reports: catalog.reports.filter((entry) => entry.group === group) })).filter((entry) => entry.reports.length > 0)
  }, [catalog])

  function exportReport() {
    if (!report) return
    downloadCsv(
      `${report.id}-${report.range.from}-to-${report.range.to}.csv`,
      report.columns.map((column) => column.label),
      report.rows.map((row) => report.columns.map((column) => row[column.key] ?? '')),
    )
  }

  if (loadingCatalog) return <><UsPageHead title="Reports" sub="Run the reports exposed by the live International backend" /><UsLoadingState label="Loading report catalog" rows={7} /></>
  if (error && !catalog) return <><UsPageHead title="Reports" sub="Run the reports exposed by the live International backend" /><UsCard><UsErrorState message={error} onRetry={() => void loadCatalog()} /></UsCard></>
  if (!catalog || catalog.reports.length === 0) return <><UsPageHead title="Reports" sub="Run the reports exposed by the live International backend" /><UsCard><UsEmptyState title="No reports are available" body="The backend returned an empty report catalog for this tenant." /></UsCard></>

  return (
    <>
      <UsPageHead title="Reports" sub="All report kinds come from GET /reports/catalog" actions={<button type="button" className="btn" onClick={() => void loadCatalog()} disabled={loadingCatalog}><RefreshCw size={14} />Refresh catalog</button>} />
      {error ? <div className="notice error" role="alert" style={{ marginBottom: 14 }}>{error}</div> : null}
      <UsCard>
        <UsCardHeader title="Report runner" sub={selectedReport?.description || 'Choose a report and date range.'} />
        <UsCardBody>
          <div className="report-picker">
            <div className="field"><label htmlFor="us-report-kind">Report</label><select id="us-report-kind" value={selectedKind} onChange={(event) => setSelectedKind(event.target.value as ReportKind)}>{groupedReports.map(({ group, reports }) => <optgroup key={group} label={group}>{reports.map((entry) => <option key={entry.kind} value={entry.kind}>{entry.title}</option>)}</optgroup>)}</select></div>
            <div className="field"><label htmlFor="us-report-from">From</label><input id="us-report-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></div>
            <div className="field"><label htmlFor="us-report-to">To</label><input id="us-report-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></div>
            <div className="page-actions"><button type="button" className="btn btn-primary" onClick={() => void runReport()} disabled={running || !selectedKind}><Play size={14} />{running ? 'Running…' : 'Run report'}</button>{report ? <button type="button" className="btn" onClick={exportReport}><Download size={14} />CSV</button> : null}</div>
          </div>
          <label style={{ display: 'inline-flex', gap: 7, alignItems: 'center', marginTop: 13, color: 'var(--muted)', fontSize: 12 }}><input type="checkbox" checked={includeImported} onChange={(event) => setIncludeImported(event.target.checked)} />Include imported records when the report supports them</label>
        </UsCardBody>
      </UsCard>

      {running ? <UsCard style={{ marginTop: 14 }}><UsLoadingState label="Running report" rows={6} /></UsCard> : null}
      {report && !running ? <UsCard style={{ marginTop: 14 }}><UsCardHeader title={report.title} sub={`${report.description} · ${report.range.from} to ${report.range.to}`} right={<span className="badge b-blue">Generated {new Date(report.generatedAt).toLocaleString('en-US')}</span>} />{report.unavailable.length > 0 ? <UsCardBody><div className="notice">{report.unavailable.map((item) => <div key={`${item.what}-${item.reason}`}><b>{item.what}:</b> {item.reason}</div>)}</div></UsCardBody> : null}{report.rows.length === 0 ? <UsEmptyState title="No records in this range" body="The selected report ran successfully, but the backend returned no rows for these dates." /> : <div className="table-wrap"><table className="dtable"><thead><tr>{report.columns.map((column) => <th key={column.key} style={{ textAlign: column.align }}>{column.label}</th>)}</tr></thead><tbody>{report.rows.map((row, index) => <tr key={index}>{report.columns.map((column) => <td key={column.key} className={column.money ? 'num' : ''} style={{ textAlign: column.align }}>{formatCell(row[column.key], column.money)}</td>)}</tr>)}{report.totals ? <tr>{report.columns.map((column, index) => <td key={column.key} className={column.money ? 'num' : ''} style={{ textAlign: column.align }}><b>{index === 0 ? 'Total' : formatCell(report.totals?.[column.key], column.money)}</b></td>)}</tr> : null}</tbody></table></div>}</UsCard> : null}
    </>
  )
}

function formatCell(value: string | number | null | undefined, isMoney: boolean) {
  if (value === null || value === undefined || value === '') return '—'
  return isMoney ? usd.format(Number(value)) : String(value)
}
