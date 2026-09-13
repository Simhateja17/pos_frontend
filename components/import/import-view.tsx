'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, FileUp, Sparkles } from 'lucide-react'
import {
  type ImportBatch,
  type ImportColumnMapping,
  type ImportCommitResult,
  type ImportKind,
  type ImportMappingSuggestion,
  commitAuthenticatedImport,
  getAuthenticatedImportBatches,
  suggestAuthenticatedImportMapping,
  uploadAuthenticatedImport,
} from '@/lib/api/authenticated-client'
import { Badge, Card, CardHead, CardPad, DataTable, PageHead, Seg } from '@/components/couture/ui'
import { EmptyState, ErrorState, InlineLoader, LoadingState } from '@/components/couture/states'
import { enumLabel, MessageKey, useT } from '@/lib/i18n/i18n'
import { useAppRegion } from '@/lib/app-region'

const KINDS = ['catalog', 'sales'] as const

const IMPORT_FILE_ACCEPT = [
  '.csv',
  '.xlsx',
  '.xls',
  'text/csv',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
].join(',')

const CONFIDENCE_TONE = { high: 'green', medium: 'amber', low: 'grey' } as const

function fileToBase64(file: File, errorMessage: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(errorMessage))
    reader.onload = () => {
      const result = String(reader.result)
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.readAsDataURL(file)
  })
}

export function ImportView() {
  const t = useT()
  const { dateLocale, pack } = useAppRegion()
  const [kind, setKind] = useState<ImportKind>('catalog')
  const [history, setHistory] = useState<ImportBatch[] | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const [batch, setBatch] = useState<ImportBatch | null>(null)
  const [suggestion, setSuggestion] = useState<ImportMappingSuggestion | null>(null)
  const [mappings, setMappings] = useState<ImportColumnMapping[]>([])
  const [result, setResult] = useState<ImportCommitResult | null>(null)

  const [uploading, setUploading] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    setHistoryError(null)
    try {
      const data = await getAuthenticatedImportBatches()
      setHistory(data.batches)
    } catch (cause) {
      setHistoryError(cause instanceof Error ? cause.message : t('importData.historyError'))
    }
    // t is intentionally omitted: changing locale must not refetch import history.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  function reset() {
    setBatch(null)
    setSuggestion(null)
    setMappings([])
    setResult(null)
    setError(null)
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    reset()
    setUploading(true)
    try {
      const staged = await uploadAuthenticatedImport({
        kind,
        fileName: file.name,
        contentBase64: await fileToBase64(file, t('importData.fileReadComputer')),
      })
      setBatch(staged)
      setMappings(
        staged.columns.map((column) => ({
          column: column.name,
          target: null,
          confidence: 'low' as const,
          reason: t('importData.notMapped'),
        })),
      )

      setSuggesting(true)
      try {
        const proposed = await suggestAuthenticatedImportMapping(staged.id)
        setSuggestion(proposed)
        setMappings(proposed.mappings)
      } catch (cause) {
        setSuggestion(null)
        setError(cause instanceof Error ? cause.message : t('importData.suggestedMappingError'))
      } finally {
        setSuggesting(false)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('importData.fileRead'))
    } finally {
      setUploading(false)
    }
  }

  function setTarget(column: string, target: string) {
    setMappings((current) =>
      current.map((mapping) =>
        mapping.column === column
          ? { ...mapping, target: target === '' ? null : target, reason: t('importData.setByYou'), confidence: 'high' }
          : // A target can only be used once, so choosing it here clears it elsewhere.
            target !== '' && mapping.target === target
            ? { ...mapping, target: null, reason: t('importData.cleared'), confidence: 'low' }
            : mapping,
      ),
    )
  }

  async function commit() {
    if (!batch) return
    setCommitting(true)
    setError(null)
    try {
      setResult(
        await commitAuthenticatedImport(batch.id, {
          mappings: mappings.map((mapping) => ({ column: mapping.column, target: mapping.target })),
        }),
      )
      await loadHistory()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('importData.applyError'))
    } finally {
      setCommitting(false)
    }
  }

  const targets = batch?.targetFields ?? []
  const mappedTargets = new Set(mappings.map((mapping) => mapping.target).filter(Boolean))
  const missingRequired = targets.filter((field) => field.required && !mappedTargets.has(field.field))
  const unmapped = mappings.filter((mapping) => mapping.target === null)
  const kindItems = KINDS.map((value) => ({ value, label: t(`importData.kinds.${value}` as MessageKey) }))
  const resultMetrics = [
    ['products', result?.result.productsCreated],
    ['variants', result?.result.variantsCreated],
    ['variantsUpdated', result?.result.variantsUpdated],
    ['sales', result?.result.salesCreated],
    ['lines', result?.result.saleLinesCreated],
    ['opening', result?.result.openingStockMovements],
    ['skipped', result?.result.rowsSkipped],
  ] as const
  const fieldLabel = (field: { field: string; label: string }) => {
    const key = `importData.fields.${field.field}` as MessageKey
    const localized = t(key)
    return localized === key ? field.label : localized
  }
  const delimiterLabel = batch?.delimiter === '\t' ? t('importData.tab') : batch?.delimiter ?? ''

  return (
    <>
      <PageHead
        title={t('importData.title')}
        sub={t('importData.subtitle')}
      />

      {result ? (
        <Card>
          <CardHead
            title={t('importData.resultTitle')}
            sub={t('importData.resultSub', { file: result.batch.fileName, count: result.result.rowsRead })}
            right={<Badge tone="green" dot="g">{t('importData.committed')}</Badge>}
          />
          <CardPad>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {resultMetrics
                .filter(([, value]) => Number(value) > 0)
                .map(([labelKey, value]) => (
                  <div key={labelKey}>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{t(`importData.resultMetrics.${labelKey}` as MessageKey)}</div>
                    <strong style={{ fontSize: 20 }}>{String(value)}</strong>
                  </div>
                ))}
            </div>
            {result.result.dateRange && (
              <p style={{ marginTop: 14, fontSize: 12.5, color: 'var(--muted)' }}>
                {t('importData.historyRange', {
                  from: new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeZone: pack.timeZone }).format(new Date(result.result.dateRange.from)),
                  to: new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeZone: pack.timeZone }).format(new Date(result.result.dateRange.to)),
                })}
              </p>
            )}
            {result.result.issues.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <DataTable cols={[t('importData.issueCols.row'), t('importData.issueCols.reason')]}>
                  {result.result.issues.map((issue) => (
                    <tr key={issue.row}>
                      <td>{issue.row}</td>
                      <td>{issue.reason}</td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            )}
            <button className="btn" style={{ marginTop: 16 }} onClick={reset} type="button">
              {t('importData.another')}
            </button>
          </CardPad>
        </Card>
      ) : batch ? (
        <>
          <Card>
            <CardHead
              title={t('importData.reviewTitle')}
              sub={t('importData.reviewSub', { file: batch.fileName, rows: batch.rowCount, columns: batch.columns.length })}
              right={
                suggestion ? (
                  <Badge tone={suggestion.source === 'claude' ? 'blue' : 'grey'}>
                    {suggestion.source === 'claude' ? t('importData.suggestedClaude') : t('importData.suggestedHeader')}
                  </Badge>
                ) : undefined
              }
            />
            <CardPad style={{ paddingTop: 4 }}>
              {suggesting && <InlineLoader label={t('importData.readingColumns')} />}
              {suggestion?.note && (
                <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>{suggestion.note}</p>
              )}
              <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>
                {t('importData.noSaveYet')}
              </p>
              <DataTable cols={[t('importData.mapCols.column'), t('importData.mapCols.samples'), t('importData.mapCols.target'), t('importData.mapCols.confidence')]}>
                {mappings.map((mapping) => {
                  const column = batch.columns.find((entry) => entry.name === mapping.column)
                  return (
                    <tr key={mapping.column}>
                      <td>
                        <strong>{mapping.column}</strong>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{mapping.reason}</div>
                      </td>
                      <td style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                        {column?.samples.length ? column.samples.join(' · ') : t('importData.allBlank')}
                      </td>
                      <td>
                        <select
                          value={mapping.target ?? ''}
                          onChange={(event) => setTarget(mapping.column, event.target.value)}
                        >
                          <option value="">{t('importData.keepUnmapped')}</option>
                          {targets.map((field) => (
                            <option key={field.field} value={field.field}>
                              {fieldLabel(field)}
                              {field.required ? ' *' : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <Badge tone={CONFIDENCE_TONE[mapping.confidence]}>{t(`importData.confidence.${mapping.confidence}` as MessageKey)}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </DataTable>
            </CardPad>
          </Card>

          <Card>
            <CardHead title={t('importData.whatTitle')} sub={t('importData.whatSub')} />
            <CardPad>
              <ul style={{ fontSize: 13, lineHeight: 1.7, paddingLeft: 18 }}>
                <li>
                  {t('importData.rowsRead', { count: batch.rowCount })}{' '}
                  {batch.blankRowsSkipped > 0 ? t('importData.blankRows', { count: batch.blankRowsSkipped }) : null}{' '}
                  {batch.raggedRows > 0 ? t('importData.raggedRows', { count: batch.raggedRows }) : null}{' '}
                  {t('importData.fileEncoding', { encoding: batch.encoding, delimiter: delimiterLabel })}
                </li>
                <li>
                  {unmapped.length === 0
                    ? t('importData.everyMapped')
                    : unmapped.length === 1
                    ? t('importData.unmappedOne')
                    : t('importData.unmappedMany', { count: unmapped.length })}
                </li>
                {batch.kind === 'sales' && (
                  <li>
                    {t('importData.salesHistoryNote')}
                  </li>
                )}
                {missingRequired.length > 0 && (
                  <li style={{ color: 'var(--red, #b42318)' }}>
                    {t('importData.stillNeeded', { fields: missingRequired.map(fieldLabel).join(', ') })}
                  </li>
                )}
              </ul>
              {error && <p style={{ marginTop: 12, fontSize: 12.5, color: 'var(--red, #b42318)' }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  className="btn btn-grad"
                  type="button"
                  disabled={committing || missingRequired.length > 0}
                  onClick={() => void commit()}
                >
                  <CheckCircle2 size={15} /> {committing ? t('importData.importing') : t('importData.confirm')}
                </button>
                <button className="btn btn-ghost" type="button" onClick={reset} disabled={committing}>
                  {t('importData.cancel')}
                </button>
              </div>
            </CardPad>
          </Card>
        </>
      ) : (
        <Card>
          <CardHead
            title={t('importData.uploadTitle')}
            sub={t('importData.uploadSub')}
            right={<Seg items={kindItems} active={kind} onSelect={setKind} ariaLabel={t('importData.fileLabel')} />}
          />
          <CardPad>
            <label
              className="btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <FileUp size={15} />
              {uploading ? t('importData.readingFile') : t('importData.chooseFile', { kind: t(`importData.kinds.${kind}` as MessageKey) })}
              <input
                type="file"
                accept={IMPORT_FILE_ACCEPT}
                style={{ display: 'none' }}
                disabled={uploading}
                onChange={(event) => void onFile(event.target.files?.[0])}
              />
            </label>
            <p style={{ marginTop: 14, fontSize: 12.5, color: 'var(--muted)', maxWidth: 620 }}>
              <Sparkles size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
              {t('importData.readPlan')}{' '}
              {kind === 'sales' ? t('importData.catalogFirst') : null}
            </p>
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
              {t('importData.supported')}
            </p>
            {error && <p style={{ marginTop: 12, fontSize: 12.5, color: 'var(--red, #b42318)' }}>{error}</p>}
          </CardPad>
        </Card>
      )}

      <Card>
        <CardHead title={t('importData.previous')} sub={t('importData.previousSub')} />
        {historyError ? (
          <CardPad>
            <ErrorState message={historyError} onRetry={() => void loadHistory()} />
          </CardPad>
        ) : history === null ? (
          <CardPad>
            <LoadingState label={t('importData.loadingHistory')} rows={3} />
          </CardPad>
        ) : history.length === 0 ? (
          <CardPad>
            <EmptyState title={t('importData.nothingYet')} body={t('importData.nothingBody')} />
          </CardPad>
        ) : (
          <DataTable cols={[t('importData.historyCols.file'), t('importData.historyCols.type'), t('importData.historyCols.rows'), t('importData.historyCols.status'), t('importData.historyCols.when')]}>
            {history.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.fileName}</td>
                <td>{t(`importData.kinds.${entry.kind}` as MessageKey)}</td>
                <td>{entry.rowCount}</td>
                <td>
                  <Badge tone={entry.status === 'committed' ? 'green' : entry.status === 'failed' ? 'red' : 'grey'}>
                    {enumLabel(t, 'status', entry.status)}
                  </Badge>
                </td>
                <td>{new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeStyle: 'short', timeZone: pack.timeZone }).format(new Date(entry.createdAt))}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>
    </>
  )
}
