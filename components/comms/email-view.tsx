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
import { Badge, Card, CardHead, CardPad, DataTable, Fld, KpiRow, Modal, PageHead, type KpiItem } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'

const dateTime = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Kolkata',
})

const STATUS_TONE = {
  delivered: 'green',
  sent: 'green',
  queued: 'amber',
  failed: 'red',
  bounced: 'red',
  complained: 'red',
  suppressed: 'grey',
} as const

export function EmailView() {
  const [log, setLog] = useState<EmailLog | null>(null)
  const [suppressions, setSuppressions] = useState<EmailSuppressionList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      setError(cause instanceof Error ? cause.message : 'Email records are unavailable right now.')
    } finally {
      setLoading(false)
    }
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
      setFormError(cause instanceof Error ? cause.message : 'That address could not be suppressed.')
    } finally {
      setSaving(false)
    }
  }

  const metrics: KpiItem[] = log
    ? [
        { label: 'Sent', value: String(log.counts.sent + log.counts.delivered), meta: 'Handed to the email provider' },
        { label: 'Failed', value: String(log.counts.failed), meta: log.counts.failed > 0 ? 'These customers did not get an email' : 'None failed' },
        { label: 'Bounced', value: String(log.counts.bounced), meta: 'Address rejected or reported as spam' },
        { label: 'Suppressed', value: String(log.counts.suppressed), meta: 'Not sent, address is on the do-not-email list' },
      ]
    : []

  return (
    <>
      <PageHead
        title="Email"
        sub="Bills sent to customers, and who we no longer email"
        actions={
          <button className="btn" type="button" onClick={() => setFormOpen(true)}>
            <MailX size={15} /> Stop emailing an address
          </button>
        }
      />

      {loading ? (
        <Card>
          <CardPad>
            <LoadingState label="Loading email records" rows={5} />
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
                  No email provider is connected on this server, so nothing can actually be delivered yet. Attempts are
                  still recorded below so you can see what would have been sent.
                </p>
              </CardPad>
            </Card>
          )}

          <Card>
            <CardHead title="Send log" sub="Every attempt, including the ones that never left" />
            {log && log.entries.length === 0 ? (
              <CardPad>
                <EmptyState
                  title="No emails yet"
                  body="Bills appear here as soon as a sale is completed with a customer email address."
                />
              </CardPad>
            ) : (
              <DataTable cols={['When', 'To', 'Kind', 'Subject', 'Status', 'Detail']} minWidth={880}>
                {(log?.entries ?? []).map((entry) => (
                  <tr key={entry.id}>
                    <td className="t-mono t-sub">{dateTime.format(new Date(entry.createdAt))}</td>
                    <td>{entry.recipient}</td>
                    <td>{entry.kind === 'receipt' ? 'Bill' : entry.kind === 'invoice' ? 'Tax Invoice' : 'Offer'}</td>
                    <td className="t-sub">{entry.subject}</td>
                    <td>
                      <Badge tone={STATUS_TONE[entry.status] ?? 'grey'}>{entry.status}</Badge>
                    </td>
                    <td className="t-sub">{entry.errorMessage ?? '-'}</td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Card>

          <Card>
            <CardHead
              title="Do not email"
              sub="Unsubscribes stop offers only. Bounces and spam complaints stop everything, including bills."
            />
            {suppressions && suppressions.suppressions.length === 0 ? (
              <CardPad>
                <EmptyState
                  title="Nobody is suppressed"
                  body="Addresses that unsubscribe, bounce or report spam appear here automatically."
                />
              </CardPad>
            ) : (
              <DataTable cols={['Address', 'Reason', 'Detail', 'Since', '']}>
                {(suppressions?.suppressions ?? []).map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.email}</td>
                    <td>
                      <Badge tone={entry.reason === 'unsubscribed' ? 'grey' : 'red'}>{entry.reason}</Badge>
                    </td>
                    <td className="t-sub">{entry.detail ?? '-'}</td>
                    <td className="t-mono t-sub">{dateTime.format(new Date(entry.createdAt))}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-sm btn-ghost"
                        type="button"
                        onClick={async () => {
                          await removeAuthenticatedEmailSuppression(entry.email).catch(() => undefined)
                          await load()
                        }}
                      >
                        <Undo2 size={14} /> Allow again
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
        <Modal title="Stop emailing an address" onClose={() => setFormOpen(false)}>
          <form onSubmit={addSuppression}>
            <Fld id="suppress-email" label="Email address">
              <input
                id="suppress-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="customer@example.com"
              />
            </Fld>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              This records an unsubscribe, which stops offers. Bills for purchases they make are still sent, because
              those are not marketing.
            </p>
            {formError && <p style={{ fontSize: 12.5, color: 'var(--red, #b42318)', marginTop: 8 }}>{formError}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-grad" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Stop emailing'}
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setFormOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
