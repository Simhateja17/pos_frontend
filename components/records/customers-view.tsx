'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { useAppRegion } from '@/lib/app-region'
import { useT } from '@/lib/i18n/i18n'

export function CustomersView() {
  const { appPath, dateLocale } = useAppRegion()
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [data, setData] = useState<CustomerList | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (searchParams.get('new') === '1') openCreate()
  }, [searchParams])

  const load = useCallback(
    async (nextCursor?: string) => {
      setLoading(true)
      setError(null)
      try {
        setData(await getCustomerRecords(search || undefined, nextCursor))
        setCursor(nextCursor)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : t('records.errors.customersLoad'))
      } finally {
        setLoading(false)
      }
    },
    [search], // eslint-disable-line react-hooks/exhaustive-deps -- locale changes must not refetch records
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
      setFormError(cause instanceof Error ? cause.message : t('records.errors.customerSave'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHead
        title={t('records.customers.title')}
        sub={t('records.customers.subtitle')}
        actions={
          <button className="btn btn-pri" onClick={openCreate}>
            <Plus size={15} /> {t('records.customers.newCustomer')}
          </button>
        }
      />

      <Card>
        <CardHead
          title={t('records.customers.directory')}
          sub={data ? `${data.total} ${data.total === 1 ? t('records.customers.recordsOne') : t('records.customers.recordsMany')}` : t('records.customers.loading')}
          right={
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder={t('records.customers.searchPlaceholder')}
              ariaLabel={t('records.customers.searchLabel')}
              width={240}
            />
          }
        />

        {loading && <LoadingState label={t('records.customers.loading')} />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load(cursor)} />}
        {!loading && !error && data?.items.length === 0 && (
          <EmptyState
            title={search ? t('records.customers.noMatchTitle') : t('records.customers.emptyTitle')}
            body={t('records.customers.emptyBody')}
            action={<button className="btn btn-pri" onClick={openCreate}><Plus size={15} /> {t('records.customers.createCustomer')}</button>}
          />
        )}

        {!loading && !error && data && data.items.length > 0 && (
          <DataTable cols={[t('records.customers.cols.customer'), t('records.customers.cols.phone'), t('records.customers.cols.email'), t('records.customers.cols.gstin'), t('records.customers.cols.created'), t('records.customers.cols.profile')]} minWidth={900}>
            {data.items.map((customer) => (
              <tr
                key={customer.id}
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(appPath(`/app/customers/${customer.id}`))}
              >
                <td className="t-strong">{customer.billingName ?? customer.name ?? t('records.customers.unnamed')}</td>
                <td className="t-mono t-sub">{customer.phone ?? '-'}</td>
                <td className="t-sub">{customer.email ?? '-'}</td>
                <td className="t-mono t-sub">{customer.gstin ?? '-'}</td>
                <td className="t-mono t-sub">{new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date(customer.createdAt))}</td>
                <td>
                  <Link
                    className="btn btn-sm"
                    href={appPath(`/app/customers/${customer.id}`)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('records.customers.viewProfile')}
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
        <Modal title={t('records.customers.newCustomer')} onClose={() => !saving && setFormOpen(false)}>
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
