'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { useIdleTimer } from '@/lib/hooks/useIdleTimer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Staff = {
  id: string
  name: string
  role: 'owner' | 'manager' | 'cashier'
  isActive: boolean
}

const DIGIT_GRID = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'] as const

const GENERIC_LOAD_ERROR = "Couldn't load team members. Check your connection and try again."

async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

export default function PinPadPage() {
  const router = useRouter()
  const [staff, setStaff] = useState<Staff[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoadingStaff, setIsLoadingStaff] = useState(true)

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadStaff = useCallback(async () => {
    setIsLoadingStaff(true)
    setLoadError(null)

    const headers = await authHeader()
    const { data, error } = await apiClient.GET('/members', { headers })

    setIsLoadingStaff(false)

    if (error || !data) {
      setLoadError(GENERIC_LOAD_ERROR)
      return
    }

    setStaff(data.filter((member) => member.isActive))
  }, [])

  useEffect(() => {
    loadStaff()
  }, [loadStaff])

  // D-11 auto-timeout: after a period of inactivity, re-lock the terminal to
  // the staff-picker step and clear the current operator token.
  const resetToStaffPicker = useCallback(() => {
    sessionStorage.removeItem('operatorToken')
    setSelectedStaffId(null)
    setPin('')
    setPinError(null)
  }, [])

  useIdleTimer(resetToStaffPicker)

  function selectStaff(id: string) {
    setSelectedStaffId(id)
    setPin('')
    setPinError(null)
  }

  async function submitPin(nextPin: string) {
    if (!selectedStaffId) return
    setIsSubmitting(true)
    setPinError(null)

    const headers = await authHeader()
    const { data, error } = await apiClient.POST('/terminal/pin/switch', {
      body: { staffId: selectedStaffId, pin: nextPin },
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

    // The real register/checkout landing page is a later-phase concern
    // (Phase 3+). Redirect to the app root as a placeholder authenticated
    // route for now, matching the pattern used by 01-11's auth pages.
    router.push('/')
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
            {selectedStaffId ? 'Enter your PIN' : "Who's ringing this up?"}
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

          {!loadError && !isLoadingStaff && !selectedStaffId && (
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

          {!loadError && !isLoadingStaff && selectedStaffId && (
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
        </CardContent>
      </Card>
    </div>
  )
}
