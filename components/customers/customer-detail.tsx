'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Edit3, ExternalLink } from 'lucide-react'
import { Badge, Card, CardHead, DataTable, Modal, PageHead, SearchField } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { Pagination } from '@/components/records/orders-view'
import {
  getCustomer,
  getCustomerPurchases,
  updateCustomer,
  type Customer,
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
  const { money } = useAppRegion()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [purchases, setPurchases] = useState<CustomerPurchaseList | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historySearch, setHistorySearch] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

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

  useEffect(() => {
    void loadCustomer()
    void loadPurchases()
  }, [loadCustomer, loadPurchases])

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

  if (loading) return <LoadingState label="Loading customer profile" />
  if (error || !customer) return <ErrorState message={error ?? 'Customer profile unavailable'} onRetry={() => void loadCustomer()} />

  const address = displayAddress(customer)
  const visiblePurchases = (purchases?.items ?? []).filter((purchase) => matchesPurchase(purchase, historySearch))

  return (
    <>
      <PageHead
        title={titleFor(customer)}
        sub="Customer profile and persisted purchase history"
        actions={
          <>
            <Link className="btn" href="/app/customers"><ArrowLeft size={15} /> Customers</Link>
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
              GSTIN and address are stored as customer billing identity. They are not a loyalty balance, credit balance, or receivable.
            </div>
          </div>
        </Card>
      </div>

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
                    <Link className="btn btn-sm" href={`/app/orders?search=${encodeURIComponent(purchase.id)}`}><ExternalLink size={13} /> Open bill</Link>
                    <Link className="btn btn-sm" href={`/app/returns?saleId=${encodeURIComponent(purchase.id)}`}>Bill / return</Link>
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
          />
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
