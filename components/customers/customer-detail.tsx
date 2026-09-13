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
import { enumLabel, useT } from '@/lib/i18n/i18n'

function displayAddress(customer: Customer): string {
  return [customer.addressLine1, customer.addressLine2, customer.city, customer.stateCode, customer.postalCode]
    .filter(Boolean)
    .join(', ')
}

function titleFor(t: ReturnType<typeof useT>, customer: Customer): string {
  return customer.billingName ?? customer.name ?? t('records.customers.unnamed')
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
  const { money, region, appPath, dateLocale } = useAppRegion()
  const t = useT()
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
      setError(cause instanceof Error ? cause.message : t('customers.errors.profileLoad'))
    } finally {
      setLoading(false)
    }
    // t is intentionally omitted: changing locale must not refetch the profile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId])

  const loadPurchases = useCallback(
    async (nextCursor?: string) => {
      setHistoryLoading(true)
      setHistoryError(null)
      try {
        setPurchases(await getCustomerPurchases(customerId, nextCursor))
        setCursor(nextCursor)
      } catch (cause) {
        setHistoryError(cause instanceof Error ? cause.message : t('customers.errors.historyLoad'))
      } finally {
        setHistoryLoading(false)
      }
    },
    [customerId], // eslint-disable-line react-hooks/exhaustive-deps -- locale changes must not refetch history
  )

  const loadCredit = useCallback(async () => {
    setCreditLoading(true)
    setCreditError(null)
    try {
      setCredit(await getCustomerCredit(customerId))
    } catch (cause) {
      setCreditError(cause instanceof Error ? cause.message : t('customers.errors.creditLoad'))
    } finally {
      setCreditLoading(false)
    }
    // t is intentionally omitted: changing locale must not refetch credit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setFormError(cause instanceof Error ? cause.message : t('customers.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  async function collectRepayment(event: FormEvent) {
    event.preventDefault()
    setRepaymentError(null)
    const amount = Number(repaymentAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setRepaymentError(t('customers.errors.repaymentAmount'))
      return
    }
    if (credit && amount > Number(credit.balance)) {
      setRepaymentError(t('customers.errors.repaymentLimit', { amount: money(Number(credit.balance)) }))
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
      setRepaymentError(cause instanceof Error ? cause.message : t('customers.errors.repaymentSave'))
    } finally {
      setRepaymentSaving(false)
    }
  }

  if (loading) return <LoadingState label={t('customers.detail.loading')} />
  if (error || !customer) return <ErrorState message={error ?? t('customers.detail.unavailable')} onRetry={() => void loadCustomer()} />

  const address = displayAddress(customer)
  const visiblePurchases = (purchases?.items ?? []).filter((purchase) => matchesPurchase(purchase, historySearch))
  const dateTime = new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })

  return (
    <>
      <PageHead
        title={titleFor(t, customer)}
        sub={showIndiaCredit ? t('customers.detail.persistedSub') : t('customers.detail.persistedSubInternational')}
        actions={
          <>
            <Link className="btn" href={appPath('/app/customers')}><ArrowLeft size={15} /> {t('customers.detail.customers')}</Link>
              <button className="btn btn-pri" onClick={() => { setFormError(null); setEditOpen(true) }}><Edit3 size={15} /> {t('customers.detail.editProfile')}</button>
          </>
        }
      />

      <div className="split-2">
        <Card>
          <CardHead title={t('customers.detail.identity')} sub={t('customers.detail.identitySub')} />
          <div style={{ display: 'grid', gap: 13, padding: 18 }}>
            <Info label={t('customers.detail.billingName')} value={titleFor(t, customer)} />
            <Info label={t('customers.detail.phone')} value={customer.phone ?? t('customers.detail.notProvided')} mono />
            <Info label={t('customers.detail.email')} value={customer.email ?? t('customers.detail.notProvided')} />
            <Info label={t('customers.detail.profileUpdated')} value={new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(customer.updatedAt))} />
            {customer.notes ? <Info label={t('customers.detail.notes')} value={customer.notes} /> : null}
          </div>
        </Card>

        <Card>
          <CardHead title={t('customers.detail.billing')} sub={t('customers.detail.billingSub')} />
          <div style={{ display: 'grid', gap: 13, padding: 18 }}>
            <Info label={t('customers.detail.gstin')} value={customer.gstin ?? t('customers.detail.notProvided')} mono />
            <Info label={t('customers.detail.address')} value={address || t('customers.detail.noBillingAddress')} />
            <Info label={t('customers.detail.country')} value={customer.country} />
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              {showIndiaCredit
                ? t('customers.detail.indiaBillingHelp')
                : t('customers.detail.internationalBillingHelp')}
            </div>
          </div>
        </Card>
      </div>

      {showIndiaCredit && (
        <Card>
          <CardHead
            title={t('customers.detail.khata')}
            sub={t('customers.detail.khataSub')}
            right={credit && Number(credit.balance) > 0 ? (
              <button
                className="btn btn-pri"
                type="button"
                onClick={() => { setRepaymentError(null); setRepaymentOpen(true) }}
              >
                <HandCoins size={15} /> {t('customers.detail.collectPayment')}
              </button>
            ) : null}
          />
          {creditLoading && <LoadingState label={t('customers.detail.loadingKhata')} rows={2} />}
          {!creditLoading && creditError && <ErrorState message={creditError} onRetry={() => void loadCredit()} />}
          {!creditLoading && !creditError && credit && (
            <>
              <div style={{ display: 'flex', alignItems: 'end', gap: 28, flexWrap: 'wrap', padding: '18px 18px 14px' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{t('customers.detail.outstanding')}</div>
                  <div className="num" style={{ marginTop: 4, fontSize: 28, fontWeight: 700, color: Number(credit.balance) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {money(Number(credit.balance))}
                  </div>
                </div>
                <Info label={t('customers.detail.creditLimit')} value={credit.creditLimit ? money(Number(credit.creditLimit)) : t('customers.detail.noLimit')} mono />
                <div style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 390, lineHeight: 1.5 }}>
                  {t('customers.detail.khataHelp')}
                </div>
              </div>
              {credit.transactions.length === 0 ? (
                <EmptyState title={t('customers.detail.noKhata')} body={t('customers.detail.noKhataBody')} />
              ) : (
                <DataTable cols={[t('customers.detail.entry'), t('customers.detail.date'), t('customers.detail.store'), t('customers.detail.amount'), t('customers.detail.note')]} minWidth={760}>
                  {credit.transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <div className="t-strong">{transaction.type === 'credit_sale' ? t('customers.detail.creditSale') : t('customers.detail.repayment')}</div>
                        {transaction.saleId ? <Link className="t-sub t-mono" href={appPath(`/app/orders/${encodeURIComponent(transaction.saleId)}`)}>{t('customers.detail.openBill')}</Link> : null}
                      </td>
                      <td className="t-sub">{dateTime.format(new Date(transaction.createdAt))}</td>
                      <td className="t-sub">{transaction.storeName ?? t('customers.detail.storeUnavailable')}</td>
                      <td className={`t-mono t-strong ${transaction.type === 'repayment' ? 'text-success' : 'text-danger'}`}>
                        {transaction.type === 'repayment' ? t('customers.detail.minus') : t('customers.detail.plus')}{money(Number(transaction.amount))}
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
          title={t('customers.detail.purchaseHistory')}
          sub={purchases ? `${purchases.total} ${purchases.total === 1 ? t('customers.detail.purchaseHistoryCountOne') : t('customers.detail.purchaseHistoryCountMany')}` : t('customers.detail.loadingHistory')}
          right={
            <SearchField
              value={historySearch}
              onChange={setHistorySearch}
              placeholder={t('customers.detail.searchPlaceholder')}
              ariaLabel={t('customers.detail.searchLabel')}
              width={240}
            />
          }
        />
        {historyLoading && <LoadingState label={t('customers.detail.loadingHistory')} />}
        {!historyLoading && historyError && <ErrorState message={historyError} onRetry={() => void loadPurchases(cursor)} />}
        {!historyLoading && !historyError && purchases?.items.length === 0 && (
          <EmptyState title={t('customers.detail.noPurchases')} body={t('customers.detail.noPurchasesBody')} />
        )}
        {!historyLoading && !historyError && purchases && purchases.items.length > 0 && visiblePurchases.length === 0 && (
          <EmptyState
            title={t('customers.detail.noPurchaseMatch')}
            body={t('customers.detail.noPurchaseMatchBody')}
          />
        )}
        {!historyLoading && !historyError && purchases && visiblePurchases.length > 0 && (
          <DataTable cols={[t('customers.detail.document'), t('customers.detail.date'), t('customers.detail.store'), t('customers.detail.total'), t('customers.detail.payment'), t('customers.detail.status'), t('customers.detail.actions')]} minWidth={980}>
            {visiblePurchases.map((purchase) => (
              <tr key={purchase.id}>
                <td>
                  <div className="t-strong">{purchase.documentNumber ?? t('customers.detail.billFallback', { number: purchase.id.slice(0, 8).toUpperCase() })}</div>
                  <div className="t-mono t-sub" style={{ fontSize: 11 }}>{purchase.id}</div>
                </td>
                <td className="t-sub">{dateTime.format(new Date(purchase.date))}</td>
                <td className="t-sub">{purchase.store?.name ?? t('customers.detail.storeUnavailable')}</td>
                <td className="t-mono t-strong">{money(Number(purchase.total))}</td>
                <td className="t-sub">{purchase.paymentMethods.length ? purchase.paymentMethods.map((method) => enumLabel(t, 'method', method)).join(' + ') : t('customers.detail.notRecorded')}</td>
                <td><Badge tone={purchase.status === 'completed' ? 'green' : 'grey'}>{enumLabel(t, 'status', purchase.status)}</Badge></td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Link className="btn btn-sm" href={appPath(`/app/orders/${encodeURIComponent(purchase.id)}`)}><ExternalLink size={13} /> {t('customers.detail.openBill')}</Link>
                    <Link className="btn btn-sm" href={appPath(`/app/returns?saleId=${encodeURIComponent(purchase.id)}`)}>{t('customers.detail.billReturn')}</Link>
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
        <Modal title={t('customers.detail.editTitle', { name: titleFor(t, customer) })} onClose={() => !saving && setEditOpen(false)}>
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
        <Modal title={t('customers.detail.collectTitle', { name: titleFor(t, customer) })} onClose={() => !repaymentSaving && setRepaymentOpen(false)}>
          <form onSubmit={collectRepayment}>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
              {t('customers.detail.outstandingBalance', { amount: money(Number(credit.balance)) })}
            </p>
            {repaymentError && <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>{repaymentError}</div>}
            <Fld id="customer-repayment-amount" label={t('customers.detail.amountReceived')}>
              <input
                id="customer-repayment-amount"
                type="number"
                min={0.01}
                max={Number(credit.balance)}
                step="0.01"
                inputMode="decimal"
                value={repaymentAmount}
                onChange={(event) => setRepaymentAmount(event.target.value)}
                placeholder={t('customers.detail.amountPlaceholder')}
                autoFocus
              />
            </Fld>
            <Fld id="customer-repayment-note" label={t('customers.detail.repaymentNote')}>
              <textarea id="customer-repayment-note" rows={3} value={repaymentNote} onChange={(event) => setRepaymentNote(event.target.value)} placeholder={t('customers.detail.repaymentNotePlaceholder')} />
            </Fld>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button className="btn" type="button" onClick={() => setRepaymentOpen(false)} disabled={repaymentSaving}>{t('common.cancel')}</button>
              <button className="btn btn-pri" type="submit" disabled={repaymentSaving}>{repaymentSaving ? t('customers.detail.recording') : t('customers.detail.recordRepayment')}</button>
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
