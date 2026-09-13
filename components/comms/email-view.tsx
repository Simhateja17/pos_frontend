'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { MailX, Undo2 } from 'lucide-react'
import {
  type EmailLog,
  type EmailSuppressionList,
  createAuthenticatedEmailSuppression,
  getAuthenticatedEmailLog,
  getAuthenticatedEmailSuppressions,
  removeAuthenticatedEmailSuppression,
} from '@/lib/api/authenticated-client'
import { Badge, Card, CardHead, CardPad, DataTable, Fld, KpiRow, Modal, PageHead, SearchField, type KpiItem } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { enumLabel, MessageKey, useT } from '@/lib/i18n/i18n'
import { useAppRegion } from '@/lib/app-region'

const STATUS_TONE = {
  delivered: 'green',
  sent: 'green',
  queued: 'amber',
  failed: 'red',
  bounced: 'red',
  complained: 'red',
  suppressed: 'grey',
} as const

/** Both tables are returned whole by the API, so searching them client-side is enough. */
function matches(values: Array<string | null | undefined>, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return values.filter((value): value is string => Boolean(value)).some((value) => value.toLowerCase().includes(needle))
}

export function EmailView() {
  const t = useT()
  const { dateLocale, pack } = useAppRegion()
  const dateTime = new Intl.DateTimeFormat(dateLocale, {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: pack.timeZone,
  })
  const [log, setLog] = useState<EmailLog | null>(null)
  const [suppressions, setSuppressions] = useState<EmailSuppressionList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [logSearch, setLogSearch] = useState('')
  const [suppressionSearch, setSuppressionSearch] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextLog, nextSuppressions] = await Promise.all([
        getAuthenticatedEmailLog(),
        getAuthenticatedEmailSuppressions(),
      ])
      setLog(nextLog)
      setSuppressions(nextSuppressions)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('email.error'))
    } finally {
      setLoading(false)
    }
    // t is intentionally omitted: changing locale must not refetch email records.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function addSuppression(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      await createAuthenticatedEmailSuppression({ email, reason: 'unsubscribed' })
      setFormOpen(false)
      setEmail('')
      await load()
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : t('email.suppressError'))
    } finally {
      setSaving(false)
    }
  }

  const logEntries = (log?.entries ?? []).filter((entry) =>
    matches([entry.recipient, entry.subject, entry.kind, entry.status, entry.errorMessage], logSearch),
  )
  const suppressedEntries = (suppressions?.suppressions ?? []).filter((entry) =>
    matches([entry.email, entry.reason, entry.detail], suppressionSearch),
  )

  const metrics: KpiItem[] = log
    ? [
        { label: t('email.metrics.sent'), value: String(log.counts.sent + log.counts.delivered), meta: t('email.metrics.sentMeta') },
        { label: t('email.metrics.failed'), value: String(log.counts.failed), meta: log.counts.failed > 0 ? t('email.metrics.failedMeta') : t('email.metrics.noneFailed') },
        { label: t('email.metrics.bounced'), value: String(log.counts.bounced), meta: t('email.metrics.bouncedMeta') },
        { label: t('email.metrics.suppressed'), value: String(log.counts.suppressed), meta: t('email.metrics.suppressedMeta') },
      ]
    : []

  return (
    <>
      <PageHead
        title={t('email.title')}
        sub={t('email.subtitle')}
        actions={
          <button className="btn" type="button" onClick={() => setFormOpen(true)}>
            <MailX size={15} /> {t('email.stopAddress')}
          </button>
        }
      />

      {loading ? (
        <Card>
          <CardPad>
            <LoadingState label={t('email.loading')} rows={5} />
          </CardPad>
        </Card>
      ) : error ? (
        <Card>
          <CardPad>
            <ErrorState message={error} onRetry={() => void load()} />
          </CardPad>
        </Card>
      ) : (
        <>
          <KpiRow items={metrics} cols={4} />

          {log && !log.providerConfigured && (
            <Card>
              <CardPad>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {t('email.providerNotice')}
                </p>
              </CardPad>
            </Card>
          )}

          <Card>
            <CardHead
              title={t('email.sendLog')}
              sub={t('email.sendLogSub')}
              right={
                <SearchField
                  value={logSearch}
                  onChange={setLogSearch}
                  placeholder={t('email.searchLogPlaceholder')}
                  ariaLabel={t('email.searchLogLabel')}
                  width={260}
                />
              }
            />
            {log && log.entries.length === 0 ? (
              <CardPad>
                <EmptyState
                  title={t('email.noEmails')}
                  body={t('email.noEmailsBody')}
                />
              </CardPad>
            ) : logEntries.length === 0 ? (
              <CardPad>
                <EmptyState title={t('email.noMatch')} body={t('email.noMatchBody')} />
              </CardPad>
            ) : (
              <DataTable cols={[t('email.cols.when'), t('email.cols.to'), t('email.cols.kind'), t('email.cols.subject'), t('email.cols.status'), t('email.cols.detail')]} minWidth={880}>
                {logEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="t-mono t-sub">{dateTime.format(new Date(entry.createdAt))}</td>
                    <td>{entry.recipient}</td>
                    <td>{t(`email.kinds.${entry.kind}` as MessageKey)}</td>
                    <td className="t-sub">{entry.subject}</td>
                    <td>
                      <Badge tone={STATUS_TONE[entry.status] ?? 'grey'}>{enumLabel(t, 'status', entry.status)}</Badge>
                    </td>
                    <td className="t-sub">{entry.errorMessage ?? t('email.missing')}</td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Card>

          <Card>
            <CardHead
              title={t('email.doNotEmail')}
              sub={t('email.doNotEmailSub')}
              right={
                <SearchField
                  value={suppressionSearch}
                  onChange={setSuppressionSearch}
                  placeholder={t('email.searchSuppressionPlaceholder')}
                  ariaLabel={t('email.searchSuppressionLabel')}
                  width={240}
                />
              }
            />
            {suppressions && suppressions.suppressions.length === 0 ? (
              <CardPad>
                <EmptyState
                  title={t('email.nobodySuppressed')}
                  body={t('email.nobodySuppressedBody')}
                />
              </CardPad>
            ) : suppressedEntries.length === 0 ? (
              <CardPad>
                <EmptyState title={t('email.noAddressMatch')} body={t('email.noAddressMatchBody')} />
              </CardPad>
            ) : (
              <DataTable cols={[t('email.suppressionCols.address'), t('email.suppressionCols.reason'), t('email.suppressionCols.detail'), t('email.suppressionCols.since'), '']}>
                {suppressedEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.email}</td>
                    <td>
                      <Badge tone={entry.reason === 'unsubscribed' ? 'grey' : 'red'}>{t(`email.reasons.${entry.reason}` as MessageKey)}</Badge>
                    </td>
                      <td className="t-sub">{entry.detail ?? t('email.missing')}</td>
                    <td className="t-mono t-sub">{dateTime.format(new Date(entry.createdAt))}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-ghost"
                        type="button"
                        onClick={async () => {
                          await removeAuthenticatedEmailSuppression(entry.email).catch(() => undefined)
                          await load()
                        }}
                      >
                        <Undo2 size={14} /> {t('email.allowAgain')}
                      </button>
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Card>
        </>
      )}

      {formOpen && (
        <Modal title={t('email.modalTitle')} onClose={() => setFormOpen(false)}>
          <form onSubmit={addSuppression}>
            <Fld id="suppress-email" label={t('email.address')}>
              <input
                id="suppress-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('email.addressPlaceholder')}
              />
            </Fld>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              {t('email.modalNote')}
            </p>
            {formError && <p style={{ fontSize: 12.5, color: 'var(--red, #b42318)', marginTop: 8 }}>{formError}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-grad" type="submit" disabled={saving}>
                {saving ? t('email.saving') : t('email.stopAddress')}
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setFormOpen(false)}>
                {t('email.cancel')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
