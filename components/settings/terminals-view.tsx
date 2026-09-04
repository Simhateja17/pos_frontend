'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Monitor, Plus } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { Badge, Card, CardHead, DataTable, Fld, Modal, PageHead } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { useAppRegion } from '@/lib/app-region'

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
  const router = useRouter()
  const [returnTo, setReturnTo] = useState<string | null>(null)
  const [terminals, setTerminals] = useState<Terminal[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Terminal | null>(null)
  const [name, setName] = useState('')
  const [cashMode, setCashMode] = useState<'cash' | 'none'>('cash')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: requestError } = await apiClient.GET('/terminals', { headers: await authHeaders() })
    setLoading(false)
    if (requestError || !data) {
      setError('We couldn’t load your counters. Check your connection and try again.')
      return
    }
    setTerminals(data as Terminal[])
  }, [])

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
      setFormError('Enter a name for this counter.')
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
      setFormError((requestError as { error?: string }).error ?? 'That counter could not be saved.')
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
      setError((requestError as { error?: string }).error ?? 'That counter could not be updated.')
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
      setError((requestError as { error?: string }).error ?? 'That counter could not be deleted.')
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
      setError((requestError as { error?: string }).error ?? 'This device could not be paired.')
      return
    }
    // The server interrupts any operator session attached to the old or
    // replaced counter. Do not send that now-invalid token on the refresh.
    sessionStorage.removeItem('operatorToken')
    router.push(returnTo ? `/terminal/pin?returnTo=${encodeURIComponent(returnTo)}` : '/terminal/pin')
  }

  return (
    <>
      <PageHead
        title="Counters"
        sub="A counter is created first, then assigned to the browser that will operate it."
        actions={
          <button className="btn btn-pri" onClick={openCreate}>
            <Plus size={15} /> Add counter
          </button>
        }
      />

      <Card>
        <CardHead
          title="Your counters"
          sub={terminals ? `${terminals.filter((t) => t.isActive).length} active` : 'Loading…'}
        />

        {loading && <LoadingState label="Loading counters" />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && terminals?.length === 0 && (
          <EmptyState
            icon={<Monitor size={24} strokeWidth={1.8} />}
            title="No counters yet"
            body="Add a counter for each device or till in your store. Pair the browser once; cashiers then only enter their PIN."
            action={
              <button className="btn btn-pri" onClick={openCreate}>
                <Plus size={15} /> Add counter
              </button>
            }
          />
        )}

        {!loading && !error && terminals && terminals.length > 0 && (
          <DataTable cols={['Counter', 'Mode', 'Status', '']} minWidth={900}>
            {terminals.map((terminal) => (
              <tr key={terminal.id}>
                <td className="t-strong">{terminal.name}</td>
                <td>{terminal.cashMode === 'none' ? 'No cash drawer' : 'Cash drawer'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Badge tone={terminal.isActive ? 'green' : 'grey'}>
                      {terminal.isActive ? 'Active' : 'Turned off'}
                    </Badge>
                    {terminal.hasOpenShift && <Badge tone="amber">Shift open</Badge>}
                    {terminal.isCurrentDevice && <Badge tone="blue">This device</Badge>}
                    {!terminal.isCurrentDevice && terminal.isPaired && <Badge tone="amber">Another device</Badge>}
                    {!terminal.isCurrentDevice && !terminal.isPaired && <Badge tone="grey">No device assigned</Badge>}
                    {terminal.activeCashierName && <Badge tone="amber">{terminal.activeCashierName} active</Badge>}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm" onClick={() => void pair(terminal)}>
                      {terminal.isCurrentDevice
                        ? 'Reassign this device'
                        : terminal.isPaired
                          ? 'Replace device'
                          : 'Assign this device'}
                    </button>
                    <button className="btn btn-sm" onClick={() => openEdit(terminal)}>
                      Rename
                    </button>
                    <button
                      className="btn btn-sm"
                      disabled={terminal.hasOpenShift}
                      title={terminal.hasOpenShift ? 'Close the open shift on this counter first' : undefined}
                      onClick={() => void setActive(terminal, !terminal.isActive)}
                    >
                      {terminal.isActive ? 'Turn off' : 'Turn on'}
                    </button>
                    <button className="btn btn-sm" onClick={() => void remove(terminal)}>
                      Delete
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
          title={editing ? `Rename ${editing.name}` : 'Add counter'}
          onClose={() => setFormOpen(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setFormOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-pri" type="submit" form="terminal-form" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add counter'}
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
            <Fld id="terminal-name" label="Counter name">
              <input
                id="terminal-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Counter 1"
              />
            </Fld>
            <Fld id="terminal-mode" label="Cash handling">
              <select id="terminal-mode" value={cashMode} onChange={(e) => setCashMode(e.target.value as 'cash' | 'none')}>
                <option value="cash">Cash counter, count opening cash</option>
                <option value="none">No cash drawer, opening cash is {money(0)}</option>
              </select>
            </Fld>
            <p className="t-sub" style={{ fontSize: 12 }}>
              One device is one logical counter. Only one shift can be open on it at a time, even when cashiers change.
            </p>
          </form>
        </Modal>
      )}
    </>
  )
}
