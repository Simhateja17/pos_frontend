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
import { Badge, Card, CardHead, DataTable, Fld, KpiRow, Modal, PageHead, Tabs } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState, UnavailableValue } from '@/components/couture/states'

type FilterTab = 'all' | 'active' | 'inactive'

const FILTERS: readonly { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

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
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null)
  const [filter, setFilter] = useState<FilterTab>('all')
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
      setError(cause instanceof Error ? cause.message : 'Supplier records are unavailable right now.')
    } finally {
      setLoading(false)
    }
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
      setFormError('Supplier name is required.')
      return
    }
    if (!Number.isInteger(leadTimeDays) || leadTimeDays < 1) {
      setFormError('Lead time must be a whole number of days, at least 1.')
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
      setFormError(cause instanceof Error ? cause.message : 'That supplier could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(supplier: Supplier) {
    try {
      await updateAuthenticatedSupplier(supplier.id, { isActive: !supplier.isActive })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That supplier could not be updated.')
    }
  }

  const visible = (suppliers ?? []).filter((s) =>
    filter === 'all' ? true : filter === 'active' ? s.isActive : !s.isActive,
  )

  const activeCount = (suppliers ?? []).filter((s) => s.isActive).length
  // Average lead time is computed over ACTIVE suppliers only — an inactive
  // vendor's lead time should not shift a number the owner reads as "how long
  // my restocks take".
  const activeLeadTimes = (suppliers ?? []).filter((s) => s.isActive).map((s) => s.leadTimeDays)
  const avgLeadTime =
    activeLeadTimes.length > 0
      ? (activeLeadTimes.reduce((sum, d) => sum + d, 0) / activeLeadTimes.length).toFixed(1)
      : null

  return (
    <>
      <PageHead
        title="Suppliers"
        sub="Vendor directory, lead times and terms"
        actions={
          <button className="btn btn-pri" onClick={openCreate}>
            <Plus size={15} /> Add supplier
          </button>
        }
      />

      <KpiRow
        cols={3}
        items={[
          {
            label: 'Active suppliers',
            value: suppliers ? String(activeCount) : '-',
            meta: suppliers ? `${suppliers.length} total on file` : 'Loading…',
          },
          {
            label: 'Average lead time',
            value: avgLeadTime ? `${avgLeadTime} days` : <UnavailableValue reason="No active suppliers on file yet" />,
            meta: avgLeadTime ? 'across active suppliers' : 'Add a supplier to see this',
          },
          {
            // Payables need purchase-order billing, which this build does not
            // persist. Saying so beats showing a zero that reads as "nothing owed".
            label: 'Outstanding payables',
            value: <UnavailableValue reason="Supplier billing is not recorded in this build" />,
            meta: 'Needs supplier billing',
          },
        ]}
      />

      <Card>
        <CardHead
          title="Vendor directory"
          sub={suppliers ? `${visible.length} shown` : 'Loading…'}
          right={<Tabs items={FILTERS} active={filter} onSelect={setFilter} ariaLabel="Filter suppliers" />}
        />

        {loading && <LoadingState label="Loading suppliers" />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && visible.length === 0 && (
          <EmptyState
            icon={<Truck size={24} strokeWidth={1.8} />}
            title={filter === 'all' ? 'No suppliers yet' : 'No suppliers match this filter'}
            body="Add the vendors you buy stock from. Their lead time feeds the reorder suggestions on the Inventory screen."
            action={
              filter === 'all' ? (
                <button className="btn btn-pri" onClick={openCreate}>
                  <Plus size={15} /> Add supplier
                </button>
              ) : undefined
            }
          />
        )}

        {!loading && !error && visible.length > 0 && (
          <DataTable
            cols={['Supplier', 'Contact', 'Lead time', 'Terms', 'Status', '']}
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
                    onClick={() => router.push(`/app/suppliers/${supplier.id}`)}
                  >
                    {supplier.name}
                  </button>
                </td>
                <td className="t-sub">
                  {supplier.contactName ?? '-'}
                  {supplier.phone ? <div className="t-mono t-sub">{supplier.phone}</div> : null}
                </td>
                <td className="num">{supplier.leadTimeDays} days</td>
                <td className="t-sub">{supplier.paymentTerms ?? '-'}</td>
                <td>
                  <Badge tone={supplier.isActive ? 'green' : 'grey'}>{supplier.isActive ? 'Active' : 'Inactive'}</Badge>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm" onClick={() => router.push(`/app/suppliers/${supplier.id}`)}>
                      View
                    </button>
                    <button className="btn btn-sm" onClick={() => openEdit(supplier)}>
                      Edit
                    </button>
                    <button className="btn btn-sm" onClick={() => void toggleActive(supplier)}>
                      {supplier.isActive ? 'Deactivate' : 'Reactivate'}
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
          title={editing ? `Edit ${editing.name}` : 'Add supplier'}
          onClose={() => setFormOpen(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setFormOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-pri" type="submit" form="supplier-form" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add supplier'}
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

            <Fld id="sup-name" label="Supplier name">
              <input
                id="sup-name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Fabindia Mills"
              />
            </Fld>

            <Fld id="sup-lead" label="Lead time (days)">
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
              How many days this supplier takes to deliver after you place an order. Reorder suggestions multiply your
              sales rate by this number, so a wrong lead time gives you a wrong order quantity.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Fld id="sup-contact" label="Contact name">
                <input id="sup-contact" value={form.contactName} onChange={(e) => setField('contactName', e.target.value)} />
              </Fld>
              <Fld id="sup-phone" label="Phone">
                <input id="sup-phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
              </Fld>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Fld id="sup-email" label="Email">
                <input id="sup-email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
              </Fld>
              <Fld id="sup-terms" label="Payment terms">
                <input
                  id="sup-terms"
                  value={form.paymentTerms}
                  onChange={(e) => setField('paymentTerms', e.target.value)}
                  placeholder="e.g. Net 30"
                />
              </Fld>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
