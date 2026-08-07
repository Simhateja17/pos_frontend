'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { useIdleTimer } from '@/lib/hooks/useIdleTimer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Staff = {
  id: string
  name: string
  role: 'owner' | 'manager' | 'cashier'
  isActive: boolean
  pinConfigured?: boolean
}

type Terminal = {
  id: string
  name: string
  isActive: boolean
  hasOpenShift: boolean
  cashMode?: 'cash' | 'none'
  isCurrentDevice?: boolean
}

const DIGIT_GRID = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'] as const

const GENERIC_LOAD_ERROR = "Couldn't load team members. Check your connection and try again."

export default function PinPadPage() {
  const router = useRouter()
  const [staff, setStaff] = useState<Staff[]>([])
  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [currentTerminal, setCurrentTerminal] = useState<Terminal | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoadingStaff, setIsLoadingStaff] = useState(true)
  const [isPairing, setIsPairing] = useState(false)
  const [pairError, setPairError] = useState<string | null>(null)

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mustChangePin, setMustChangePin] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [changeError, setChangeError] = useState<string | null>(null)
  const [isChangingPin, setIsChangingPin] = useState(false)

  const loadStaff = useCallback(async () => {
    setIsLoadingStaff(true)
    setLoadError(null)

    const headers = await authHeaders()
    const [staffResult, deviceResult, terminalsResult] = await Promise.all([
      apiClient.GET('/members', { headers }),
      apiClient.GET('/terminals/device', { headers }),
      apiClient.GET('/terminals', { headers }),
    ])

    setIsLoadingStaff(false)

    if (staffResult.error || !staffResult.data || deviceResult.error || terminalsResult.error || !terminalsResult.data) {
      setLoadError(GENERIC_LOAD_ERROR)
      return
    }

    setStaff(staffResult.data.filter((member) => member.isActive && member.pinConfigured !== false))
    setCurrentTerminal(deviceResult.data?.terminal ?? null)
    setTerminals(terminalsResult.data.filter((terminal) => terminal.isActive))
  }, [])

  useEffect(() => {
    const operatorToken = sessionStorage.getItem('operatorToken')
    if (operatorToken) {
      void authHeaders().then((headers) => apiClient.POST('/terminal/pin/logout', {
        headers: { ...(headers ?? {}), 'X-Operator-Token': operatorToken },
      }))
    }
    sessionStorage.removeItem('operatorToken')
    void loadStaff()
  }, [loadStaff])

  // D-11 auto-timeout: after a period of inactivity, re-lock the terminal to
  // the staff-picker step and clear the current operator token.
  const resetToStaffPicker = useCallback(() => {
    const operatorToken = sessionStorage.getItem('operatorToken')
    void authHeaders().then((headers) => apiClient.POST('/terminal/pin/logout', {
      headers: operatorToken ? { ...(headers ?? {}), 'X-Operator-Token': operatorToken } : headers,
    }))
    sessionStorage.removeItem('operatorToken')
    setSelectedStaffId(null)
    setPin('')
    setPinError(null)
    setMustChangePin(false)
  }, [])

  useIdleTimer(resetToStaffPicker)

  function selectStaff(id: string) {
    setSelectedStaffId(id)
    setPin('')
    setPinError(null)
  }

  async function pairTerminal(terminalId: string) {
    setIsPairing(true)
    setPairError(null)
    const result = await apiClient.POST('/terminals/{terminalId}/pair', {
      params: { path: { terminalId } },
      headers: await authHeaders(),
    })
    setIsPairing(false)
    if (result.error || !result.data) {
      setPairError((result.error as { error?: string } | undefined)?.error ?? 'This device could not be paired.')
      return
    }
    setCurrentTerminal(result.data)
  }

  async function submitPin(nextPin: string) {
    if (!selectedStaffId) return
    setIsSubmitting(true)
    setPinError(null)

    const headers = await authHeaders()
    const { data, error } = await apiClient.POST('/terminal/pin/switch', {
      body: { staffId: selectedStaffId, pin: nextPin, sessionType: 'register' },
      headers,
    })

    setIsSubmitting(false)

    if (error || !data) {
      // The 401 body's `error` field is UI-SPEC-exact copy from the backend
      // (01-06) — read verbatim, no frontend string duplication. The backend
      // returns exactly one of these two UI-SPEC-exact strings:
      //   "Incorrect PIN — try again."
      //   "Too many attempts. Ask a manager to unlock this terminal."
      const message =
        (error as { error?: string } | undefined)?.error ?? 'Incorrect PIN — try again.'
      setPinError(message)
      setPin('')
      return
    }

    // Never persist the operator token in localStorage — sessionStorage keeps
    // it scoped to this terminal tab only, cleared on idle-timeout/logout.
    sessionStorage.setItem('operatorToken', data.operatorToken)

    if (data.staff.mustChangePin) {
      setMustChangePin(true)
      setNewPin('')
      setConfirmPin('')
      return
    }

    router.push('/app/shifts')
  }

  async function changeOperatorPin() {
    if (newPin.length !== 4 || newPin !== confirmPin) {
      setChangeError('Enter the same four-digit PIN twice.')
      return
    }
    setIsChangingPin(true)
    setChangeError(null)
    const result = await apiClient.POST('/terminal/pin/change', {
      body: { pin: newPin },
      headers: await authHeaders(),
    })
    setIsChangingPin(false)
    if (result.error) {
      setChangeError((result.error as { error?: string }).error ?? 'We could not change your PIN.')
      return
    }
    router.push('/app/shifts')
  }

  function handleDigitPress(key: string) {
    if (isSubmitting) return

    if (key === 'backspace') {
      setPin((current) => current.slice(0, -1))
      return
    }
    if (key === '') return

    const nextPin = (pin + key).slice(0, 4)
    setPin(nextPin)

    if (nextPin.length === 4) {
      submitPin(nextPin)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: '#FFFDF7' }}
    >
      <Card className="w-full max-w-[400px]" style={{ backgroundColor: '#FFFFFF' }}>
        <CardHeader>
          <h1
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: 1.5,
              color: '#64748B',
            }}
          >
            {mustChangePin
              ? 'Choose your personal PIN'
              : selectedStaffId
                ? `Enter your PIN · ${currentTerminal?.name ?? 'Counter'}`
                : currentTerminal
                  ? `Who's ringing this up? · ${currentTerminal.name}`
                  : 'Assign this device to a counter'}
          </h1>
        </CardHeader>
        <CardContent>
          {loadError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{loadError}</AlertDescription>
              <Button
                type="button"
                onClick={loadStaff}
                className="mt-2"
                style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
              >
                Retry
              </Button>
            </Alert>
          )}

          {!loadError && isLoadingStaff && (
            <p className="text-sm" style={{ color: '#64748B' }}>
              Loading staff…
            </p>
          )}

          {!loadError && !isLoadingStaff && !currentTerminal && (
            <div className="flex flex-col gap-3">
              <p className="text-sm" style={{ color: '#64748B' }}>
                This browser is not assigned to a counter yet. An owner or manager can choose which counter this device represents.
              </p>
              {pairError && <p className="text-sm" style={{ color: '#DC2626' }}>{pairError}</p>}
              {terminals.length === 0 && (
                <p className="text-sm" style={{ color: '#64748B' }}>No active counters are set up yet. Create one in Counter settings.</p>
              )}
              {terminals.map((terminal) => (
                <button
                  key={terminal.id}
                  type="button"
                  disabled={isPairing}
                  onClick={() => void pairTerminal(terminal.id)}
                  className="min-h-[48px] rounded-md border px-4 text-left"
                  style={{ borderColor: '#E2E8F0', fontFamily: 'Inter, sans-serif', fontSize: '16px' }}
                >
                  <span style={{ display: 'block', fontWeight: 600 }}>{isPairing ? 'Pairing…' : terminal.name}</span>
                  <span style={{ display: 'block', marginTop: 3, color: '#64748B', fontSize: 12 }}>
                    {terminal.cashMode === 'none' ? 'No cash drawer' : 'Cash drawer'}
                    {terminal.hasOpenShift ? ' · Existing shift can be resumed' : ''}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!loadError && !isLoadingStaff && currentTerminal && !selectedStaffId && !mustChangePin && (
            <div className="flex flex-col gap-2">
              {staff.length === 0 && (
                <p className="text-sm" style={{ color: '#64748B' }}>
                  No active staff found for this terminal.
                </p>
              )}
              {staff.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => selectStaff(member.id)}
                  className="min-h-[44px] rounded-md border px-4 text-left"
                  style={{
                    borderColor: '#E2E8F0',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    fontWeight: 400,
                  }}
                >
                  {member.name}
                </button>
              ))}
            </div>
          )}

          {!loadError && !isLoadingStaff && currentTerminal && selectedStaffId && !mustChangePin && (
            <div className="flex flex-col items-center gap-4">
              {/* PIN progress dots — visual feedback only, never renders the digits themselves */}
              <div className="flex gap-2" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="inline-block h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: i < pin.length ? '#0058BA' : '#E2E8F0',
                    }}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {DIGIT_GRID.map((key, i) => {
                  if (key === '') {
                    return <span key={`blank-${i}`} className="min-h-[44px] min-w-[44px]" />
                  }
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleDigitPress(key)}
                      className="min-h-[44px] min-w-[44px] rounded-md border"
                      style={{
                        borderColor: '#E2E8F0',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '20px',
                        fontWeight: 700,
                      }}
                    >
                      {key === 'backspace' ? '⌫' : key}
                    </button>
                  )
                })}
              </div>

              {pinError && (
                <p
                  className="text-sm"
                  style={{
                    color: '#DC2626',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {pinError}
                </p>
              )}

              <button
                type="button"
                onClick={resetToStaffPicker}
                className="text-sm"
                style={{ color: '#0058BA' }}
              >
                Not you? Switch staff
              </button>
            </div>
          )}

          {!loadError && !isLoadingStaff && mustChangePin && (
            <div className="flex flex-col gap-3">
              <p className="text-sm" style={{ color: '#64748B' }}>
                This was a temporary PIN. Choose a personal four-digit PIN that only you know.
              </p>
              {changeError && <p className="text-sm" style={{ color: '#DC2626' }}>{changeError}</p>}
              <input
                aria-label="New personal PIN"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                type="password"
                value={newPin}
                onChange={(event) => setNewPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="New four-digit PIN"
                className="min-h-[44px] rounded-md border px-3"
              />
              <input
                aria-label="Confirm personal PIN"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                type="password"
                value={confirmPin}
                onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Repeat PIN"
                className="min-h-[44px] rounded-md border px-3"
              />
              <button
                type="button"
                disabled={isChangingPin || newPin.length !== 4 || confirmPin.length !== 4}
                onClick={() => void changeOperatorPin()}
                className="min-h-[44px] rounded-md px-4"
                style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
              >
                {isChangingPin ? 'Saving PIN…' : 'Save personal PIN'}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
