'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Truck } from 'lucide-react'
import {
  type Supplier,
  createAuthenticatedSupplier,
  getAuthenticatedSuppliers,
  updateAuthenticatedSupplier,
} from '@/lib/api/authenticated-client'
import { Badge, Card, CardHead, DataTable, Fld, KpiRow, Modal, PageHead, SearchField, Tabs } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState, UnavailableValue } from '@/components/couture/states'
import { useT, enumLabel } from '@/lib/i18n/i18n'
import { useAppRegion } from '@/lib/app-region'

type FilterTab = 'all' | 'active' | 'inactive'

const EMPTY_FORM = {
  name: '',
  contactName: '',
  email: '',
  phone: '',
  leadTimeDays: '7',
  paymentTerms: '',
}

type FormState = typeof EMPTY_FORM

export function SuppliersView() {
  const router = useRouter()
  const t = useT()
  const { appPath } = useAppRegion()
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSuppliers(await getAuthenticatedSuppliers())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('records.errors.suppliersLoad'))
    } finally {
      setLoading(false)
    }
    // t is intentionally omitted: changing locale must not refetch suppliers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier)
    setForm({
      name: supplier.name,
      contactName: supplier.contactName ?? '',
      email: supplier.email ?? '',
      phone: supplier.phone ?? '',
      leadTimeDays: String(supplier.leadTimeDays),
      paymentTerms: supplier.paymentTerms ?? '',
    })
    setFormError(null)
    setFormOpen(true)
  }

  function setField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const leadTimeDays = Number(form.leadTimeDays)
    if (!form.name.trim()) {
      setFormError(t('records.errors.supplierName'))
      return
    }
    if (!Number.isInteger(leadTimeDays) || leadTimeDays < 1) {
      setFormError(t('inventory.detail.leadTimeError'))
      return
    }

    const body = {
      name: form.name.trim(),
      contactName: form.contactName.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      leadTimeDays,
      paymentTerms: form.paymentTerms.trim() || undefined,
    }

    setSaving(true)
    try {
      if (editing) await updateAuthenticatedSupplier(editing.id, body)
      else await createAuthenticatedSupplier(body)
      setFormOpen(false)
      await load()
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : t('records.errors.supplierSave'))
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(supplier: Supplier) {
    try {
      await updateAuthenticatedSupplier(supplier.id, { isActive: !supplier.isActive })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('records.errors.supplierUpdate'))
    }
  }

  // Suppliers arrive as one full list, so the search runs client-side over the
  // fields an owner would type from memory: vendor name, contact and phone.
  const term = search.trim().toLowerCase()
  const visible = (suppliers ?? [])
    .filter((s) => (filter === 'all' ? true : filter === 'active' ? s.isActive : !s.isActive))
    .filter((s) =>
      term
        ? [s.name, s.contactName, s.phone, s.email].some((field) =>
            (field ?? '').toLowerCase().includes(term),
          )
        : true,
    )

  const activeCount = (suppliers ?? []).filter((s) => s.isActive).length
  // Average lead time is computed over ACTIVE suppliers only: an inactive
  // vendor's lead time should not shift a number the owner reads as "how long
  // my restocks take".
  const activeLeadTimes = (suppliers ?? []).filter((s) => s.isActive).map((s) => s.leadTimeDays)
  const avgLeadTime =
    activeLeadTimes.length > 0
      ? (activeLeadTimes.reduce((sum, d) => sum + d, 0) / activeLeadTimes.length).toFixed(1)
      : null
  const filterItems: readonly { label: string; value: FilterTab }[] = [
    { label: t('records.suppliers.all'), value: 'all' },
    { label: t('records.suppliers.active'), value: 'active' },
    { label: t('records.suppliers.inactive'), value: 'inactive' },
  ]

  return (
    <>
      <PageHead
        title={t('records.suppliers.title')}
        sub={t('records.suppliers.subtitle')}
        actions={
          <button className="btn btn-pri" onClick={openCreate}>
            <Plus size={15} /> {t('records.suppliers.add')}
          </button>
        }
      />

      <KpiRow
        cols={3}
        items={[
          {
            label: t('records.suppliers.activeSuppliers'),
            value: suppliers ? String(activeCount) : '-',
            meta: suppliers ? t('records.suppliers.totalOnFile', { count: suppliers.length }) : t('records.suppliers.loading'),
          },
          {
            label: t('records.suppliers.averageLead'),
            value: avgLeadTime ? t('records.suppliers.days', { count: avgLeadTime }) : <UnavailableValue reason={t('records.suppliers.noActive')} />,
            meta: avgLeadTime ? t('records.suppliers.acrossActive') : t('records.suppliers.addToSee'),
          },
          {
            // Payables need purchase-order billing, which this build does not
            // persist. Saying so beats showing a zero that reads as "nothing owed".
            label: t('records.suppliers.outstandingPayables'),
            value: <UnavailableValue reason={t('records.suppliers.billingUnavailable')} />,
            meta: t('records.suppliers.needsBilling'),
          },
        ]}
      />

      <Card>
        <CardHead
          title={t('records.suppliers.directory')}
          sub={suppliers ? t('records.suppliers.shown', { count: visible.length }) : t('records.suppliers.loading')}
          right={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder={t('records.suppliers.searchPlaceholder')}
                ariaLabel={t('records.suppliers.searchLabel')}
                width={240}
              />
              <Tabs items={filterItems} active={filter} onSelect={setFilter} ariaLabel={t('records.suppliers.filterLabel')} />
            </div>
          }
        />

        {loading && <LoadingState label={t('records.suppliers.loading')} />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && visible.length === 0 && (
          <EmptyState
            icon={<Truck size={24} strokeWidth={1.8} />}
            title={
              term
                ? t('records.suppliers.noMatchSearch')
                : filter === 'all'
                  ? t('records.suppliers.noSuppliers')
                  : t('records.suppliers.noMatchFilter')
            }
            body={t('records.suppliers.emptyBody')}
            action={
              filter === 'all' && !term ? (
                <button className="btn btn-pri" onClick={openCreate}>
                  <Plus size={15} /> {t('records.suppliers.add')}
                </button>
              ) : undefined
            }
          />
        )}

        {!loading && !error && visible.length > 0 && (
          <DataTable
            cols={[t('records.suppliers.cols.supplier'), t('records.suppliers.cols.contact'), t('records.suppliers.cols.leadTime'), t('records.suppliers.cols.terms'), t('records.suppliers.cols.status'), t('records.suppliers.cols.actions')]}
            minWidth={780}
          >
            {visible.map((supplier) => (
              <tr key={supplier.id}>
                <td className="t-strong">
                  <button
                    style={{
                      font: 'inherit',
                      color: 'inherit',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                    onClick={() => router.push(appPath(`/app/suppliers/${supplier.id}`))}
                  >
                    {supplier.name}
                  </button>
                </td>
                <td className="t-sub">
                  {supplier.contactName ?? '-'}
                  {supplier.phone ? <div className="t-mono t-sub">{supplier.phone}</div> : null}
                </td>
                <td className="num">{supplier.leadTimeDays === 1 ? t('records.suppliers.daysOne') : t('records.suppliers.days', { count: supplier.leadTimeDays })}</td>
                <td className="t-sub">{supplier.paymentTerms ?? '-'}</td>
                <td>
                  <Badge tone={supplier.isActive ? 'green' : 'grey'}>{enumLabel(t, 'status', supplier.isActive ? 'active' : 'inactive')}</Badge>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm" onClick={() => router.push(appPath(`/app/suppliers/${supplier.id}`))}>
                      {t('records.suppliers.view')}
                    </button>
                    <button className="btn btn-sm" onClick={() => openEdit(supplier)}>
                      {t('records.suppliers.edit')}
                    </button>
                    <button className="btn btn-sm" onClick={() => void toggleActive(supplier)}>
                      {supplier.isActive ? t('records.suppliers.deactivate') : t('records.suppliers.reactivate')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      {formOpen && (
        <Modal
          title={editing ? t('records.suppliers.editTitle', { name: editing.name }) : t('records.suppliers.add')}
          onClose={() => setFormOpen(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setFormOpen(false)}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-pri" type="submit" form="supplier-form" disabled={saving}>
                {saving ? t('records.suppliers.saving') : editing ? t('records.suppliers.save') : t('records.suppliers.add')}
              </button>
            </>
          }
        >
          <form id="supplier-form" onSubmit={handleSubmit}>
            {formError && (
              <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                {formError}
              </div>
            )}

            <Fld id="sup-name" label={t('records.suppliers.name')}>
              <input
                id="sup-name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder={t('records.suppliers.namePlaceholder')}
              />
            </Fld>

            <Fld id="sup-lead" label={t('records.suppliers.leadTimeDays')}>
              <input
                id="sup-lead"
                type="number"
                min={1}
                step={1}
                value={form.leadTimeDays}
                onChange={(e) => setField('leadTimeDays', e.target.value)}
              />
            </Fld>
            <div style={{ marginTop: -7, marginBottom: 13, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              {t('records.suppliers.leadTimeHelp')}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Fld id="sup-contact" label={t('records.suppliers.contactName')}>
                <input id="sup-contact" value={form.contactName} onChange={(e) => setField('contactName', e.target.value)} />
              </Fld>
              <Fld id="sup-phone" label={t('records.suppliers.phone')}>
                <input id="sup-phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
              </Fld>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Fld id="sup-email" label={t('records.suppliers.email')}>
                <input id="sup-email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
              </Fld>
              <Fld id="sup-terms" label={t('records.suppliers.paymentTerms')}>
                <input
                  id="sup-terms"
                  value={form.paymentTerms}
                  onChange={(e) => setField('paymentTerms', e.target.value)}
                  placeholder={t('records.suppliers.paymentTermsPlaceholder')}
                />
              </Fld>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
