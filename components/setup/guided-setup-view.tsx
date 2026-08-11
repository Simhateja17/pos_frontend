'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, CircleAlert, ScanBarcode, ShieldCheck, Store as StoreIcon, UsersRound } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import type { components } from '@/lib/api/schema'
import { Badge, Card, CardHead, CardPad, ListRow, PageHead } from '@/components/couture/ui'
import { ErrorState, LoadingState } from '@/components/couture/states'
import { getActiveStoreId, setActiveStoreId } from '@/lib/store-context'
import { getAuthenticatedStores, type Store } from '@/lib/api/authenticated-client'

type SetupState = components['schemas']['SetupState']
type SetupStep = components['schemas']['SetupStep']

const GROUPS: { title: string; ids: SetupStep['id'][] }[] = [
  { title: 'Confirm your store', ids: ['store_profile'] },
  { title: 'Prepare your team', ids: ['owner_pin', 'team'] },
  { title: 'Prepare checkout', ids: ['products', 'counter', 'device_pairing', 'scanner'] },
]

function stepTone(status: SetupStep['status']): 'green' | 'amber' | 'grey' | 'red' {
  if (status === 'complete') return 'green'
  if (status === 'blocked') return 'amber'
  if (status === 'unavailable') return 'red'
  return 'grey'
}

export function GuidedSetupView() {
  const [state, setState] = useState<SetupState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [storePickerError, setStorePickerError] = useState<string | null>(null)
  const [savingDecision, setSavingDecision] = useState<string | null>(null)
  const [scannerInput, setScannerInput] = useState('')
  const [scannerMessage, setScannerMessage] = useState<string | null>(null)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const scannerRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (getActiveStoreId() === 'all') {
      try {
        const payload = await getAuthenticatedStores()
        setStores(payload.stores.filter((store) => store.isActive))
        setStorePickerError(null)
      } catch (cause) {
        setStorePickerError(cause instanceof Error ? cause.message : 'We couldn’t load your stores.')
      }
      setLoading(false)
      setError('choose_store')
      return
    }
    const headers = await authHeaders()
    if (!headers) {
      setError('Your session has expired. Sign in again to continue.')
      setLoading(false)
      return
    }
    const result = await apiClient.GET('/setup', { headers })
    setLoading(false)
    if (result.error || !result.data) {
      setError((result.error as { error?: string } | undefined)?.error ?? 'Guided setup is unavailable right now.')
      return
    }
    setState(result.data)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function resolve(decision: 'team_mode' | 'scanner_choice', value: 'staffed' | 'solo_owner' | 'no_scanner' | 'configure_later') {
    setSavingDecision(`${decision}:${value}`)
    const result = await apiClient.POST('/setup/resolve', {
      body: { decision, value } as never,
      headers: await authHeaders(),
    })
    setSavingDecision(null)
    if (result.error || !result.data) {
      setError((result.error as { error?: string } | undefined)?.error ?? 'That setup choice could not be saved.')
      return
    }
    setState(result.data)
  }

  async function testScanner() {
    const value = scannerInput.trim()
    if (!value) {
      setScannerError('Scan or type a product SKU/barcode first.')
      return
    }
    setScannerError(null)
    setScannerMessage(null)
    const result = await apiClient.POST('/setup/scanner-test', {
      body: { scannedValue: value },
      headers: await authHeaders(),
    })
    if (result.error || !result.data) {
      setScannerError((result.error as { error?: string } | undefined)?.error ?? 'The scanner test could not run.')
      return
    }
    setScannerMessage(result.data.message)
    setScannerInput('')
    if (result.data.status === 'verified') await load()
    scannerRef.current?.focus()
  }

  if (loading) {
    return <><PageHead title="Guided setup" sub="Getting your store ready" /><Card><LoadingState label="Loading setup" rows={7} /></Card></>
  }

  if (error || !state) {
    if (error === 'choose_store') {
      return (
        <>
          <PageHead title="Guided setup" sub="Choose a store" />
          <Card>
            <CardHead title="Which store do you want to prepare?" sub="Setup readiness is calculated independently for each store." />
            <CardPad>
              {storePickerError ? <ErrorState message={storePickerError} onRetry={() => void load()} /> : null}
              {!storePickerError && stores.length === 0 ? <LoadingState label="Loading stores" /> : null}
              {stores.map((store) => (
                <ListRow
                  key={store.id}
                  icon={<StoreIcon size={17} strokeWidth={1.85} />}
                  title={store.name}
                  sub={[store.city, store.state].filter(Boolean).join(' · ') || 'Address not set'}
                  action={<button className="btn btn-sm btn-pri" onClick={() => { setActiveStoreId(store.id); void load() }}>Open setup</button>}
                />
              ))}
            </CardPad>
          </Card>
        </>
      )
    }
    return <><PageHead title="Guided setup" sub="Store readiness" /><Card><ErrorState message={error ?? 'Setup is unavailable.'} onRetry={() => void load()} /></Card></>
  }

  const byId = new Map(state.steps.map((step) => [step.id, step]))

  return (
    <>
      <PageHead
        title="Guided setup"
        sub={`${state.store.name} · ${state.completionPercentage}% complete`}
        actions={<Link className="btn btn-sm" href="/app/dashboard">Back to dashboard</Link>}
      />

      <Card>
        <CardHead
          title={state.complete ? 'Your store is ready' : 'Let’s get this store ready'}
          sub={state.complete ? 'Readiness comes from your store records, not browser checkboxes.' : 'Complete the real operational steps below. You can return here at any time.'}
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Badge tone={state.storeReady ? 'green' : 'amber'} dot={state.storeReady ? 'g' : undefined}>{state.storeReady ? 'Billing ready' : 'Billing needs setup'}</Badge>
              {state.storeReady ? <Link className="btn btn-sm btn-pri" href="/app/shifts">Start selling</Link> : null}
            </div>
          }
        />
        <CardPad>
          <div style={{ height: 8, borderRadius: 999, background: '#EEF2F6', overflow: 'hidden' }}>
            <div style={{ width: `${state.completionPercentage}%`, height: '100%', background: 'linear-gradient(90deg,#0058BA,#6C9FFF)', transition: 'width .25s ease' }} />
          </div>
          {state.billingBlockers.length > 0 ? <p className="t-sub" style={{ margin: '10px 0 0' }}>Billing blockers: {state.billingBlockers.join(' · ')}</p> : null}
        </CardPad>
      </Card>

      {GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHead title={group.title} />
          <CardPad style={{ paddingTop: 4 }}>
            {group.ids.map((id) => {
              const current = byId.get(id)
              if (!current) return null
              return <SetupStepRow key={id} step={current} />
            })}
            {group.title === 'Prepare your team' ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 0 4px' }}>
                <button
                  className="btn btn-sm"
                  disabled={savingDecision !== null}
                  onClick={() => void resolve('team_mode', 'solo_owner')}
                >
                  I operate this store alone
                </button>
                <button
                  className="btn btn-sm"
                  disabled={savingDecision !== null}
                  onClick={() => void resolve('team_mode', 'staffed')}
                >
                  We have staff
                </button>
                {state.decisions.teamMode ? <span className="t-sub" style={{ alignSelf: 'center', fontSize: 12 }}>Saved: {state.decisions.teamMode.replace('_', ' ')}</span> : null}
              </div>
            ) : null}
          </CardPad>
        </Card>
      ))}

      <div id="scanner">
      <Card>
        <CardHead title="Barcode scanner" sub="Scanners behave like keyboard-wedge hardware: focus the field, scan, and press Enter. No WebUSB or Bluetooth pairing is required." />
        <CardPad>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              ref={scannerRef}
              aria-label="Scanner test input"
              value={scannerInput}
              onChange={(event) => setScannerInput(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void testScanner() } }}
              placeholder="Scan a known product SKU or barcode"
              style={{ flex: '1 1 260px', minHeight: 40 }}
            />
            <button className="btn btn-pri" onClick={() => void testScanner()}><ScanBarcode size={15} /> Test scan</button>
          </div>
          {scannerMessage ? <p role="status" style={{ color: 'var(--brand-1)', fontSize: 13, margin: '10px 0 0' }}>{scannerMessage}</p> : null}
          {scannerError ? <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, margin: '10px 0 0' }}>{scannerError}</p> : null}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            <button className="btn btn-sm" disabled={savingDecision !== null} onClick={() => void resolve('scanner_choice', 'no_scanner')}>We don’t use a scanner</button>
            <button className="btn btn-sm" disabled={savingDecision !== null} onClick={() => void resolve('scanner_choice', 'configure_later')}>Configure later</button>
          </div>
          {state.decisions.scannerChoice ? <p className="t-sub" style={{ margin: '10px 0 0' }}>Saved choice: {state.decisions.scannerChoice.replaceAll('_', ' ')}</p> : null}
        </CardPad>
      </Card>
      </div>

      <Card>
        <CardHead title="Tour progress" sub="The tour is saved per staff member and per store, so switching shops never loses your place." />
        <CardPad>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {state.tour.status === 'completed' ? <ShieldCheck size={18} color="var(--brand-1)" /> : <UsersRound size={18} color="var(--muted)" />}
            <span style={{ fontSize: 13 }}>Status: <strong>{state.tour.status.replace('_', ' ')}</strong></span>
            <Link className="btn btn-sm btn-ghost" href="/app/dashboard#guided-tour">Replay guided tour</Link>
          </div>
        </CardPad>
      </Card>
    </>
  )
}

function SetupStepRow({ step }: { step: SetupStep }) {
  return (
    <ListRow
      icon={step.complete ? <Check size={17} strokeWidth={2.2} /> : <CircleAlert size={17} />}
      title={step.title}
      sub={step.reason ?? step.description}
      action={step.complete ? <Badge tone="green" dot="g">Done</Badge> : step.actionHref ? <Link className="btn btn-sm btn-ghost" href={step.actionHref}>Open</Link> : <Badge tone={stepTone(step.status)}>{step.status}</Badge>}
    />
  )
}
