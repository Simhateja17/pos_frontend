'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Store as StoreIcon } from 'lucide-react'
import {
  type Store,
  type StoreList,
  createAuthenticatedStore,
  getAuthenticatedStores,
  updateAuthenticatedStore,
} from '@/lib/api/authenticated-client'
import { Badge, Card, CardHead, DataTable, Fld, KpiRow, Modal, PageHead, Tabs } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState, UnavailableValue } from '@/components/couture/states'
import { setActiveStoreId } from '@/lib/store-context'

type FilterTab = 'all' | 'active' | 'inactive'

const FILTERS: readonly { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

const EMPTY_FORM = {
  name: '',
  addressLine1: '',
  city: '',
  state: '',
  postalCode: '',
}

type FormState = typeof EMPTY_FORM

function addressOf(store: Store): string | null {
  const parts = [store.addressLine1, store.city, store.state, store.postalCode].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

/**
 * Stores — the owner's view of every shop in the business (Phase 8).
 *
 * Owner-only by navigation and by server authorization. A manager or cashier
 * belongs to exactly one shop, so this module is not part of their product.
 */
export function StoresView() {
  const router = useRouter()
  const [stores, setStores] = useState<Store[] | null>(null)
  const [allowance, setAllowance] = useState<StoreList['storeAllowance']>(null)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Store | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = await getAuthenticatedStores()
      setStores(payload.stores)
      setAllowance(payload.storeAllowance)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Store records are unavailable right now.')
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

  function openAllStoresDashboard() {
    setActiveStoreId('all')
    router.push('/app/dashboard')
  }

  function openEdit(store: Store) {
    setEditing(store)
    setForm({
      name: store.name,
      addressLine1: store.addressLine1 ?? '',
      city: store.city ?? '',
      state: store.state ?? '',
      postalCode: store.postalCode ?? '',
    })
    setFormError(null)
    setFormOpen(true)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (!form.name.trim()) {
      setFormError('Give the shop a name so staff can tell it apart from your others.')
      return
    }

    const body = {
      name: form.name.trim(),
      addressLine1: form.addressLine1.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      postalCode: form.postalCode.trim() || undefined,
    }

    setSaving(true)
    try {
      if (editing) await updateAuthenticatedStore(editing.id, body)
      else await createAuthenticatedStore(body)
      setFormOpen(false)
      await load()
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'That store could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(store: Store) {
    try {
      await updateAuthenticatedStore(store.id, { isActive: !store.isActive })
      await load()
    } catch (cause) {
      // The server refuses deactivating the last active store — surface its
      // reason rather than a generic failure, because the owner needs to know
      // it is a rule and not a glitch.
      setError(cause instanceof Error ? cause.message : 'That store could not be updated.')
    }
  }

  const visible = (stores ?? []).filter((s) =>
    filter === 'all' ? true : filter === 'active' ? s.isActive : !s.isActive,
  )

  const activeCount = (stores ?? []).filter((s) => s.isActive).length
  const allowanceReached = formOpen && !editing && Boolean(allowance && !allowance.canAddStore)
  const allowanceMessage = allowance
    ? `Your plan covers ${allowance.limit} ${allowance.limit === 1 ? 'store' : 'stores'} and you have ${allowance.used}. Upgrade your plan or add a store to your subscription to open another.`
    : null

  return (
    <>
      <PageHead
        title="Stores"
        sub="Every shop in your business"
        actions={
          <>
          <button className="btn" onClick={openAllStoresDashboard}>
            All-store dashboard
          </button>
          <button
            className="btn btn-pri"
            onClick={openCreate}
            title={allowance && !allowance.canAddStore ? 'Upgrade your plan to add another store' : undefined}
          >
            <Plus size={15} /> Add store
          </button>
          </>
        }
      />

      <KpiRow
        cols={3}
        items={[
          {
            label: 'Active stores',
            value: stores ? String(activeCount) : '—',
            meta: allowance ? `${allowance.used} of ${allowance.limit} plan allowance used` : stores ? `${stores.length} total on file` : 'Loading…',
          },
          {
            // Per-store takings need the dashboard's store scope, which this
            // screen does not request. Showing a blank figure would read as
            // "zero sales" rather than "not asked for".
            label: "Today's takings by store",
            value: <UnavailableValue reason="Open a store to see its sales" />,
            meta: 'Per-store figures live on the dashboard',
          },
          {
            label: 'Stock in transit',
            value: <UnavailableValue reason="Open a store to review transfers" />,
            meta: 'Transfers are tracked per sending and receiving shop',
          },
        ]}
      />

      <Card>
        <CardHead
          title="Your shops"
          sub={stores ? `${visible.length} shown` : 'Loading…'}
          right={<Tabs items={FILTERS} active={filter} onSelect={setFilter} ariaLabel="Filter stores" />}
        />

        {loading && <LoadingState label="Loading stores" />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && visible.length === 0 && (
          <EmptyState
            icon={<StoreIcon size={24} strokeWidth={1.8} />}
            title={filter === 'all' ? 'No stores yet' : 'No stores match this filter'}
            body="Every business has at least one shop. Add another when you open a second outlet — stock, staff and sales are tracked separately for each."
            action={
              filter === 'all' ? (
                <button className="btn btn-pri" onClick={openCreate}>
                  <Plus size={15} /> Add store
                </button>
              ) : undefined
            }
          />
        )}

        {!loading && !error && visible.length > 0 && (
          <DataTable cols={['Store', 'Address', 'Status', '']} minWidth={720}>
            {visible.map((store) => (
              <tr key={store.id}>
                <td className="t-strong">
                  <button
                    style={{
                      font: 'inherit',
                      color: 'inherit',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onClick={() => router.push(`/app/stores/${store.id}`)}
                  >
                    {store.name}
                  </button>
                  {store.isOwnStore ? (
                    <span style={{ marginLeft: 8 }}>
                      <Badge tone="grey">Your shop</Badge>
                    </span>
                  ) : null}
                </td>
                <td>{addressOf(store) ?? <span style={{ color: 'var(--muted)' }}>No address on file</span>}</td>
                <td>
                  {store.isActive ? (
                    <Badge tone="green" dot="g">
                      Active
                    </Badge>
                  ) : (
                    <Badge tone="grey">Inactive</Badge>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-sm" onClick={() => openEdit(store)} style={{ marginRight: 8 }}>
                    Edit
                  </button>
                  <button className="btn btn-sm" onClick={() => void toggleActive(store)}>
                    {store.isActive ? 'Deactivate' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      {formOpen && (
        <Modal
          title={editing ? `Edit ${editing.name}` : 'Add store'}
          onClose={() => setFormOpen(false)}
          footer={
            allowanceReached ? (
              <>
                <button className="btn" type="button" onClick={() => setFormOpen(false)}>
                  Close
                </button>
                <button
                  className="btn btn-pri"
                  type="button"
                  onClick={() => {
                    setFormOpen(false)
                    router.push('/app/billing')
                  }}
                >
                  Review billing
                </button>
              </>
            ) : (
              <>
                <button className="btn" type="button" onClick={() => setFormOpen(false)} disabled={saving}>
                  Cancel
                </button>
                <button className="btn btn-pri" type="submit" form="store-form" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Add store'}
                </button>
              </>
            )
          }
        >
          {allowanceReached ? (
            <div role="status" style={{ display: 'grid', gap: 12, lineHeight: 1.55 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Your store allowance is full.</p>
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                {allowanceMessage ?? 'Review your subscription to add another store.'}
              </p>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12.5 }}>
                Your existing stores are safe. Billing will show the available upgrade or add-on options.
              </p>
            </div>
          ) : (
            <form id="store-form" onSubmit={submit}>
              <Fld id="store-name" label="Store name">
                <input
                  id="store-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Andheri"
                  autoFocus
                />
              </Fld>
              <Fld id="store-address" label="Address">
                <input
                  id="store-address"
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                  placeholder="Shop 4, Link Road"
                />
              </Fld>
              <Fld id="store-city" label="City">
                <input
                  id="store-city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </Fld>
              <Fld id="store-state" label="State">
                <input
                  id="store-state"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </Fld>
              <Fld id="store-postal" label="PIN code">
                <input
                  id="store-postal"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                />
              </Fld>
              {/* Same-state only for V1 (migration 0046): a shop in another state
                  needs its own GST registration and makes an inter-store transfer
                  a taxable supply. Say so rather than letting an owner set one up
                  and discover the gap at filing time. */}
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
                All your shops must be in the same state for now. A shop in another state needs its own GST
                registration, which this build does not handle yet.
              </p>
              {formError ? (
                <div role="alert" style={{ color: 'var(--danger, #b42318)', fontSize: 13, marginTop: 10 }}>
                  {formError}
                </div>
              ) : null}
            </form>
          )}
        </Modal>
      )}
    </>
  )
}
