'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { type CustomerList, getAuthenticatedCustomers } from '@/lib/api/authenticated-client'
import { Card, CardHead, DataTable, PageHead, SearchField } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { Pagination } from './orders-view'

const dateOnly = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' })

export function CustomersView() {
  const [search, setSearch] = useState('')
  const [data, setData] = useState<CustomerList | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (nextCursor?: string) => {
      setLoading(true)
      setError(null)
      try {
        setData(await getAuthenticatedCustomers({ search: search || undefined, cursor: nextCursor, limit: 25 }))
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

  return (
    <>
      <PageHead
        title="Customers"
        sub="Profiles, purchase history and loyalty"
        actions={
          <button className="btn" disabled title="Customer creation is not available on this route">
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
            body="Customers are created during billing. Their profiles appear here once the server records them."
          />
        )}

        {!loading && !error && data && data.items.length > 0 && (
          <DataTable cols={['Customer', 'Phone', 'Email', 'Created', 'Profile']} minWidth={760}>
            {data.items.map((customer) => (
              <tr key={customer.id}>
                <td className="t-strong">{customer.name ?? 'Unnamed customer'}</td>
                <td className="t-mono t-sub">{customer.phone ?? '-'}</td>
                <td className="t-sub">{customer.email ?? '-'}</td>
                <td className="t-mono t-sub">{dateOnly.format(new Date(customer.createdAt))}</td>
                <td className="t-sub">Not available</td>
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
    </>
  )
}
