'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { HandCoins } from 'lucide-react'
import { Badge, Card, CardHead, DataTable, Fld, Modal, PageHead, SearchField } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { useAppRegion } from '@/lib/app-region'
import { useT } from '@/lib/i18n/i18n'
import { recordCustomerRepayment } from '@/components/customers/api'
import { getReceivables, type Receivable, type ReceivablesList, type ReceivablesSort } from './api'

function titleFor(customer: Receivable, unnamed: string): string {
  return customer.billingName ?? customer.name ?? unnamed
}

export function ReceivablesView() {
  const { money, dateLocale, pack, appPath } = useAppRegion()
  const t = useT()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<ReceivablesSort>('balance_desc')
  const [data, setData] = useState<ReceivablesList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Receivable | null>(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getReceivables(search || undefined, sort))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('receivables.error'))
    } finally {
      setLoading(false)
    }
    // t is intentionally omitted: changing locale must not refetch receivables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250)
    return () => window.clearTimeout(timer)
  }, [load])

  function openCollection(customer: Receivable) {
    setSelected(customer)
    setAmount('')
    setNote('')
    setFormError(null)
  }

  async function collect(event: FormEvent) {
    event.preventDefault()
    if (!selected) return
    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError(t('receivables.enterAmount'))
      return
    }
    if (parsedAmount > Number(selected.balance)) {
      setFormError(t('receivables.enterLess', { amount: money(Number(selected.balance)) }))
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      await recordCustomerRepayment(selected.customerId, { amount: parsedAmount.toFixed(2), note: note.trim() || null })
      setSelected(null)
      await load()
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : t('receivables.error'))
    } finally {
      setSaving(false)
    }
  }

  const dateTime = new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeStyle: 'short', timeZone: pack.timeZone })
  const countLabel = data ? `${data.total} ${data.total === 1 ? t('receivables.customerOne') : t('receivables.customerMany')}` : t('common.loading')

  return (
    <>
      <PageHead
        title={t('receivables.title')}
        sub={t('receivables.subtitle')}
      />

      <Card>
        <CardHead
          title={t('receivables.balanceTitle')}
          sub={data ? t('receivables.balanceSub', { count: countLabel, amount: money(Number(data.outstandingTotal)) }) : t('common.loading')}
          right={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <SearchField value={search} onChange={setSearch} placeholder={t('receivables.searchPlaceholder')} ariaLabel={t('receivables.searchLabel')} width={240} />
              <select aria-label={t('receivables.sortLabel')} value={sort} onChange={(event) => setSort(event.target.value as ReceivablesSort)} style={{ height: 38, minWidth: 150 }}>
                <option value="balance_desc">{t('receivables.sort.highest')}</option>
                <option value="balance_asc">{t('receivables.sort.lowest')}</option>
                <option value="name_asc">{t('receivables.sort.name')}</option>
                <option value="recent">{t('receivables.sort.recent')}</option>
              </select>
            </div>
          }
        />

        {loading && <LoadingState label={t('receivables.loading')} />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && data?.items.length === 0 && (
          <EmptyState
            icon={<HandCoins size={24} strokeWidth={1.8} />}
            title={search ? t('receivables.emptySearchTitle') : t('receivables.emptyTitle')}
            body={search ? t('receivables.emptySearchBody') : t('receivables.emptyBody')}
          />
        )}
        {!loading && !error && data && data.items.length > 0 && (
          <DataTable cols={[t('receivables.cols.customer'), t('receivables.cols.contact'), t('receivables.cols.outstanding'), t('receivables.cols.limit'), t('receivables.cols.activity'), t('receivables.cols.action')]} minWidth={900}>
            {data.items.map((customer) => (
              <tr key={customer.customerId}>
                <td>
                  <div className="t-strong">{titleFor(customer, t('receivables.unnamed'))}</div>
                  <Link className="t-sub" href={appPath(`/app/customers/${customer.customerId}`)}>{t('receivables.viewProfile')}</Link>
                </td>
                <td className="t-sub">{customer.phone ?? customer.email ?? t('receivables.noContact')}</td>
                <td className="t-mono t-strong" style={{ color: 'var(--danger)' }}>{money(Number(customer.balance))}</td>
                <td>{customer.creditLimit ? <Badge tone="blue">{money(Number(customer.creditLimit))}</Badge> : <span className="t-sub">{t('receivables.noLimit')}</span>}</td>
                <td className="t-sub">{customer.recentActivityAt ? dateTime.format(new Date(customer.recentActivityAt)) : t('receivables.notAvailable')}</td>
                <td>
                  <button className="btn btn-sm btn-pri" type="button" onClick={() => openCollection(customer)}><HandCoins size={13} /> {t('receivables.collect')}</button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      {selected && (
        <Modal title={t('receivables.collectTitle', { name: titleFor(selected, t('receivables.unnamed')) })} onClose={() => !saving && setSelected(null)}>
          <form onSubmit={collect}>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
              {t('receivables.outstandingIntro')} <strong className="num">{money(Number(selected.balance))}</strong>. {t('receivables.repaymentNote')}
            </p>
            {formError && <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>{formError}</div>}
            <Fld id="receivable-repayment-amount" label={t('receivables.amount')}>
              <input id="receivable-repayment-amount" type="number" min={0.01} max={Number(selected.balance)} step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={t('receivables.amountPlaceholder')} autoFocus />
            </Fld>
            <Fld id="receivable-repayment-note" label={t('receivables.note')}>
              <textarea id="receivable-repayment-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder={t('receivables.notePlaceholder')} />
            </Fld>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button className="btn" type="button" onClick={() => setSelected(null)} disabled={saving}>{t('receivables.cancel')}</button>
              <button className="btn btn-pri" type="submit" disabled={saving}>{saving ? t('receivables.recording') : t('receivables.record')}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
