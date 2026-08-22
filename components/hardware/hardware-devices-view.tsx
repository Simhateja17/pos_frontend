'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Cable, Check, CircleAlert, Download, Printer, ScanBarcode, Usb } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { Badge, Card, CardHead, CardPad, DataTable, PageHead } from '@/components/couture/ui'
import { ErrorState, LoadingState } from '@/components/couture/states'

type Terminal = { id: string; name: string; cashMode?: 'cash' | 'none'; isCurrentDevice?: boolean }
type Companion = { id: string; terminalId: string; machineName: string; os: string; version: string; lastSeenAt: string | null; online: boolean }

const DEVICE_ROWS = [
  ['Barcode scanner', 'USB, Bluetooth or RF keyboard-wedge', 'Browser', 'Ready to test'],
  ['Receipt printer', '58 mm or 80 mm through system print dialog', 'Browser', 'Ready to test'],
  ['Silent receipt printing', 'Windows printer or ESC/POS', 'Companion', 'Companion required'],
  ['Cash drawer', 'Printer-driven ESC/POS drawer kick', 'Companion', 'Companion required'],
  ['Label printer', 'Windows driver, ZPL or TSPL', 'Companion', 'Companion required'],
  ['Weighing scale', 'Supported USB or serial protocol', 'Companion', 'Companion required'],
] as const

export function HardwareDevicesView() {
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
      setError('We couldn’t load the counters for this store.')
      return
    }
    setTerminals(result.data.terminals as Terminal[])
    setCompanions(result.data.companions as Companion[])
    setPairingTerminalId((current) => current || result.data.terminals[0]?.id || '')
  }, [])

  useEffect(() => { void load() }, [load])

  async function testScanner() {
    const scannedValue = scannerValue.trim()
    if (!scannedValue) {
      setScannerStatus({ ok: false, message: 'Scan a known product barcode or SKU first.' })
      return
    }
    const result = await apiClient.POST('/setup/scanner-test', {
      body: { scannedValue },
      headers: await authHeaders(),
    })
    if (result.error || !result.data) {
      setScannerStatus({ ok: false, message: 'Scanner test failed. Check the active store and try again.' })
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
    if (result.error || !result.data) { setActionStatus('Could not create a pairing code.'); return }
    setPairingCode(result.data.pairingCode)
    setActionStatus('Pairing code created. It expires in 10 minutes and works once.')
  }

  async function queueTest(terminalId: string, kind: 'test_print' | 'open_drawer') {
    setActionStatus(null)
    const result = await apiClient.POST('/hardware/jobs', {
      body: { terminalId, kind, payload: kind === 'test_print' ? { text: 'Ambel POS hardware test\nPrinter connected successfully.\n' } : {} },
      headers: await authHeaders(),
    })
    setActionStatus(result.error ? 'The test could not be queued. Confirm that the Companion is paired.' : `${kind === 'test_print' ? 'Print' : 'Drawer'} test queued.`)
  }

  return (
    <>
      <PageHead title="Hardware & Devices" sub="Connect, test and monitor checkout hardware" />

      <Card>
        <CardHead
          title="Connection mode"
          sub="Ambel works without an installation for basic scanning and printing. Advanced hardware needs the Windows Companion."
          right={<Badge tone="blue">Browser mode</Badge>}
        />
        <CardPad>
          <div className="split-2" style={{ '--split-aside': '360px' } as React.CSSProperties}>
            <div>
              <h3 className="t-strong" style={{ margin: 0 }}>Continue in the browser</h3>
              <p className="t-sub">Keyboard-wedge scanners and the standard browser print dialog are supported without installing anything.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge tone="green"><Check size={12} /> Barcode scanning</Badge>
                <Badge tone="green"><Check size={12} /> Print dialog</Badge>
              </div>
            </div>
            <div style={{ border: '1px solid var(--border-soft)', borderRadius: 12, padding: 16, background: '#F8FAFC' }}>
              <h3 className="t-strong" style={{ margin: 0 }}>Ambel Hardware Companion</h3>
              <p className="t-sub">Required for silent printing, drawer control, scales, device monitoring and automatic retry.</p>
              <button className="btn btn-pri" type="button" disabled title="Signing and packaging must be completed before public download">
                <Download size={15} /> Windows installer pending
              </button>
            </div>
          </div>
        </CardPad>
      </Card>

      {error ? <Card><ErrorState message={error} onRetry={() => void load()} /></Card> : null}
      {!error && terminals === null ? <Card><LoadingState label="Loading counter assignment" /></Card> : null}
      {!error && terminals !== null ? (
        <Card>
          <CardHead title="This checkout counter" sub={currentTerminal ? `${currentTerminal.name} is assigned to this browser.` : 'This browser is not assigned to a counter.'} />
          <CardPad>
            {currentTerminal ? (
              <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                <Cable size={18} color="var(--brand-1)" />
                <strong>{currentTerminal.name}</strong>
                <Badge tone="green">Browser paired</Badge>
                <Badge tone={currentTerminal.cashMode === 'none' ? 'grey' : 'blue'}>{currentTerminal.cashMode === 'none' ? 'No cash drawer' : 'Cash counter'}</Badge>
              </div>
            ) : <p className="t-sub">Assign this browser from Settings → Counters before pairing counter-specific hardware.</p>}
          </CardPad>
        </Card>
      ) : null}

      <Card>
        <CardHead title="Windows Companion pairing" sub="Pairing is manager-authorized, counter-specific, single-use and remotely revocable." />
        <CardPad>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={pairingTerminalId} onChange={(event) => setPairingTerminalId(event.target.value)} style={{ minHeight: 40 }}>
              {terminals?.map((terminal) => <option key={terminal.id} value={terminal.id}>{terminal.name}</option>)}
            </select>
            <button className="btn btn-pri" type="button" disabled={!pairingTerminalId} onClick={() => void createPairingCode()}>Generate pairing code</button>
          </div>
          {pairingCode ? <div style={{ marginTop: 12 }}><p className="t-sub">Paste this code into the Companion:</p><code style={{ display: 'block', overflowWrap: 'anywhere', padding: 12, borderRadius: 8, background: '#F1F5F9' }}>{pairingCode}</code></div> : null}
          {actionStatus ? <p role="status" className="t-sub">{actionStatus}</p> : null}
          {companions.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              {companions.map((companion) => (
                <div key={companion.id} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--border-soft)' }}>
                  <strong>{companion.machineName}</strong><Badge tone={companion.online ? 'green' : 'amber'}>{companion.online ? 'Online' : 'Offline'}</Badge><span className="t-sub">{companion.os} · v{companion.version}</span>
                  <button className="btn btn-sm" type="button" onClick={() => void queueTest(companion.terminalId, 'test_print')}>Test print</button>
                  <button className="btn btn-sm" type="button" onClick={() => void queueTest(companion.terminalId, 'open_drawer')}>Test drawer</button>
                </div>
              ))}
            </div>
          ) : <p className="t-sub">No Companion is paired with this store yet.</p>}
        </CardPad>
      </Card>

      <Card>
        <CardHead title="Browser hardware tests" sub="These tests use real browser behavior and do not create a sale." />
        <CardPad>
          <div className="split-2" style={{ '--split-aside': '360px' } as React.CSSProperties}>
            <div>
              <label className="fld">
                <span>Barcode scanner</span>
                <input
                  ref={scannerRef}
                  value={scannerValue}
                  onChange={(event) => setScannerValue(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void testScanner() } }}
                  placeholder="Scan a known SKU or barcode"
                />
              </label>
              <button className="btn btn-pri" type="button" onClick={() => void testScanner()}><ScanBarcode size={15} /> Test scanner</button>
              {scannerStatus ? (
                <p role={scannerStatus.ok ? 'status' : 'alert'} style={{ color: scannerStatus.ok ? 'var(--success)' : 'var(--danger)', fontSize: 13 }}>
                  {scannerStatus.ok ? <Check size={14} style={{ verticalAlign: 'middle' }} /> : <CircleAlert size={14} style={{ verticalAlign: 'middle' }} />} {scannerStatus.message}
                </p>
              ) : null}
            </div>
            <div>
              <p className="t-strong" style={{ marginTop: 0 }}>Receipt printer</p>
              <p className="t-sub">Opens your operating system’s normal print dialog. Choose the installed 58 mm or 80 mm printer.</p>
              <button className="btn" type="button" onClick={testBrowserPrint}><Printer size={15} /> Open print test</button>
            </div>
          </div>
        </CardPad>
      </Card>

      <Card>
        <CardHead title="Supported hardware" sub="Certified model testing will be published separately; generic compatibility depends on the device protocol and driver." />
        <DataTable cols={['Device', 'Connection', 'Mode', 'Status']} minWidth={820}>
          {DEVICE_ROWS.map(([device, connection, mode, status]) => (
            <tr key={device}>
              <td className="t-strong"><Usb size={15} style={{ verticalAlign: 'middle', marginRight: 8 }} />{device}</td>
              <td>{connection}</td>
              <td><Badge tone={mode === 'Browser' ? 'green' : 'blue'}>{mode}</Badge></td>
              <td><Badge tone={status === 'Ready to test' ? 'green' : 'amber'}>{status}</Badge></td>
            </tr>
          ))}
        </DataTable>
      </Card>
    </>
  )
}
