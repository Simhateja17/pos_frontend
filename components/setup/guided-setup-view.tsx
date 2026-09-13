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
import { MessageKey, useT } from '@/lib/i18n/i18n'
import { useAppRegion } from '@/lib/app-region'

type SetupState = components['schemas']['SetupState']
type SetupStep = components['schemas']['SetupStep']

const GROUPS: { key: 'store' | 'team' | 'checkout'; ids: SetupStep['id'][] }[] = [
  { key: 'store', ids: ['store_profile'] },
  { key: 'team', ids: ['owner_pin', 'team'] },
  { key: 'checkout', ids: ['products', 'counter', 'device_pairing', 'scanner'] },
]

function stepTone(status: SetupStep['status']): 'green' | 'amber' | 'grey' | 'red' {
  if (status === 'complete') return 'green'
  if (status === 'blocked') return 'amber'
  if (status === 'unavailable') return 'red'
  return 'grey'
}

export function GuidedSetupView() {
  const t = useT()
  const { appPath } = useAppRegion()
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
        setStorePickerError(cause instanceof Error ? cause.message : t('settings.errors.storesLoad'))
      }
      setLoading(false)
      setError('choose_store')
      return
    }
    const headers = await authHeaders()
    if (!headers) {
      setError(t('setup.sessionExpired'))
      setLoading(false)
      return
    }
    const result = await apiClient.GET('/setup', { headers })
    setLoading(false)
    if (result.error || !result.data) {
      setError((result.error as { error?: string } | undefined)?.error ?? t('setup.unavailable'))
      return
    }
    setState(result.data)
    // t is intentionally omitted: changing locale must not refetch setup state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError((result.error as { error?: string } | undefined)?.error ?? t('setup.choiceSave'))
      return
    }
    setState(result.data)
  }

  async function testScanner() {
    const value = scannerInput.trim()
    if (!value) {
      setScannerError(t('setup.scannerInputRequired'))
      return
    }
    setScannerError(null)
    setScannerMessage(null)
    const result = await apiClient.POST('/setup/scanner-test', {
      body: { scannedValue: value },
      headers: await authHeaders(),
    })
    if (result.error || !result.data) {
      setScannerError((result.error as { error?: string } | undefined)?.error ?? t('setup.scannerTestError'))
      return
    }
    setScannerMessage(result.data.message)
    setScannerInput('')
    if (result.data.status === 'verified') await load()
    scannerRef.current?.focus()
  }

  if (loading) {
    return <><PageHead title={t('setup.title')} sub={t('setup.gettingReady')} /><Card><LoadingState label={t('setup.loading')} rows={7} /></Card></>
  }

  if (error || !state) {
    if (error === 'choose_store') {
      return (
        <>
          <PageHead title={t('setup.title')} sub={t('setup.chooseStore')} />
          <Card>
            <CardHead title={t('setup.chooseTitle')} sub={t('setup.chooseSub')} />
            <CardPad>
              {storePickerError ? <ErrorState message={storePickerError} onRetry={() => void load()} /> : null}
              {!storePickerError && stores.length === 0 ? <LoadingState label={t('settings.loadingStores')} /> : null}
              {stores.map((store) => (
                <ListRow
                  key={store.id}
                  icon={<StoreIcon size={17} strokeWidth={1.85} />}
                  title={store.name}
                  sub={[store.city, store.state].filter(Boolean).join(' · ') || t('setup.addressNotSet')}
                  action={<button className="btn btn-sm btn-pri" onClick={() => { setActiveStoreId(store.id); void load() }}>{t('setup.open')}</button>}
                />
              ))}
            </CardPad>
          </Card>
        </>
      )
    }
    return <><PageHead title={t('setup.title')} sub={t('setup.readiness')} /><Card><ErrorState message={error ?? t('setup.unavailable')} onRetry={() => void load()} /></Card></>
  }

  const byId = new Map(state.steps.map((step) => [step.id, step]))

  return (
    <>
      <PageHead
        title={t('setup.title')}
        sub={t('setup.complete', { name: state.store.name, percent: state.completionPercentage })}
        actions={<Link className="btn btn-sm" href={appPath('/app/dashboard')}>{t('setup.backDashboard')}</Link>}
      />

      <Card>
        <CardHead
          title={state.complete ? t('setup.storeReady') : t('setup.readyPrompt')}
          sub={state.complete ? t('setup.readySub') : t('setup.incompleteSub')}
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Badge tone={state.storeReady ? 'green' : 'amber'} dot={state.storeReady ? 'g' : undefined}>{state.storeReady ? t('setup.billingReady') : t('setup.billingNeedsSetup')}</Badge>
              {state.storeReady ? <Link className="btn btn-sm btn-pri" href={appPath('/app/shifts')}>{t('setup.startSelling')}</Link> : null}
            </div>
          }
        />
        <CardPad>
          <div style={{ height: 8, borderRadius: 999, background: '#EEF2F6', overflow: 'hidden' }}>
            <div style={{ width: `${state.completionPercentage}%`, height: '100%', background: 'linear-gradient(90deg,#0058BA,#6C9FFF)', transition: 'width .25s ease' }} />
          </div>
          {state.billingBlockers.length > 0 ? <p className="t-sub" style={{ margin: '10px 0 0' }}>{t('setup.billingBlockers', { items: state.steps.filter((step) => step.billingBlocking && !step.complete).map((step) => t(`setup.steps.${step.id}.title` as MessageKey)).join(' · ') })}</p> : null}
        </CardPad>
      </Card>

      {GROUPS.map((group) => (
        <Card key={group.key}>
          <CardHead title={t(`setup.groups.${group.key}` as MessageKey)} />
          <CardPad style={{ paddingTop: 4 }}>
            {group.ids.map((id) => {
              const current = byId.get(id)
              if (!current) return null
              return <SetupStepRow key={id} step={current} t={t} appPath={appPath} />
            })}
            {group.key === 'team' ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 0 4px' }}>
                <button
                  className="btn btn-sm"
                  disabled={savingDecision !== null}
                  onClick={() => void resolve('team_mode', 'solo_owner')}
                >
                  {t('setup.teamSolo')}
                </button>
                <button
                  className="btn btn-sm"
                  disabled={savingDecision !== null}
                  onClick={() => void resolve('team_mode', 'staffed')}
                >
                  {t('setup.teamStaffed')}
                </button>
                {state.decisions.teamMode ? <span className="t-sub" style={{ alignSelf: 'center', fontSize: 12 }}>{t('setup.savedChoice', { choice: state.decisions.teamMode === 'solo_owner' ? t('setup.teamSolo') : t('setup.teamStaffed') })}</span> : null}
              </div>
            ) : null}
          </CardPad>
        </Card>
      ))}

      <div id="scanner">
      <Card>
        <CardHead title={t('setup.scannerTitle')} sub={t('setup.scannerSub')} />
        <CardPad>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              ref={scannerRef}
              aria-label={t('setup.scannerInputLabel')}
              value={scannerInput}
              onChange={(event) => setScannerInput(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void testScanner() } }}
              placeholder={t('setup.scannerPlaceholder')}
              style={{ flex: '1 1 260px', minHeight: 40 }}
            />
            <button className="btn btn-pri" onClick={() => void testScanner()}><ScanBarcode size={15} /> {t('setup.testScan')}</button>
          </div>
          {scannerMessage ? <p role="status" style={{ color: 'var(--brand-1)', fontSize: 13, margin: '10px 0 0' }}>{scannerMessage}</p> : null}
          {scannerError ? <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, margin: '10px 0 0' }}>{scannerError}</p> : null}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            <button className="btn btn-sm" disabled={savingDecision !== null} onClick={() => void resolve('scanner_choice', 'no_scanner')}>{t('setup.noScanner')}</button>
            <button className="btn btn-sm" disabled={savingDecision !== null} onClick={() => void resolve('scanner_choice', 'configure_later')}>{t('setup.configureLater')}</button>
          </div>
          {state.decisions.scannerChoice ? <p className="t-sub" style={{ margin: '10px 0 0' }}>{t('setup.savedChoiceLabel', { choice: state.decisions.scannerChoice === 'no_scanner' ? t('setup.noScanner') : state.decisions.scannerChoice === 'configure_later' ? t('setup.configureLater') : t('setup.status.complete') })}</p> : null}
        </CardPad>
      </Card>
      </div>

      <Card>
        <CardHead title={t('setup.tourTitle')} sub={t('setup.tourSub')} />
        <CardPad>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {state.tour.status === 'completed' ? <ShieldCheck size={18} color="var(--brand-1)" /> : <UsersRound size={18} color="var(--muted)" />}
            <span style={{ fontSize: 13 }}>{t('setup.statusLabel')} <strong>{t(`setup.tourStatus.${state.tour.status}` as MessageKey)}</strong></span>
            <Link className="btn btn-sm btn-ghost" href={appPath('/app/dashboard#guided-tour')}>{t('setup.replayTour')}</Link>
          </div>
        </CardPad>
      </Card>
    </>
  )
}

function SetupStepRow({ step, t, appPath }: { step: SetupStep; t: ReturnType<typeof useT>; appPath: (path: string) => string }) {
  const status = t(`setup.status.${step.status}` as MessageKey)
  const description = t(`setup.steps.${step.id}.description` as MessageKey)
  const reason = step.status === 'blocked' && step.id === 'device_pairing'
    ? t('setup.steps.device_pairing.blockedReason')
    : t(`setup.steps.${step.id}.reason` as MessageKey)
  return (
    <ListRow
      icon={step.complete ? <Check size={17} strokeWidth={2.2} /> : <CircleAlert size={17} />}
      title={t(`setup.steps.${step.id}.title` as MessageKey)}
      sub={step.complete ? description : reason}
      action={step.complete ? <Badge tone="green" dot="g">{status}</Badge> : step.actionHref ? <Link className="btn btn-sm btn-ghost" href={appPath(step.actionHref)}>{t('setup.open')}</Link> : <Badge tone={stepTone(step.status)}>{status}</Badge>}
    />
  )
}
