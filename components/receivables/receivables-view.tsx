'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { HandCoins } from 'lucide-react'
import { Badge, Card, CardHead, DataTable, Fld, Modal, PageHead, SearchField } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { useAppRegion } from '@/lib/app-region'
import { recordCustomerRepayment } from '@/components/customers/api'
import { getReceivables, type Receivable, type ReceivablesList, type ReceivablesSort } from './api'

const dateTime = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })

function titleFor(customer: Receivable): string {
  return customer.billingName ?? customer.name ?? 'Unnamed customer'
}

export function ReceivablesView() {
  const { money } = useAppRegion()
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
      setError(cause instanceof Error ? cause.message : 'Receivables are unavailable right now.')
    } finally {
      setLoading(false)
    }
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
      setFormError('Enter a repayment amount greater than zero.')
      return
    }
    if (parsedAmount > Number(selected.balance)) {
      setFormError(`Enter ${money(Number(selected.balance))} or less.`)
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      await recordCustomerRepayment(selected.customerId, { amount: parsedAmount.toFixed(2), note: note.trim() || null })
      setSelected(null)
      await load()
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'That repayment could not be recorded.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHead
        title="Receivables"
        sub="Track khata balances across the business and collect repayments"
      />

      <Card>
        <CardHead
          title="Outstanding customer balances"
          sub={data ? `${data.total} customer${data.total === 1 ? '' : 's'} · ${money(Number(data.outstandingTotal))} outstanding` : 'Loading…'}
          right={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <SearchField value={search} onChange={setSearch} placeholder="Search name, phone or email…" ariaLabel="Search receivables" width={240} />
              <select aria-label="Sort receivables" value={sort} onChange={(event) => setSort(event.target.value as ReceivablesSort)} style={{ height: 38, minWidth: 150 }}>
                <option value="balance_desc">Highest balance</option>
                <option value="balance_asc">Lowest balance</option>
                <option value="name_asc">Customer name</option>
                <option value="recent">Recent activity</option>
              </select>
            </div>
          }
        />

        {loading && <LoadingState label="Loading receivables" />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && data?.items.length === 0 && (
          <EmptyState
            icon={<HandCoins size={24} strokeWidth={1.8} />}
            title={search ? 'No balances match this search' : 'No outstanding balances'}
            body={search ? 'Try a different customer name, phone number or email.' : 'Credit sales will appear here when a customer has an amount due.'}
          />
        )}
        {!loading && !error && data && data.items.length > 0 && (
          <DataTable cols={['Customer', 'Contact', 'Outstanding', 'Limit', 'Last activity', 'Action']} minWidth={900}>
            {data.items.map((customer) => (
              <tr key={customer.customerId}>
                <td>
                  <div className="t-strong">{titleFor(customer)}</div>
                  <Link className="t-sub" href={`/app/customers/${customer.customerId}`}>View profile</Link>
                </td>
                <td className="t-sub">{customer.phone ?? customer.email ?? 'No contact on file'}</td>
                <td className="t-mono t-strong" style={{ color: 'var(--danger)' }}>{money(Number(customer.balance))}</td>
                <td>{customer.creditLimit ? <Badge tone="blue">{money(Number(customer.creditLimit))}</Badge> : <span className="t-sub">No limit</span>}</td>
                <td className="t-sub">{customer.recentActivityAt ? dateTime.format(new Date(customer.recentActivityAt)) : 'Not available'}</td>
                <td>
                  <button className="btn btn-sm btn-pri" type="button" onClick={() => openCollection(customer)}><HandCoins size={13} /> Collect</button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      {selected && (
        <Modal title={`Collect from ${titleFor(selected)}`} onClose={() => !saving && setSelected(null)}>
          <form onSubmit={collect}>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
              Outstanding balance: <strong className="num">{money(Number(selected.balance))}</strong>. This creates a repayment entry at the active store.
            </p>
            {formError && <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>{formError}</div>}
            <Fld id="receivable-repayment-amount" label="Amount received">
              <input id="receivable-repayment-amount" type="number" min={0.01} max={Number(selected.balance)} step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="₹0.00" autoFocus />
            </Fld>
            <Fld id="receivable-repayment-note" label="Note (optional)">
              <textarea id="receivable-repayment-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Cash received at the counter" />
            </Fld>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button className="btn" type="button" onClick={() => setSelected(null)} disabled={saving}>Cancel</button>
              <button className="btn btn-pri" type="submit" disabled={saving}>{saving ? 'Recording…' : 'Record repayment'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

