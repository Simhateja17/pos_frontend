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

const KINDS: readonly { label: string; value: ImportKind }[] = [
  { label: 'Product catalog', value: 'catalog' },
  { label: 'Sales history', value: 'sales' },
]

const CONFIDENCE_TONE = { high: 'green', medium: 'amber', low: 'grey' } as const

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('That file could not be read from your computer.'))
    reader.onload = () => {
      const result = String(reader.result)
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.readAsDataURL(file)
  })
}

export function ImportView() {
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
      setHistoryError(cause instanceof Error ? cause.message : 'Your import history is unavailable right now.')
    }
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
        contentBase64: await fileToBase64(file),
      })
      setBatch(staged)
      setMappings(
        staged.columns.map((column) => ({
          column: column.name,
          target: null,
          confidence: 'low' as const,
          reason: 'Not mapped yet.',
        })),
      )

      setSuggesting(true)
      try {
        const proposed = await suggestAuthenticatedImportMapping(staged.id)
        setSuggestion(proposed)
        setMappings(proposed.mappings)
      } catch (cause) {
        setSuggestion(null)
        setError(cause instanceof Error ? cause.message : 'A suggested mapping is unavailable. Map the columns yourself.')
      } finally {
        setSuggesting(false)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That file could not be read.')
    } finally {
      setUploading(false)
    }
  }

  function setTarget(column: string, target: string) {
    setMappings((current) =>
      current.map((mapping) =>
        mapping.column === column
          ? { ...mapping, target: target === '' ? null : target, reason: 'Set by you.', confidence: 'high' }
          : // A target can only be used once, so choosing it here clears it elsewhere.
            target !== '' && mapping.target === target
            ? { ...mapping, target: null, reason: 'Cleared — that field is now mapped to another column.', confidence: 'low' }
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
      setError(cause instanceof Error ? cause.message : 'That import could not be applied. Nothing was changed.')
    } finally {
      setCommitting(false)
    }
  }

  const targets = batch?.targetFields ?? []
  const mappedTargets = new Set(mappings.map((mapping) => mapping.target).filter(Boolean))
  const missingRequired = targets.filter((field) => field.required && !mappedTargets.has(field.field))
  const unmapped = mappings.filter((mapping) => mapping.target === null)

  return (
    <>
      <PageHead
        title="Import data"
        sub="Bring your catalog and sales history across from your previous system"
      />

      {result ? (
        <Card>
          <CardHead
            title="Import applied"
            sub={`${result.batch.fileName} · ${result.result.rowsRead} rows read`}
            right={<Badge tone="green" dot="g">Committed</Badge>}
          />
          <CardPad>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {[
                ['Products created', result.result.productsCreated],
                ['Variants created', result.result.variantsCreated],
                ['Variants updated', result.result.variantsUpdated],
                ['Sales created', result.result.salesCreated],
                ['Sale lines created', result.result.saleLinesCreated],
                ['Opening stock receipts', result.result.openingStockMovements],
                ['Rows skipped', result.result.rowsSkipped],
              ]
                .filter(([, value]) => Number(value) > 0)
                .map(([label, value]) => (
                  <div key={String(label)}>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{label}</div>
                    <strong style={{ fontSize: 20 }}>{String(value)}</strong>
                  </div>
                ))}
            </div>
            {result.result.dateRange && (
              <p style={{ marginTop: 14, fontSize: 12.5, color: 'var(--muted)' }}>
                History covers {new Date(result.result.dateRange.from).toLocaleDateString('en-IN')} to{' '}
                {new Date(result.result.dateRange.to).toLocaleDateString('en-IN')}. Reorder suggestions will use it from
                now on.
              </p>
            )}
            {result.result.issues.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <DataTable cols={['Row', 'Why it was skipped']}>
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
              Import another file
            </button>
          </CardPad>
        </Card>
      ) : batch ? (
        <>
          <Card>
            <CardHead
              title="Review the column mapping"
              sub={`${batch.fileName} · ${batch.rowCount} rows · ${batch.columns.length} columns`}
              right={
                suggestion ? (
                  <Badge tone={suggestion.source === 'claude' ? 'blue' : 'grey'}>
                    {suggestion.source === 'claude' ? 'Suggested by Claude' : 'Suggested by header matching'}
                  </Badge>
                ) : undefined
              }
            />
            <CardPad style={{ paddingTop: 4 }}>
              {suggesting && <InlineLoader label="Reading your columns" />}
              {suggestion?.note && (
                <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>{suggestion.note}</p>
              )}
              <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>
                Nothing is saved until you confirm. Columns you leave unmapped are still kept with the imported rows, so
                you can find them later.
              </p>
              <DataTable cols={['Column in your file', 'Sample values', 'Import as', 'Confidence']}>
                {mappings.map((mapping) => {
                  const column = batch.columns.find((entry) => entry.name === mapping.column)
                  return (
                    <tr key={mapping.column}>
                      <td>
                        <strong>{mapping.column}</strong>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{mapping.reason}</div>
                      </td>
                      <td style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                        {column?.samples.length ? column.samples.join(' · ') : 'All blank'}
                      </td>
                      <td>
                        <select
                          value={mapping.target ?? ''}
                          onChange={(event) => setTarget(mapping.column, event.target.value)}
                        >
                          <option value="">Keep, but don’t import</option>
                          {targets.map((field) => (
                            <option key={field.field} value={field.field}>
                              {field.label}
                              {field.required ? ' *' : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <Badge tone={CONFIDENCE_TONE[mapping.confidence]}>{mapping.confidence}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </DataTable>
            </CardPad>
          </Card>

          <Card>
            <CardHead title="What will happen" sub="Read this before you commit" />
            <CardPad>
              <ul style={{ fontSize: 13, lineHeight: 1.7, paddingLeft: 18 }}>
                <li>
                  {batch.rowCount} rows will be read. {batch.blankRowsSkipped > 0 && `${batch.blankRowsSkipped} blank rows were already dropped. `}
                  {batch.raggedRows > 0 && `${batch.raggedRows} rows have fewer columns than the header and will be padded. `}
                  The file was read as {batch.encoding} with “{batch.delimiter === '\t' ? 'tab' : batch.delimiter}” separating columns.
                </li>
                <li>
                  {unmapped.length === 0
                    ? 'Every column is mapped to a field.'
                    : `${unmapped.length} column${unmapped.length === 1 ? '' : 's'} will not become a field, but ${unmapped.length === 1 ? 'it is' : 'they are'} stored with each row and stay retrievable.`}
                </li>
                {batch.kind === 'sales' && (
                  <li>
                    Imported sales are marked as history, not as takings rung up here, and they do not change your
                    current stock levels.
                  </li>
                )}
                {missingRequired.length > 0 && (
                  <li style={{ color: 'var(--red, #b42318)' }}>
                    Still needed: {missingRequired.map((field) => field.label).join(', ')}.
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
                  <CheckCircle2 size={15} /> {committing ? 'Importing…' : 'Confirm and import'}
                </button>
                <button className="btn btn-ghost" type="button" onClick={reset} disabled={committing}>
                  Cancel
                </button>
              </div>
            </CardPad>
          </Card>
        </>
      ) : (
        <Card>
          <CardHead
            title="Upload a CSV export"
            sub="Export from your old system, then drop the file here"
            right={<Seg items={KINDS} active={kind} onSelect={setKind} ariaLabel="What kind of file" />}
          />
          <CardPad>
            <label
              className="btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <FileUp size={15} />
              {uploading ? 'Reading file…' : `Choose ${kind === 'catalog' ? 'catalog' : 'sales history'} file`}
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                style={{ display: 'none' }}
                disabled={uploading}
                onChange={(event) => void onFile(event.target.files?.[0])}
              />
            </label>
            <p style={{ marginTop: 14, fontSize: 12.5, color: 'var(--muted)', maxWidth: 620 }}>
              <Sparkles size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
              We read the file on the server and propose which column is which. You review and correct every mapping
              before anything is saved.
              {kind === 'sales' && ' Import your catalog first — sales lines are matched to products by SKU.'}
            </p>
            {error && <p style={{ marginTop: 12, fontSize: 12.5, color: 'var(--red, #b42318)' }}>{error}</p>}
          </CardPad>
        </Card>
      )}

      <Card>
        <CardHead title="Previous imports" sub="Every file this store has brought across" />
        {historyError ? (
          <CardPad>
            <ErrorState message={historyError} onRetry={() => void loadHistory()} />
          </CardPad>
        ) : history === null ? (
          <CardPad>
            <LoadingState label="Loading import history" rows={3} />
          </CardPad>
        ) : history.length === 0 ? (
          <CardPad>
            <EmptyState title="Nothing imported yet" body="Files you import appear here with what they brought in." />
          </CardPad>
        ) : (
          <DataTable cols={['File', 'Type', 'Rows', 'Status', 'When']}>
            {history.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.fileName}</td>
                <td>{entry.kind === 'catalog' ? 'Catalog' : 'Sales history'}</td>
                <td>{entry.rowCount}</td>
                <td>
                  <Badge tone={entry.status === 'committed' ? 'green' : entry.status === 'failed' ? 'red' : 'grey'}>
                    {entry.status}
                  </Badge>
                </td>
                <td>{new Date(entry.createdAt).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>
    </>
  )
}
