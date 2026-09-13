'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Monitor, Plus, Store as StoreIcon } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { Badge, Card, CardHead, CardPad, DataTable, Fld, ListRow, Modal, PageHead } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { useAppRegion } from '@/lib/app-region'
import { getActiveStoreId, setActiveStoreId } from '@/lib/store-context'
import { getAuthenticatedStores, type Store } from '@/lib/api/authenticated-client'
import { useT } from '@/lib/i18n/i18n'

type Terminal = {
  id: string
  name: string
  isActive: boolean
  hasOpenShift: boolean
  createdAt: string
  cashMode?: 'cash' | 'none'
  isPaired?: boolean
  isCurrentDevice?: boolean
  deviceLastSeenAt?: string | null
  activeCashierName?: string | null
}

function safeReturnTo(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  return value
}

export function TerminalsView() {
  const { money } = useAppRegion()
  const t = useT()
  const router = useRouter()
  const [returnTo, setReturnTo] = useState<string | null>(null)
  const [terminals, setTerminals] = useState<Terminal[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chooseStoreMode, setChooseStoreMode] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [storePickerError, setStorePickerError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Terminal | null>(null)
  const [name, setName] = useState('')
  const [cashMode, setCashMode] = useState<'cash' | 'none'>('cash')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Counters are a single-store surface, same as Settings: "All stores" has
    // no single till list to show. Check before the request rather than
    // rendering the backend's rejection as a generic load failure.
    if (getActiveStoreId() === 'all') {
      setChooseStoreMode(true)
      try {
        const payload = await getAuthenticatedStores()
        setStores(payload.stores.filter((store) => store.isActive))
        setStorePickerError(null)
      } catch (cause) {
        setStorePickerError(cause instanceof Error ? cause.message : t('settings.errors.storesLoad'))
      }
      setLoading(false)
      return
    }
    setChooseStoreMode(false)

    const { data, error: requestError } = await apiClient.GET('/terminals', { headers: await authHeaders() })
    setLoading(false)
    if (requestError || !data) {
      const serverError = requestError as { code?: string; error?: string } | undefined
      if (serverError?.code === 'choose_store') {
        setChooseStoreMode(true)
        try {
          const payload = await getAuthenticatedStores()
          setStores(payload.stores.filter((store) => store.isActive))
          setStorePickerError(null)
        } catch (cause) {
          setStorePickerError(cause instanceof Error ? cause.message : t('settings.errors.storesLoad'))
        }
        return
      }
      setError(serverError?.error ?? t('settings.terminals.counterUpdate'))
      return
    }
    setTerminals(data as Terminal[])
    // t is intentionally omitted: changing locale must not refetch counters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function chooseStore(storeId: string) {
    setActiveStoreId(storeId)
    setChooseStoreMode(false)
    void load()
  }

  useEffect(() => {
    setReturnTo(safeReturnTo(new URLSearchParams(window.location.search).get('returnTo')))
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setName('')
    setCashMode('cash')
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(terminal: Terminal) {
    setEditing(terminal)
    setName(terminal.name)
    setCashMode(terminal.cashMode ?? 'cash')
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setFormError(t('settings.terminals.nameRequired'))
      return
    }

    setSaving(true)
    setFormError(null)
    const headers = await authHeaders()

    const { error: requestError } = editing
      ? await apiClient.PATCH('/terminals/{terminalId}', {
          params: { path: { terminalId: editing.id } },
          body: { name: name.trim(), cashMode },
          headers,
        })
      : await apiClient.POST('/terminals', { body: { name: name.trim(), cashMode }, headers })

    setSaving(false)

    if (requestError) {
      setFormError((requestError as { error?: string }).error ?? t('settings.terminals.counterSave'))
      return
    }

    setFormOpen(false)
    await load()
  }

  async function setActive(terminal: Terminal, isActive: boolean) {
    setError(null)
    const { error: requestError } = await apiClient.PATCH('/terminals/{terminalId}', {
      params: { path: { terminalId: terminal.id } },
      body: { isActive },
      headers: await authHeaders(),
    })
    if (requestError) {
      // The backend refuses to turn off a counter mid-shift and says why:
      // surface its wording rather than a generic failure.
      setError((requestError as { error?: string }).error ?? t('settings.terminals.counterUpdate'))
      return
    }
    await load()
  }

  async function remove(terminal: Terminal) {
    setError(null)
    const { error: requestError } = await apiClient.DELETE('/terminals/{terminalId}', {
      params: { path: { terminalId: terminal.id } },
      headers: await authHeaders(),
    })
    if (requestError) {
      setError((requestError as { error?: string }).error ?? t('settings.terminals.counterDelete'))
      return
    }
    await load()
  }

  async function pair(terminal: Terminal) {
    setError(null)
    const { error: requestError } = await apiClient.POST('/terminals/{terminalId}/pair', {
      params: { path: { terminalId: terminal.id } },
      headers: await authHeaders(),
    })
    if (requestError) {
      setError((requestError as { error?: string }).error ?? t('settings.terminals.pairError'))
      return
    }
    // The server interrupts any operator session attached to the old or
    // replaced counter. Do not send that now-invalid token on the refresh.
    sessionStorage.removeItem('operatorToken')
    router.push(returnTo ? `/terminal/pin?returnTo=${encodeURIComponent(returnTo)}` : '/terminal/pin')
  }

  if (chooseStoreMode) {
    return (
      <>
        <PageHead title={t('settings.terminals.title')} sub={t('settings.terminals.chooseStore')} />
        <Card>
          <CardHead title={t('settings.terminals.chooseTitle')} sub={t('settings.terminals.chooseSub')} />
          <CardPad>
            {storePickerError ? <ErrorState message={storePickerError} onRetry={() => void load()} /> : null}
            {!storePickerError && stores.length === 0 ? <LoadingState label={t('settings.loadingStores')} /> : null}
            {stores.map((store) => (
              <ListRow
                key={store.id}
                icon={<StoreIcon size={17} strokeWidth={1.85} />}
                title={store.name}
                sub={[store.city, store.state].filter(Boolean).join(' · ') || t('settings.addressNotSet')}
                action={<button className="btn btn-sm btn-pri" onClick={() => chooseStore(store.id)}>{t('settings.terminals.open')}</button>}
              />
            ))}
          </CardPad>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHead
        title={t('settings.terminals.title')}
        sub={t('settings.terminals.subtitle')}
        actions={
          <button className="btn btn-pri" onClick={openCreate}>
            <Plus size={15} /> {t('settings.terminals.add')}
          </button>
        }
      />

      <Card>
        <CardHead
          title={t('settings.terminals.yourCounters')}
          sub={terminals ? t('settings.terminals.active', { count: terminals.filter((t) => t.isActive).length }) : t('settings.terminals.loading')}
        />

        {loading && <LoadingState label={t('settings.terminals.loading')} />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && terminals?.length === 0 && (
          <EmptyState
            icon={<Monitor size={24} strokeWidth={1.8} />}
            title={t('settings.terminals.emptyTitle')}
            body={t('settings.terminals.emptyBody')}
            action={
              <button className="btn btn-pri" onClick={openCreate}>
                <Plus size={15} /> {t('settings.terminals.add')}
              </button>
            }
          />
        )}

        {!loading && !error && terminals && terminals.length > 0 && (
          <DataTable cols={[t('settings.terminals.table.counter'), t('settings.terminals.table.mode'), t('settings.terminals.table.status'), t('settings.terminals.table.actions')]} minWidth={900}>
            {terminals.map((terminal) => (
              <tr key={terminal.id}>
                <td className="t-strong">{terminal.name}</td>
                <td>{terminal.cashMode === 'none' ? t('settings.terminals.noCashDrawer') : t('settings.terminals.cashDrawer')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Badge tone={terminal.isActive ? 'green' : 'grey'}>
                      {terminal.isActive ? t('settings.terminals.activeStatus') : t('settings.terminals.turnedOff')}
                    </Badge>
                    {terminal.hasOpenShift && <Badge tone="amber">{t('settings.terminals.shiftOpen')}</Badge>}
                    {terminal.isCurrentDevice && <Badge tone="blue">{t('settings.terminals.thisDevice')}</Badge>}
                    {!terminal.isCurrentDevice && terminal.isPaired && <Badge tone="amber">{t('settings.terminals.anotherDevice')}</Badge>}
                    {!terminal.isCurrentDevice && !terminal.isPaired && <Badge tone="grey">{t('settings.terminals.noDevice')}</Badge>}
                    {terminal.activeCashierName && <Badge tone="amber">{t('settings.terminals.cashierActive', { name: terminal.activeCashierName })}</Badge>}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm" onClick={() => void pair(terminal)}>
                      {terminal.isCurrentDevice
                        ? t('settings.terminals.reassign')
                        : terminal.isPaired
                          ? t('settings.terminals.replace')
                          : t('settings.terminals.assign')}
                    </button>
                    <button className="btn btn-sm" onClick={() => openEdit(terminal)}>
                      {t('settings.terminals.rename')}
                    </button>
                    <button
                      className="btn btn-sm"
                      disabled={terminal.hasOpenShift}
                      title={terminal.hasOpenShift ? t('settings.terminals.closeShiftFirst') : undefined}
                      onClick={() => void setActive(terminal, !terminal.isActive)}
                    >
                      {terminal.isActive ? t('settings.terminals.turnOff') : t('settings.terminals.turnOn')}
                    </button>
                    <button className="btn btn-sm" onClick={() => void remove(terminal)}>
                      {t('settings.terminals.delete')}
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
          title={editing ? t('settings.terminals.renameTitle', { name: editing.name }) : t('settings.terminals.createTitle')}
          onClose={() => setFormOpen(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setFormOpen(false)}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-pri" type="submit" form="terminal-form" disabled={saving}>
                {saving ? t('settings.terminals.saving') : editing ? t('settings.terminals.save') : t('settings.terminals.add')}
              </button>
            </>
          }
        >
          <form id="terminal-form" onSubmit={handleSubmit}>
            {formError && (
              <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                {formError}
              </div>
            )}
            <Fld id="terminal-name" label={t('settings.terminals.name')}>
              <input
                id="terminal-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('settings.terminals.namePlaceholder')}
              />
            </Fld>
            <Fld id="terminal-mode" label={t('settings.terminals.cashHandling')}>
              <select id="terminal-mode" value={cashMode} onChange={(e) => setCashMode(e.target.value as 'cash' | 'none')}>
                <option value="cash">{t('settings.terminals.cashMode')}</option>
                <option value="none">{t('settings.terminals.noCashMode', { amount: money(0) })}</option>
              </select>
            </Fld>
            <p className="t-sub" style={{ fontSize: 12 }}>
              {t('settings.terminals.help')}
            </p>
          </form>
        </Modal>
      )}
    </>
  )
}
