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
import { enumLabel, useT } from '@/lib/i18n/i18n'
import { useAppRegion } from '@/lib/app-region'

type FilterTab = 'all' | 'active' | 'inactive'

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
 * Stores: the owner's view of every shop in the business (Phase 8).
 *
 * Owner-only by navigation and by server authorization. A manager or cashier
 * belongs to exactly one shop, so this module is not part of their product.
 */
export function StoresView() {
  const router = useRouter()
  const t = useT()
  const { appPath } = useAppRegion()
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
      setError(cause instanceof Error ? cause.message : t('records.errors.storesLoad'))
    } finally {
      setLoading(false)
    }
    // t is intentionally omitted: changing locale must not refetch stores.
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

  function openAllStoresDashboard() {
    setActiveStoreId('all')
    router.push(appPath('/app/dashboard'))
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
      setFormError(t('records.stores.nameInstruction'))
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
      setFormError(cause instanceof Error ? cause.message : t('records.errors.storeSave'))
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(store: Store) {
    try {
      await updateAuthenticatedStore(store.id, { isActive: !store.isActive })
      await load()
    } catch (cause) {
      // The server refuses deactivating the last active store: surface its
      // reason rather than a generic failure, because the owner needs to know
      // it is a rule and not a glitch.
      setError(cause instanceof Error ? cause.message : t('records.errors.storeUpdate'))
    }
  }

  const visible = (stores ?? []).filter((s) =>
    filter === 'all' ? true : filter === 'active' ? s.isActive : !s.isActive,
  )

  const activeCount = (stores ?? []).filter((s) => s.isActive).length
  const allowanceReached = formOpen && !editing && Boolean(allowance && !allowance.canAddStore)
  const allowanceMessage = allowance
    ? allowance.limit === 1
      ? t('records.stores.allowanceOne', { used: allowance.used })
      : t('records.stores.allowanceMany', { limit: allowance.limit, used: allowance.used })
    : null
  const filterItems: readonly { label: string; value: FilterTab }[] = [
    { label: t('records.stores.all'), value: 'all' },
    { label: t('records.stores.active'), value: 'active' },
    { label: t('records.stores.inactive'), value: 'inactive' },
  ]

  return (
    <>
      <PageHead
        title={t('records.stores.title')}
        sub={t('records.stores.subtitle')}
        actions={
          <>
          <button className="btn" onClick={openAllStoresDashboard}>
            {t('records.stores.allStoreDashboard')}
          </button>
          <button
            className="btn btn-pri"
            onClick={openCreate}
            title={allowance && !allowance.canAddStore ? t('records.stores.allowanceFull') : undefined}
          >
            <Plus size={15} /> {t('records.stores.add')}
          </button>
          </>
        }
      />

      <KpiRow
        cols={3}
        items={[
          {
            label: t('records.stores.activeStores'),
            value: stores ? String(activeCount) : 'N/A',
            meta: allowance ? t('records.stores.allowanceSummary', { used: allowance.used, limit: allowance.limit }) : stores ? t('records.stores.totalOnFile', { count: stores.length }) : t('records.stores.loading'),
          },
          {
            // Per-store takings need the dashboard's store scope, which this
            // screen does not request. Showing a blank figure would read as
            // "zero sales" rather than "not asked for".
            label: t('records.stores.todayTakings'),
            value: <UnavailableValue reason={t('records.stores.openStoreSales')} />,
            meta: t('records.stores.perStoreFigures'),
          },
          {
            label: t('records.stores.stockInTransit'),
            value: <UnavailableValue reason={t('records.stores.openStoreTransfers')} />,
            meta: t('records.stores.transferScope'),
          },
        ]}
      />

      <Card>
        <CardHead
          title={t('records.stores.directory')}
          sub={stores ? t('records.stores.shown', { count: visible.length }) : t('records.stores.loading')}
          right={<Tabs items={filterItems} active={filter} onSelect={setFilter} ariaLabel={t('records.stores.filterLabel')} />}
        />

        {loading && <LoadingState label={t('records.stores.loading')} />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && visible.length === 0 && (
          <EmptyState
            icon={<StoreIcon size={24} strokeWidth={1.8} />}
            title={filter === 'all' ? t('records.stores.noStores') : t('records.stores.noMatchFilter')}
            body={t('records.stores.emptyBody')}
            action={
              filter === 'all' ? (
                <button className="btn btn-pri" onClick={openCreate}>
                  <Plus size={15} /> {t('records.stores.add')}
                </button>
              ) : undefined
            }
          />
        )}

        {!loading && !error && visible.length > 0 && (
          <DataTable cols={[t('records.stores.cols.store'), t('records.stores.address'), t('records.stores.cols.status'), t('records.stores.cols.actions')]} minWidth={720}>
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
                    onClick={() => router.push(appPath(`/app/stores/${store.id}`))}
                  >
                    {store.name}
                  </button>
                  {store.isOwnStore ? (
                    <span style={{ marginLeft: 8 }}>
                      <Badge tone="grey">{t('records.stores.yourShop')}</Badge>
                    </span>
                  ) : null}
                </td>
                <td>{addressOf(store) ?? <span style={{ color: 'var(--muted)' }}>{t('records.stores.noAddress')}</span>}</td>
                <td>
                  {store.isActive ? (
                    <Badge tone="green" dot="g">
                      {enumLabel(t, 'status', 'active')}
                    </Badge>
                  ) : (
                    <Badge tone="grey">{enumLabel(t, 'status', 'inactive')}</Badge>
                  )}
                </td>
                <td>
                  <button className="btn btn-sm" onClick={() => openEdit(store)} style={{ marginRight: 8 }}>
                    {t('records.stores.edit')}
                  </button>
                  <button className="btn btn-sm" onClick={() => void toggleActive(store)}>
                    {store.isActive ? t('records.stores.deactivate') : t('records.stores.reactivate')}
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      {formOpen && (
        <Modal
          title={editing ? t('records.stores.editTitle', { name: editing.name }) : t('records.stores.createTitle')}
          onClose={() => setFormOpen(false)}
          footer={
            allowanceReached ? (
              <>
                <button className="btn" type="button" onClick={() => setFormOpen(false)}>
                  {t('common.close')}
                </button>
                <button
                  className="btn btn-pri"
                  type="button"
                  onClick={() => {
                    setFormOpen(false)
                    router.push('/app/billing')
                  }}
                >
                  {t('common.review')}
                </button>
              </>
            ) : (
              <>
                <button className="btn" type="button" onClick={() => setFormOpen(false)} disabled={saving}>
                  {t('common.cancel')}
                </button>
                <button className="btn btn-pri" type="submit" form="store-form" disabled={saving}>
                {saving ? t('records.stores.saving') : editing ? t('records.stores.save') : t('records.stores.add')}
                </button>
              </>
            )
          }
        >
          {allowanceReached ? (
            <div role="status" style={{ display: 'grid', gap: 12, lineHeight: 1.55 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{t('records.stores.allowanceFull')}</p>
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                {allowanceMessage ?? t('records.stores.reviewSubscription')}
              </p>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12.5 }}>
                {t('records.stores.existingSafe')}
              </p>
            </div>
          ) : (
            <form id="store-form" onSubmit={submit}>
              <Fld id="store-name" label={t('records.stores.name')}>
                <input
                  id="store-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('records.stores.namePlaceholder')}
                  autoFocus
                />
              </Fld>
              <Fld id="store-address" label={t('records.stores.address')}>
                <input
                  id="store-address"
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                  placeholder={t('records.stores.addressPlaceholder')}
                />
              </Fld>
              <Fld id="store-city" label={t('records.stores.city')}>
                <input
                  id="store-city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </Fld>
              <Fld id="store-state" label={t('records.stores.state')}>
                <input
                  id="store-state"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </Fld>
              <Fld id="store-postal" label={t('records.stores.pincode')}>
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
                {t('records.stores.sameState')}
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
