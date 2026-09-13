'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Cable, Check, CircleAlert, Download, Printer, ScanBarcode, Usb } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { Badge, Card, CardHead, CardPad, DataTable, PageHead } from '@/components/couture/ui'
import { ErrorState, LoadingState } from '@/components/couture/states'
import { MessageKey, useT } from '@/lib/i18n/i18n'

type Terminal = { id: string; name: string; cashMode?: 'cash' | 'none'; isCurrentDevice?: boolean }
type Companion = { id: string; terminalId: string; machineName: string; os: string; version: string; capabilities: Record<string, unknown>; lastSeenAt: string | null; online: boolean }

const DEVICE_ROWS = ['scanner', 'receiptPrinter', 'silentReceipt', 'drawer', 'labelPrinter', 'scale'] as const

export function HardwareDevicesView() {
  const t = useT()
  const [terminals, setTerminals] = useState<Terminal[] | null>(null)
  const [companions, setCompanions] = useState<Companion[]>([])
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [pairingTerminalId, setPairingTerminalId] = useState('')
  const [actionStatus, setActionStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scannerValue, setScannerValue] = useState('')
  const [scannerStatus, setScannerStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const scannerRef = useRef<HTMLInputElement>(null)
  const currentTerminal = terminals?.find((terminal) => terminal.isCurrentDevice)

  const load = useCallback(async () => {
    setError(null)
    const result = await apiClient.GET('/hardware', { headers: await authHeaders() })
    if (result.error || !result.data) {
      setError(t('hardware.countersLoad'))
      return
    }
    setTerminals(result.data.terminals as Terminal[])
    setCompanions(result.data.companions as Companion[])
    setPairingTerminalId((current) => current || result.data.terminals[0]?.id || '')
    // t is intentionally omitted: changing locale must not refetch hardware state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { void load() }, [load])

  async function testScanner() {
    const scannedValue = scannerValue.trim()
    if (!scannedValue) {
      setScannerStatus({ ok: false, message: t('hardware.scannerInput') })
      return
    }
    const result = await apiClient.POST('/setup/scanner-test', {
      body: { scannedValue },
      headers: await authHeaders(),
    })
    if (result.error || !result.data) {
      setScannerStatus({ ok: false, message: t('hardware.scannerFailed') })
      return
    }
    setScannerStatus({ ok: result.data.status === 'verified', message: result.data.message })
    setScannerValue('')
    scannerRef.current?.focus()
  }

  function testBrowserPrint() {
    window.print()
  }

  async function createPairingCode() {
    if (!pairingTerminalId) return
    setActionStatus(null)
    const result = await apiClient.POST('/hardware/pairing-codes', {
      body: { terminalId: pairingTerminalId }, headers: await authHeaders(),
    })
    if (result.error || !result.data) { setActionStatus(t('hardware.pairingError')); return }
    setPairingCode(result.data.pairingCode)
    setActionStatus(t('hardware.pairingCreated'))
  }

  async function queueTest(terminalId: string, kind: 'test_print' | 'open_drawer') {
    setActionStatus(null)
    const result = await apiClient.POST('/hardware/jobs', {
      body: { terminalId, kind, payload: kind === 'test_print' ? { text: 'Ambel POS hardware test\nPrinter connected successfully.\n' } : {} },
      headers: await authHeaders(),
    })
    setActionStatus(result.error ? t('hardware.queueError') : kind === 'test_print' ? t('hardware.queuedPrint') : t('hardware.queuedDrawer'))
  }

  return (
    <>
      <PageHead title={t('hardware.title')} sub={t('hardware.subtitle')} />

      <Card>
        <CardHead
          title={t('hardware.connectionTitle')}
          sub={t('hardware.connectionSub')}
          right={<Badge tone="blue">{t('hardware.browserMode')}</Badge>}
        />
        <CardPad>
          <div className="split-2" style={{ '--split-aside': '360px' } as React.CSSProperties}>
            <div>
              <h3 className="t-strong" style={{ margin: 0 }}>{t('hardware.continueBrowser')}</h3>
              <p className="t-sub">{t('hardware.browserSub')}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge tone="green"><Check size={12} /> {t('hardware.barcodeScanning')}</Badge>
                <Badge tone="green"><Check size={12} /> {t('hardware.printDialog')}</Badge>
              </div>
            </div>
            <div style={{ border: '1px solid var(--border-soft)', borderRadius: 12, padding: 16, background: '#F8FAFC' }}>
              <h3 className="t-strong" style={{ margin: 0 }}>{t('hardware.companionTitle')}</h3>
              <p className="t-sub">{t('hardware.companionSub')}</p>
              <button className="btn btn-pri" type="button" disabled title={t('hardware.downloadTitle')}>
                <Download size={15} /> {t('hardware.downloadPending')}
              </button>
            </div>
          </div>
        </CardPad>
      </Card>

      {error ? <Card><ErrorState message={error} onRetry={() => void load()} /></Card> : null}
      {!error && terminals === null ? <Card><LoadingState label={t('hardware.loadingAssignment')} /></Card> : null}
      {!error && terminals !== null ? (
        <Card>
          <CardHead title={t('hardware.thisCounter')} sub={currentTerminal ? t('hardware.assigned', { name: currentTerminal.name }) : t('hardware.notAssigned')} />
          <CardPad>
            {currentTerminal ? (
              <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                <Cable size={18} color="var(--brand-1)" />
                <strong>{currentTerminal.name}</strong>
                <Badge tone="green">{t('hardware.browserPaired')}</Badge>
                <Badge tone={currentTerminal.cashMode === 'none' ? 'grey' : 'blue'}>{currentTerminal.cashMode === 'none' ? t('hardware.noCashDrawer') : t('hardware.cashCounter')}</Badge>
              </div>
            ) : <p className="t-sub">{t('hardware.assignHint')}</p>}
          </CardPad>
        </Card>
      ) : null}

      <Card>
        <CardHead title={t('hardware.pairingTitle')} sub={t('hardware.pairingSub')} />
        <CardPad>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select aria-label={t('hardware.counterLabel')} value={pairingTerminalId} onChange={(event) => setPairingTerminalId(event.target.value)} style={{ minHeight: 40 }}>
              {terminals?.map((terminal) => <option key={terminal.id} value={terminal.id}>{terminal.name}</option>)}
            </select>
            <button className="btn btn-pri" type="button" disabled={!pairingTerminalId} onClick={() => void createPairingCode()}>{t('hardware.generateCode')}</button>
          </div>
          {pairingCode ? <div style={{ marginTop: 12 }}><p className="t-sub">{t('hardware.pairingCodeHint')}</p><code style={{ display: 'block', overflowWrap: 'anywhere', padding: 12, borderRadius: 8, background: '#F1F5F9' }}>{pairingCode}</code></div> : null}
          {actionStatus ? <p role="status" className="t-sub">{actionStatus}</p> : null}
          {companions.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              {companions.map((companion) => (
                <div key={companion.id} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--border-soft)' }}>
                  <strong>{companion.machineName}</strong><Badge tone={companion.online ? 'green' : 'amber'}>{companion.online ? t('hardware.online') : t('hardware.offline')}</Badge><span className="t-sub">{companion.os} · v{companion.version}</span>
                  <button className="btn btn-sm" type="button" disabled={!companion.online || companion.capabilities.print !== true} onClick={() => void queueTest(companion.terminalId, 'test_print')}>{t('hardware.testPrint')}</button>
                  <button className="btn btn-sm" type="button" disabled title={t('hardware.drawerTitle')} onClick={() => void queueTest(companion.terminalId, 'open_drawer')}>{t('hardware.testDrawer')}</button>
                </div>
              ))}
            </div>
          ) : <p className="t-sub">{t('hardware.noCompanion')}</p>}
        </CardPad>
      </Card>

      <Card>
        <CardHead title={t('hardware.browserTests')} sub={t('hardware.browserTestsSub')} />
        <CardPad>
          <div className="split-2" style={{ '--split-aside': '360px' } as React.CSSProperties}>
            <div>
              <label className="fld">
                <span>{t('hardware.scanner')}</span>
                <input
                  ref={scannerRef}
                  value={scannerValue}
                  onChange={(event) => setScannerValue(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void testScanner() } }}
                  placeholder={t('hardware.scannerPlaceholder')}
                />
              </label>
              <button className="btn btn-pri" type="button" onClick={() => void testScanner()}><ScanBarcode size={15} /> {t('hardware.testScanner')}</button>
              {scannerStatus ? (
                <p role={scannerStatus.ok ? 'status' : 'alert'} style={{ color: scannerStatus.ok ? 'var(--success)' : 'var(--danger)', fontSize: 13 }}>
                  {scannerStatus.ok ? <Check size={14} style={{ verticalAlign: 'middle' }} /> : <CircleAlert size={14} style={{ verticalAlign: 'middle' }} />} {scannerStatus.message}
                </p>
              ) : null}
            </div>
            <div>
              <p className="t-strong" style={{ marginTop: 0 }}>{t('hardware.printer')}</p>
              <p className="t-sub">{t('hardware.printerSub')}</p>
              <button className="btn" type="button" onClick={testBrowserPrint}><Printer size={15} /> {t('hardware.printTest')}</button>
            </div>
          </div>
        </CardPad>
      </Card>

      <Card>
        <CardHead title={t('hardware.supported')} sub={t('hardware.supportedSub')} />
        <DataTable cols={[t('hardware.cols.device'), t('hardware.cols.connection'), t('hardware.cols.mode'), t('hardware.cols.status')]} minWidth={820}>
          {DEVICE_ROWS.map((deviceKey) => {
            const modeIsBrowser = deviceKey === 'scanner' || deviceKey === 'receiptPrinter'
            return (
            <tr key={deviceKey}>
              <td className="t-strong"><Usb size={15} style={{ verticalAlign: 'middle', marginRight: 8 }} />{t(`hardware.device.${deviceKey}.name` as MessageKey)}</td>
              <td>{t(`hardware.device.${deviceKey}.connection` as MessageKey)}</td>
              <td><Badge tone={modeIsBrowser ? 'green' : 'blue'}>{t(`hardware.device.${deviceKey}.mode` as MessageKey)}</Badge></td>
              <td><Badge tone={modeIsBrowser ? 'green' : 'amber'}>{t(`hardware.device.${deviceKey}.status` as MessageKey)}</Badge></td>
            </tr>
            )
          })}
        </DataTable>
      </Card>
    </>
  )
}
