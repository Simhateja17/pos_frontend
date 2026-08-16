'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardHead, DataTable, Modal, PageHead, SearchField } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { Pagination } from './orders-view'
import {
  createCustomer,
  getCustomerRecords,
  type CustomerList,
  type CustomerWrite,
} from '@/components/customers/api'
import { CustomerForm } from '@/components/customers/customer-form'

const dateOnly = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' })

export function CustomersView() {
  const [search, setSearch] = useState('')
  const [data, setData] = useState<CustomerList | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(
    async (nextCursor?: string) => {
      setLoading(true)
      setError(null)
      try {
        setData(await getCustomerRecords(search || undefined, nextCursor))
        setCursor(nextCursor)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Customer records are unavailable right now.')
      } finally {
        setLoading(false)
      }
    },
    [search],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 300)
    return () => window.clearTimeout(timer)
  }, [load])

  function openCreate() {
    setFormError(null)
    setFormOpen(true)
  }

  async function saveCustomer(body: CustomerWrite) {
    setSaving(true)
    setFormError(null)
    try {
      await createCustomer(body)
      setFormOpen(false)
      await load()
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'That customer could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHead
        title="Customers"
        sub="Profiles, billing identity and purchase history"
        actions={
          <button className="btn btn-pri" onClick={openCreate}>
            <Plus size={15} /> New customer
          </button>
        }
      />

      <Card>
        <CardHead
          title="Customer directory"
          sub={data ? `${data.total} record${data.total === 1 ? '' : 's'}` : 'Loading…'}
          right={
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Search by name, phone or email…"
              ariaLabel="Search customers"
              width={240}
            />
          }
        />

        {loading && <LoadingState label="Loading customers" />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load(cursor)} />}
        {!loading && !error && data?.items.length === 0 && (
          <EmptyState
            title={search ? 'No customers match this search' : 'No customers yet'}
            body="Create a profile when a shopper wants billing details saved. Walk-in checkout can still remain anonymous."
            action={<button className="btn btn-pri" onClick={openCreate}><Plus size={15} /> Create customer</button>}
          />
        )}

        {!loading && !error && data && data.items.length > 0 && (
          <DataTable cols={['Customer', 'Phone', 'Email', 'GSTIN', 'Created', 'Profile']} headerAlign="center" minWidth={900}>
            {data.items.map((customer) => (
              <tr key={customer.id}>
                <td className="t-strong">{customer.billingName ?? customer.name ?? 'Unnamed customer'}</td>
                <td className="t-mono t-sub">{customer.phone ?? '-'}</td>
                <td className="t-sub">{customer.email ?? '-'}</td>
                <td className="t-mono t-sub">{customer.gstin ?? '-'}</td>
                <td className="t-mono t-sub">{dateOnly.format(new Date(customer.createdAt))}</td>
                <td>
                  <Link className="btn btn-sm" href={`/app/customers/${customer.id}`}>
                    View profile
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {data && !loading && !error && (
          <Pagination
            shown={data.items.length}
            total={data.total}
            previous={cursor}
            next={data.nextCursor}
            onPrevious={() => void load(undefined)}
            onNext={() => void load(data.nextCursor ?? undefined)}
          />
        )}
      </Card>

      {formOpen && (
        <Modal title="New customer" onClose={() => !saving && setFormOpen(false)}>
          <CustomerForm
            customer={null}
            onSave={saveCustomer}
            onCancel={() => setFormOpen(false)}
            saving={saving}
            serverError={formError}
          />
        </Modal>
      )}
    </>
  )
}
