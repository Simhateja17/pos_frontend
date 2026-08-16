'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Banknote, ChevronRight, LockKeyhole, LogOut, Monitor, Settings, Users } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { supabase } from '@/lib/supabase/client'
import { useIdleTimer } from '@/lib/hooks/useIdleTimer'
import { AmbelMark } from '@/components/brand/ambel-mark'
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

type ManagementIntent =
  | { type: 'manage' }
  | { type: 'pair'; terminalId: string; terminalName: string }

function safeReturnTo(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  return value
}

const DIGIT_GRID = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'] as const
const ROLE_LABEL: Record<Staff['role'], string> = { owner: 'Owner', manager: 'Manager', cashier: 'Cashier' }
const ROLE_BADGE_CLASS: Record<Staff['role'], string> = {
  owner: 'bg-[#FFF5D6] text-[#8A6410]',
  manager: 'bg-[#EAF2FF] text-[#0058BA]',
  cashier: 'bg-[#F1F5F9] text-[#475569]',
}

const GENERIC_LOAD_ERROR = "Couldn't load team members. Check your connection and try again."

export default function PinPadPage() {
  const router = useRouter()
  const [returnTo, setReturnTo] = useState<string | null>(null)
  useEffect(() => {
    setReturnTo(safeReturnTo(new URLSearchParams(window.location.search).get('returnTo')))
  }, [])
  const [staff, setStaff] = useState<Staff[]>([])
  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [currentTerminal, setCurrentTerminal] = useState<Terminal | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoadingStaff, setIsLoadingStaff] = useState(true)
  const [pairingTerminalId, setPairingTerminalId] = useState<string | null>(null)
  const [pairError, setPairError] = useState<string | null>(null)
  const [managementIntent, setManagementIntent] = useState<ManagementIntent | null>(null)

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mustChangePin, setMustChangePin] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [changeError, setChangeError] = useState<string | null>(null)
  const [isChangingPin, setIsChangingPin] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // Escape hatch for a device stuck here — e.g. team members failed to load,
  // or this browser is signed into the wrong organisation. Without this, the
  // only way out is closing the tab, which leaves the org session live.
  async function signOut() {
    setSigningOut(true)
    try {
      await apiClient.POST('/terminal/pin/logout', { headers: await authHeaders() })
    } catch {
      // The organisation sign-out below is still the safe fallback if the
      // cashier-session request cannot reach the server.
    }
    sessionStorage.removeItem('operatorToken')
    sessionStorage.removeItem('registerLocked')
    await supabase.auth.signOut()
    router.replace('/login')
  }

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

    if ([staffResult, deviceResult, terminalsResult].some((result) => result.response.status === 401)) {
      sessionStorage.removeItem('operatorToken')
      await supabase.auth.signOut({ scope: 'local' })
      router.replace('/login')
      return
    }

    if (staffResult.error || !staffResult.data || deviceResult.error || terminalsResult.error || !terminalsResult.data) {
      setLoadError(GENERIC_LOAD_ERROR)
      return
    }

    setStaff(staffResult.data.filter((member) => member.isActive))
    setCurrentTerminal(deviceResult.data?.terminal ?? null)
    setTerminals(terminalsResult.data.filter((terminal) => terminal.isActive))
  }, [router])

  useEffect(() => {
    sessionStorage.setItem('registerLocked', 'true')
    let cancelled = false
    void (async () => {
      const headers = await authHeaders()
      await apiClient.POST('/terminal/pin/lock', { headers })
      sessionStorage.removeItem('operatorToken')
      if (!cancelled) await loadStaff()
    })()
    return () => {
      cancelled = true
    }
  }, [loadStaff])

  // D-11 auto-timeout: after a period of inactivity, re-lock the terminal to
  // the staff-picker step and clear the current operator token.
  const resetToStaffPicker = useCallback(() => {
    sessionStorage.setItem('registerLocked', 'true')
    void authHeaders().then((headers) => apiClient.POST('/terminal/pin/lock', { headers }))
    sessionStorage.removeItem('operatorToken')
    setManagementIntent(null)
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

  function chooseAnotherStaff() {
    setSelectedStaffId(null)
    setPin('')
    setPinError(null)
  }

  function requestManagement(intent: ManagementIntent) {
    setManagementIntent(intent)
    setSelectedStaffId(null)
    setPin('')
    setPinError(null)
    setPairError(null)
  }

  async function pairTerminal(terminalId: string): Promise<boolean> {
    setPairingTerminalId(terminalId)
    setPairError(null)
    const result = await apiClient.POST('/terminals/{terminalId}/pair', {
      params: { path: { terminalId } },
      headers: await authHeaders(),
    })
    setPairingTerminalId(null)
    if (result.error || !result.data) {
      setPairError((result.error as { error?: string } | undefined)?.error ?? 'This device could not be paired.')
      return false
    }
    setCurrentTerminal(result.data)
    return true
  }

  async function continueAfterPinAuthentication() {
    if (managementIntent?.type === 'manage') {
      router.replace(returnTo || '/app/settings/terminals')
      return
    }

    if (managementIntent?.type === 'pair') {
      const paired = await pairTerminal(managementIntent.terminalId)
      sessionStorage.removeItem('operatorToken')
      setManagementIntent(null)
      setSelectedStaffId(null)
      setPin('')
      if (paired) {
        if (returnTo) router.replace(returnTo)
        else await loadStaff()
      }
      return
    }

    // A management flow can arrive here after pairing a browser from guided
    // setup. Preserve that return path only after a successful PIN switch;
    // ordinary register entry still opens the shift screen.
    router.replace(returnTo || '/app/shifts')
  }

  async function submitPin(nextPin: string) {
    if (!selectedStaffId) return
    setIsSubmitting(true)
    setPinError(null)

    const headers = await authHeaders()
    const { data, error } = await apiClient.POST('/terminal/pin/switch', {
      body: {
        staffId: selectedStaffId,
        pin: nextPin,
        sessionType: managementIntent ? 'management' : 'register',
      },
      headers,
    })

    setIsSubmitting(false)

    if (error || !data) {
      // The 401 body's `error` field is UI-SPEC-exact copy from the backend
      // (01-06): read verbatim, no frontend string duplication. The backend
      // returns exactly one of these two UI-SPEC-exact strings:
      //   "Incorrect PIN. Try again."
      //   "Too many attempts. Ask a manager to unlock this terminal."
      const message =
        (error as { error?: string } | undefined)?.error ?? 'Incorrect PIN. Try again.'
      setPinError(message)
      setPin('')
      return
    }

    // Never persist the operator token in localStorage: sessionStorage keeps
    // it scoped to this terminal tab only, cleared on idle-timeout/logout.
    sessionStorage.setItem('operatorToken', data.operatorToken)

    if (data.staff.mustChangePin) {
      setMustChangePin(true)
      setNewPin('')
      setConfirmPin('')
      return
    }

    await continueAfterPinAuthentication()
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
    await continueAfterPinAuthentication()
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

  useEffect(() => {
    if (!selectedStaffId || mustChangePin) return

    function handleKeyboardInput(event: KeyboardEvent) {
      if (isSubmitting) return

      // `event.key` is a digit for both the number row and the numeric keypad
      // in browsers. Keep the code fallback for keyboards that expose the
      // keypad through `event.code` only.
      const digit = /^[0-9]$/.test(event.key)
        ? event.key
        : /^Numpad[0-9]$/.test(event.code)
          ? event.code.slice(-1)
          : null

      if (digit) {
        event.preventDefault()
        handleDigitPress(digit)
        return
      }

      if (event.key === 'Backspace') {
        event.preventDefault()
        handleDigitPress('backspace')
        return
      }

      // Four digits submit automatically, but Enter also gives keyboard users
      // an explicit submit path if they have edited the value with Backspace.
      if (event.key === 'Enter' && pin.length === 4) {
        event.preventDefault()
        void submitPin(pin)
      }
    }

    window.addEventListener('keydown', handleKeyboardInput)
    return () => window.removeEventListener('keydown', handleKeyboardInput)
  }, [handleDigitPress, isSubmitting, mustChangePin, pin, selectedStaffId, submitPin])

  const pinReadyStaff = staff.filter((member) => member.pinConfigured !== false)
  const managementStaff = pinReadyStaff.filter((member) => member.role === 'owner' || member.role === 'manager')
  const visibleStaff = managementIntent ? managementStaff : pinReadyStaff
  const selectedStaff = visibleStaff.find((member) => member.id === selectedStaffId) ?? null

  return (
    <div className="min-h-screen bg-[#FFFDF7] px-4 py-5 sm:px-8 sm:py-7">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-5xl flex-col sm:min-h-[calc(100vh-3.5rem)]">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE6F2] bg-white shadow-sm">
              <AmbelMark size={28} title="Ambel POS" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#172033]">Ambel POS</p>
              <p className="text-xs text-[#64748B]">Secure register access</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => requestManagement({ type: 'manage' })}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-3 text-sm font-medium text-[#334155] shadow-sm transition hover:border-[#B8C8DC] hover:bg-[#F8FAFC]"
            >
              <Settings className="h-4 w-4" /> Manage counters
            </button>
            <button
              type="button"
              disabled={signingOut}
              onClick={() => void signOut()}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-3 text-sm font-medium text-[#334155] shadow-sm transition hover:border-[#B8C8DC] hover:bg-[#F8FAFC] disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" /> {signingOut ? 'Logging out…' : 'Log out'}
            </button>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-8 sm:py-12">
          <Card className="w-full max-w-[560px] overflow-hidden border-[#DDE5EF] bg-white shadow-[0_18px_55px_rgba(28,45,72,0.10)]">
            <CardHeader className="border-b border-[#E8EDF3] bg-[#FBFCFE] px-5 py-5 sm:px-7">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#0058BA]">
                  {managementIntent ? <LockKeyhole className="h-5 w-5" /> : currentTerminal ? <LockKeyhole className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#0058BA]">
                    {managementIntent ? 'Owner approval' : currentTerminal ? currentTerminal.name : 'Device setup'}
                  </p>
                  <h1 className="text-xl font-semibold leading-tight text-[#172033] sm:text-2xl">
                    {mustChangePin
                      ? 'Choose your personal PIN'
                      : selectedStaff
                        ? `Welcome, ${selectedStaff.name}`
                        : managementIntent
                          ? 'Owner or manager PIN required'
                        : currentTerminal
                          ? 'Who is using this register?'
                          : 'Assign this device to a counter'}
                  </h1>
                  <p className="mt-1.5 text-sm leading-6 text-[#64748B]">
                    {mustChangePin
                      ? 'Replace the temporary PIN with four digits only you know.'
                      : selectedStaff
                        ? managementIntent?.type === 'pair'
                          ? `Enter your PIN to assign this browser to ${managementIntent.terminalName}.`
                          : managementIntent?.type === 'manage'
                            ? 'Enter your PIN to open counter settings.'
                            : `Enter your four-digit PIN to operate ${currentTerminal?.name ?? 'this counter'}.`
                        : managementIntent
                          ? 'Choose an owner or manager. Cashier PINs cannot change device or counter settings.'
                        : currentTerminal
                          ? 'Choose your own staff profile. Roles control permissions; the PIN records who is operating this counter.'
                          : 'A counter belongs to this browser. Staff can then take turns using it with their own PINs.'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 py-5 sm:px-7 sm:py-6">
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
            <div className="flex items-center gap-3 rounded-xl border border-[#E5EAF1] bg-[#F8FAFC] p-4 text-sm text-[#64748B]">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#C8D4E3] border-t-[#0058BA]" />
              Loading counter and staff…
            </div>
          )}

          {!loadError && !isLoadingStaff && managementIntent && !selectedStaffId && !mustChangePin && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-[#D9E5F3] bg-[#F7FAFF] px-4 py-3 text-sm leading-6 text-[#475569]">
                {managementIntent.type === 'pair'
                  ? `Confirm who is assigning this browser to ${managementIntent.terminalName}.`
                  : 'Confirm who is opening counter settings.'}
              </div>

              {managementStaff.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#C9D7E8] bg-[#F8FBFF] px-5 py-7 text-center">
                  <h2 className="text-base font-semibold text-[#172033]">No owner or manager PIN is ready</h2>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-[#64748B]">
                    Set up an owner or manager PIN before changing counter settings.
                  </p>
                  <Button asChild className="mt-5 h-11 bg-[#0058BA] px-5 text-white hover:bg-[#004A9D]">
                    <Link href="/terminal/setup-pin">Set up a PIN</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {managementStaff.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => selectStaff(member.id)}
                      className="group flex min-h-[82px] items-center gap-3 rounded-xl border border-[#DCE4EE] bg-white px-4 py-3 text-left transition hover:border-[#8CB5EA] hover:bg-[#F7FAFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0058BA] focus-visible:ring-offset-2"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-sm font-bold text-[#0058BA]">
                        {member.name.trim().slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[#172033]">{member.name}</span>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_BADGE_CLASS[member.role]}`}>
                          {ROLE_LABEL[member.role]}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-[#94A3B8] group-hover:text-[#0058BA]" />
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setManagementIntent(null)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-[#0058BA] hover:bg-[#F1F6FD]"
              >
                <ArrowLeft className="h-4 w-4" /> Back to register
              </button>
            </div>
          )}

          {!loadError && !isLoadingStaff && !currentTerminal && !managementIntent && (
            <div className="flex flex-col gap-4">
              {pairError && (
                <div role="alert" className="rounded-xl border border-[#F4C7C7] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
                  {pairError}
                </div>
              )}
              {pinReadyStaff.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#C9D7E8] bg-[#F8FBFF] px-5 py-7 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0058BA] shadow-sm">
                    <Users className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-[#172033]">Set up a staff PIN first</h2>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-[#64748B]">
                    At least one active staff PIN is required before this browser can be paired to a counter.
                  </p>
                  <Button asChild className="mt-5 h-11 bg-[#0058BA] px-5 text-white hover:bg-[#004A9D]">
                    <Link href="/terminal/setup-pin">Set up the first PIN</Link>
                  </Button>
                </div>
              ) : terminals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#C9D7E8] bg-[#F8FBFF] px-5 py-7 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0058BA] shadow-sm">
                    <Monitor className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-[#172033]">Create your first counter</h2>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-[#64748B]">
                    Name the counter and choose whether it has a cash drawer. You will return here to assign this browser.
                  </p>
                  <Button
                    type="button"
                    onClick={() => requestManagement({ type: 'manage' })}
                    className="mt-5 h-11 bg-[#0058BA] px-5 text-white hover:bg-[#004A9D]"
                  >
                    Continue with owner PIN
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-[#334155]">Which counter does this browser represent?</p>
                  <div className="grid gap-3">
                    {terminals.map((terminal) => {
                      const isThisPairing = pairingTerminalId === terminal.id
                      return (
                        <button
                          key={terminal.id}
                          type="button"
                          disabled={pairingTerminalId !== null}
                          onClick={() => requestManagement({
                            type: 'pair',
                            terminalId: terminal.id,
                            terminalName: terminal.name,
                          })}
                          className="group flex min-h-[76px] items-center gap-4 rounded-xl border border-[#DCE4EE] bg-white px-4 py-3 text-left transition hover:border-[#8CB5EA] hover:bg-[#F7FAFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0058BA] focus-visible:ring-offset-2 disabled:opacity-60"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF5FF] text-[#0058BA]">
                            {terminal.cashMode === 'none' ? <Monitor className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-base font-semibold text-[#172033]">
                              {isThisPairing ? 'Assigning device…' : terminal.name}
                            </span>
                            <span className="mt-0.5 block text-sm text-[#64748B]">
                              {terminal.cashMode === 'none' ? 'No cash drawer' : 'Cash drawer'}
                              {terminal.hasOpenShift ? ' · Open shift will continue' : ' · Ready to start'}
                            </span>
                          </span>
                          <ChevronRight className="h-5 w-5 text-[#94A3B8] transition group-hover:translate-x-0.5 group-hover:text-[#0058BA]" />
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {!loadError && !isLoadingStaff && currentTerminal && !managementIntent && !selectedStaffId && !mustChangePin && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E3E9F1] bg-[#F8FAFC] px-4 py-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#94A3B8]">This device</p>
                  <p className="mt-0.5 text-sm font-semibold text-[#172033]">{currentTerminal.name}</p>
                </div>
                <span className="text-xs text-[#64748B]">Owner or manager PIN required to change it</span>
              </div>

              {pinReadyStaff.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#C9D7E8] bg-[#F8FBFF] px-5 py-7 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0058BA] shadow-sm">
                    <Users className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-[#172033]">No counter PINs are set</h2>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-[#64748B]">
                    {staff.length > 0
                      ? `${staff.length} active staff ${staff.length === 1 ? 'profile exists' : 'profiles exist'}, but none has a counter PIN yet.`
                      : 'Add a cashier or manager, then give them a counter PIN.'}
                  </p>
                  <Button asChild className="mt-5 h-11 bg-[#0058BA] px-5 text-white hover:bg-[#004A9D]">
                    <Link href="/terminal/setup-pin">Set up the first PIN</Link>
                  </Button>
                  <p className="mt-3 text-xs leading-5 text-[#64748B]">Roles decide permissions. A PIN decides who is operating this counter.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {pinReadyStaff.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => selectStaff(member.id)}
                      className="group flex min-h-[82px] items-center gap-3 rounded-xl border border-[#DCE4EE] bg-white px-4 py-3 text-left transition hover:border-[#8CB5EA] hover:bg-[#F7FAFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0058BA] focus-visible:ring-offset-2"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-sm font-bold text-[#0058BA]">
                        {member.name.trim().slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[#172033]">{member.name}</span>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_BADGE_CLASS[member.role]}`}>
                          {ROLE_LABEL[member.role]}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-[#94A3B8] group-hover:text-[#0058BA]" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loadError && !isLoadingStaff && selectedStaffId && !mustChangePin && (
            <div className="flex flex-col items-center gap-5">
              {/* PIN progress dots: visual feedback only, never renders the digits themselves */}
              <div className="flex gap-3 py-1" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="inline-block h-3.5 w-3.5 rounded-full transition-colors"
                    style={{
                      backgroundColor: i < pin.length ? '#0058BA' : '#E2E8F0',
                    }}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {DIGIT_GRID.map((key, i) => {
                  if (key === '') {
                    return <span key={`blank-${i}`} className="h-14 w-16 sm:w-20" />
                  }
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleDigitPress(key)}
                      className="h-14 w-16 rounded-xl border bg-white transition hover:border-[#8CB5EA] hover:bg-[#F7FAFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0058BA] focus-visible:ring-offset-2 sm:w-20"
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
                onClick={chooseAnotherStaff}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-[#0058BA] hover:bg-[#F1F6FD]"
              >
                <ArrowLeft className="h-4 w-4" /> Choose another staff member
              </button>
            </div>
          )}

          {!loadError && !isLoadingStaff && mustChangePin && (
            <div className="flex flex-col gap-4">
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
                className="min-h-12 rounded-xl border border-[#DCE4EE] px-4 outline-none focus:border-[#0058BA] focus:ring-2 focus:ring-[#D6E7FB]"
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
                className="min-h-12 rounded-xl border border-[#DCE4EE] px-4 outline-none focus:border-[#0058BA] focus:ring-2 focus:ring-[#D6E7FB]"
              />
              <button
                type="button"
                disabled={isChangingPin || newPin.length !== 4 || confirmPin.length !== 4}
                onClick={() => void changeOperatorPin()}
                className="min-h-12 rounded-xl px-4 font-medium disabled:opacity-50"
                style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
              >
                {isChangingPin ? 'Saving PIN…' : 'Save personal PIN'}
              </button>
            </div>
          )}
          {!isLoadingStaff && !mustChangePin && (
            <div className="mt-6 border-t border-[#E8EDF3] pt-4 text-center">
              <Link href="/terminal/forgot-owner-pin" className="text-sm font-medium text-[#0058BA] hover:underline">
                Forgot an owner PIN? Reset it by email
              </Link>
            </div>
          )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
