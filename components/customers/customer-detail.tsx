'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Edit3, ExternalLink, HandCoins } from 'lucide-react'
import { Badge, Card, CardHead, DataTable, Fld, Modal, PageHead, SearchField } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { Pagination } from '@/components/records/orders-view'
import { getAuthenticatedAppContext } from '@/lib/api/authenticated-client'
import {
  getCustomer,
  getCustomerCredit,
  getCustomerPurchases,
  recordCustomerRepayment,
  updateCustomer,
  type Customer,
  type CustomerCredit,
  type CustomerPurchaseList,
  type CustomerWrite,
} from './api'
import { CustomerForm } from './customer-form'
import { useAppRegion } from '@/lib/app-region'

const dateTime = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })

function displayAddress(customer: Customer): string {
  return [customer.addressLine1, customer.addressLine2, customer.city, customer.stateCode, customer.postalCode]
    .filter(Boolean)
    .join(', ')
}

function titleFor(customer: Customer): string {
  return customer.billingName ?? customer.name ?? 'Unnamed customer'
}

/**
 * The purchases endpoint only pages, it does not search, so the filter runs over
 * the page that is already on screen and says so in the empty state.
 */
function matchesPurchase(purchase: CustomerPurchaseList['items'][number], query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [
    purchase.documentNumber,
    purchase.documentType,
    purchase.id,
    purchase.store?.name,
    purchase.status,
    purchase.total,
    ...purchase.paymentMethods,
  ]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(needle))
}

export function CustomerDetailView({ customerId }: { customerId: string }) {
  const { money, region, appPath } = useAppRegion()
  const showIndiaCredit = region === 'IN'
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [credit, setCredit] = useState<CustomerCredit | null>(null)
  const [purchases, setPurchases] = useState<CustomerPurchaseList | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [creditLoading, setCreditLoading] = useState(true)
  const [creditError, setCreditError] = useState<string | null>(null)
  const [historySearch, setHistorySearch] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [role, setRole] = useState<'owner' | 'manager' | 'cashier' | null>(null)
  const [repaymentOpen, setRepaymentOpen] = useState(false)
  const [repaymentAmount, setRepaymentAmount] = useState('')
  const [repaymentNote, setRepaymentNote] = useState('')
  const [repaymentSaving, setRepaymentSaving] = useState(false)
  const [repaymentError, setRepaymentError] = useState<string | null>(null)

  const loadCustomer = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCustomer(await getCustomer(customerId))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This customer profile is unavailable right now.')
    } finally {
      setLoading(false)
    }
  }, [customerId])

  const loadPurchases = useCallback(
    async (nextCursor?: string) => {
      setHistoryLoading(true)
      setHistoryError(null)
      try {
        setPurchases(await getCustomerPurchases(customerId, nextCursor))
        setCursor(nextCursor)
      } catch (cause) {
        setHistoryError(cause instanceof Error ? cause.message : 'Purchase history is unavailable right now.')
      } finally {
        setHistoryLoading(false)
      }
    },
    [customerId],
  )

  const loadCredit = useCallback(async () => {
    setCreditLoading(true)
    setCreditError(null)
    try {
      setCredit(await getCustomerCredit(customerId))
    } catch (cause) {
      setCreditError(cause instanceof Error ? cause.message : 'Customer credit details are unavailable right now.')
    } finally {
      setCreditLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    void loadCustomer()
    void loadPurchases()
    if (showIndiaCredit) {
      void loadCredit()
    } else {
      setCredit(null)
      setCreditError(null)
      setCreditLoading(false)
    }
    void getAuthenticatedAppContext().then((context) => setRole(context.staff.role)).catch(() => setRole(null))
  }, [loadCustomer, loadPurchases, loadCredit, showIndiaCredit])

  async function save(body: CustomerWrite) {
    setSaving(true)
    setFormError(null)
    try {
      setCustomer(await updateCustomer(customerId, body))
      setEditOpen(false)
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'That customer could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  async function collectRepayment(event: FormEvent) {
    event.preventDefault()
    setRepaymentError(null)
    const amount = Number(repaymentAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setRepaymentError('Enter a repayment amount greater than zero.')
      return
    }
    if (credit && amount > Number(credit.balance)) {
      setRepaymentError(`Enter ${money(Number(credit.balance))} or less.`)
      return
    }

    setRepaymentSaving(true)
    try {
      await recordCustomerRepayment(customerId, {
        amount: amount.toFixed(2),
        note: repaymentNote.trim() || null,
      })
      setRepaymentOpen(false)
      setRepaymentAmount('')
      setRepaymentNote('')
      await loadCredit()
    } catch (cause) {
      setRepaymentError(cause instanceof Error ? cause.message : 'That repayment could not be recorded.')
    } finally {
      setRepaymentSaving(false)
    }
  }

  if (loading) return <LoadingState label="Loading customer profile" />
  if (error || !customer) return <ErrorState message={error ?? 'Customer profile unavailable'} onRetry={() => void loadCustomer()} />

  const address = displayAddress(customer)
  const visiblePurchases = (purchases?.items ?? []).filter((purchase) => matchesPurchase(purchase, historySearch))

  return (
    <>
      <PageHead
        title={titleFor(customer)}
        sub={showIndiaCredit ? 'Customer profile, khata balance and persisted purchase history' : 'Customer profile and persisted purchase history'}
        actions={
          <>
            <Link className="btn" href={appPath('/app/customers')}><ArrowLeft size={15} /> Customers</Link>
              <button className="btn btn-pri" onClick={() => { setFormError(null); setEditOpen(true) }}><Edit3 size={15} /> Edit profile</button>
          </>
        }
      />

      <div className="split-2">
        <Card>
          <CardHead title="Identity" sub="Used to find and safely deduplicate this customer" />
          <div style={{ display: 'grid', gap: 13, padding: 18 }}>
            <Info label="Billing name" value={titleFor(customer)} />
            <Info label="Phone" value={customer.phone ?? 'Not provided'} mono />
            <Info label="Email" value={customer.email ?? 'Not provided'} />
            <Info label="Profile updated" value={dateTime.format(new Date(customer.updatedAt))} />
            {customer.notes ? <Info label="Notes" value={customer.notes} /> : null}
          </div>
        </Card>

        <Card>
          <CardHead title="Billing information" sub="Optional GST identity and address for future documents" />
          <div style={{ display: 'grid', gap: 13, padding: 18 }}>
            <Info label="GSTIN" value={customer.gstin ?? 'Not provided'} mono />
            <Info label="Address" value={address || 'No billing address on file'} />
            <Info label="Country" value={customer.country} />
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              {showIndiaCredit
                ? 'GSTIN and address are stored as customer billing identity. Khata is tracked separately below and is shared across this business’s stores.'
                : 'Customer identity and address are stored here as billing information for future documents.'}
            </div>
          </div>
        </Card>
      </div>

      {showIndiaCredit && (
        <Card>
          <CardHead
            title="Khata balance"
            sub="Outstanding credit across all stores"
            right={credit && Number(credit.balance) > 0 ? (
              <button
                className="btn btn-pri"
                type="button"
                onClick={() => { setRepaymentError(null); setRepaymentOpen(true) }}
              >
                <HandCoins size={15} /> Collect payment
              </button>
            ) : null}
          />
          {creditLoading && <LoadingState label="Loading khata balance" rows={2} />}
          {!creditLoading && creditError && <ErrorState message={creditError} onRetry={() => void loadCredit()} />}
          {!creditLoading && !creditError && credit && (
            <>
              <div style={{ display: 'flex', alignItems: 'end', gap: 28, flexWrap: 'wrap', padding: '18px 18px 14px' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Outstanding</div>
                  <div className="num" style={{ marginTop: 4, fontSize: 28, fontWeight: 700, color: Number(credit.balance) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {money(Number(credit.balance))}
                  </div>
                </div>
                <Info label="Credit limit" value={credit.creditLimit ? money(Number(credit.creditLimit)) : 'No limit set'} mono />
                <div style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 390, lineHeight: 1.5 }}>
                  Credit sales add to this balance. Repayments reduce it. The balance is derived from the ledger, not typed in by the team.
                </div>
              </div>
              {credit.transactions.length === 0 ? (
                <EmptyState title="No khata entries" body="Credit sales and repayments for this customer will appear here." />
              ) : (
                <DataTable cols={['Entry', 'Date', 'Store', 'Amount', 'Note']} minWidth={760}>
                  {credit.transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <div className="t-strong">{transaction.type === 'credit_sale' ? 'Credit sale' : 'Repayment'}</div>
                        {transaction.saleId ? <Link className="t-sub t-mono" href={appPath(`/app/orders/${encodeURIComponent(transaction.saleId)}`)}>Open bill</Link> : null}
                      </td>
                      <td className="t-sub">{dateTime.format(new Date(transaction.createdAt))}</td>
                      <td className="t-sub">{transaction.storeName ?? 'Store unavailable'}</td>
                      <td className={`t-mono t-strong ${transaction.type === 'repayment' ? 'text-success' : 'text-danger'}`}>
                        {transaction.type === 'repayment' ? '−' : '+'}{money(Number(transaction.amount))}
                      </td>
                      <td className="t-sub">{transaction.note ?? '—'}</td>
                    </tr>
                  ))}
                </DataTable>
              )}
            </>
          )}
        </Card>
      )}

      <Card>
        <CardHead
          title="Purchase history"
          sub={purchases ? `${purchases.total} persisted sale${purchases.total === 1 ? '' : 's'}` : 'Loading…'}
          right={
            <SearchField
              value={historySearch}
              onChange={setHistorySearch}
              placeholder="Search bill, store or payment…"
              ariaLabel="Search purchase history"
              width={240}
            />
          }
        />
        {historyLoading && <LoadingState label="Loading purchase history" />}
        {!historyLoading && historyError && <ErrorState message={historyError} onRetry={() => void loadPurchases(cursor)} />}
        {!historyLoading && !historyError && purchases?.items.length === 0 && (
          <EmptyState title="No purchases found" body="Completed sales linked to this customer will appear here. Walk-in sales remain anonymous." />
        )}
        {!historyLoading && !historyError && purchases && purchases.items.length > 0 && visiblePurchases.length === 0 && (
          <EmptyState
            title="No purchases match this search"
            body="Only the purchases on this page are searched. Clear the search or move to the next page to look further back."
          />
        )}
        {!historyLoading && !historyError && purchases && visiblePurchases.length > 0 && (
          <DataTable cols={['Bill / document', 'Date', 'Store', 'Total', 'Payment', 'Status', 'Actions']} minWidth={980}>
            {visiblePurchases.map((purchase) => (
              <tr key={purchase.id}>
                <td>
                  <div className="t-strong">{purchase.documentNumber ?? `Sale ${purchase.id.slice(0, 8).toUpperCase()}`}</div>
                  <div className="t-mono t-sub" style={{ fontSize: 11 }}>{purchase.id}</div>
                </td>
                <td className="t-sub">{dateTime.format(new Date(purchase.date))}</td>
                <td className="t-sub">{purchase.store?.name ?? 'Store unavailable'}</td>
                <td className="t-mono t-strong">{money(Number(purchase.total))}</td>
                <td className="t-sub">{purchase.paymentMethods.length ? purchase.paymentMethods.join(' + ') : 'Not recorded'}</td>
                <td><Badge tone={purchase.status === 'completed' ? 'green' : 'grey'}>{purchase.status}</Badge></td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Link className="btn btn-sm" href={appPath(`/app/orders/${encodeURIComponent(purchase.id)}`)}><ExternalLink size={13} /> Open bill</Link>
                    <Link className="btn btn-sm" href={appPath(`/app/returns?saleId=${encodeURIComponent(purchase.id)}`)}>Bill / return</Link>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
        {purchases && !historyLoading && !historyError && (
          <Pagination
            shown={visiblePurchases.length}
            total={purchases.total}
            previous={cursor}
            next={purchases.nextCursor}
            onPrevious={() => void loadPurchases(undefined)}
            onNext={() => void loadPurchases(purchases.nextCursor ?? undefined)}
          />
        )}
      </Card>

      {editOpen && (
        <Modal title={`Edit ${titleFor(customer)}`} onClose={() => !saving && setEditOpen(false)}>
          <CustomerForm
            customer={customer}
            onSave={save}
            onCancel={() => setEditOpen(false)}
            saving={saving}
            serverError={formError}
            canEditCreditLimit={showIndiaCredit && (role === 'owner' || role === 'manager')}
          />
        </Modal>
      )}

      {repaymentOpen && credit && (
        <Modal title={`Collect from ${titleFor(customer)}`} onClose={() => !repaymentSaving && setRepaymentOpen(false)}>
          <form onSubmit={collectRepayment}>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
              Outstanding balance: <strong className="num">{money(Number(credit.balance))}</strong>. This records a repayment entry at the active store.
            </p>
            {repaymentError && <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>{repaymentError}</div>}
            <Fld id="customer-repayment-amount" label="Amount received">
              <input
                id="customer-repayment-amount"
                type="number"
                min={0.01}
                max={Number(credit.balance)}
                step="0.01"
                inputMode="decimal"
                value={repaymentAmount}
                onChange={(event) => setRepaymentAmount(event.target.value)}
                placeholder={money(0)}
                autoFocus
              />
            </Fld>
            <Fld id="customer-repayment-note" label="Note (optional)">
              <textarea id="customer-repayment-note" rows={3} value={repaymentNote} onChange={(event) => setRepaymentNote(event.target.value)} placeholder="e.g. Cash received at the counter" />
            </Fld>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button className="btn" type="button" onClick={() => setRepaymentOpen(false)} disabled={repaymentSaving}>Cancel</button>
              <button className="btn btn-pri" type="submit" disabled={repaymentSaving}>{repaymentSaving ? 'Recording…' : 'Record repayment'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>
      <div className={mono ? 't-mono' : undefined} style={{ marginTop: 3, fontSize: 13.5 }}>{value}</div>
    </div>
  )
}
