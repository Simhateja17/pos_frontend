'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ManagerStaff = { id: string; name: string; role: 'owner' | 'manager' | 'cashier'; isActive: boolean }

async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

export function ManagerApprovalModal({
  open,
  onApproved,
  onCancel,
}: {
  open: boolean
  onApproved: (operatorToken: string) => void
  onCancel: () => void
}) {
  const [staff, setStaff] = useState<ManagerStaff[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelectedStaffId(null)
    setPin('')
    setError(null)
    ;(async () => {
      const headers = await authHeader()
      const { data } = await apiClient.GET('/members', { headers })
      setStaff((data ?? []).filter((m) => m.isActive && (m.role === 'manager' || m.role === 'owner')))
    })()
  }, [open])

  async function submit() {
    if (!selectedStaffId || pin.length !== 4) return
    setIsSubmitting(true)
    setError(null)
    const headers = await authHeader()
    const { data, error: apiError } = await apiClient.POST('/terminal/pin/switch', {
      body: { staffId: selectedStaffId, pin },
      headers,
    })
    setIsSubmitting(false)
    if (apiError || !data) {
      // Verbatim backend copy (same 01-06 strings the terminal PIN page reads) —
      // "Incorrect PIN — try again." / "Too many attempts. Ask a manager to unlock this terminal."
      setError((apiError as { error?: string } | undefined)?.error ?? 'Incorrect PIN — try again.')
      setPin('')
      return
    }
    onApproved(data.operatorToken)
  }

  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="rounded-md bg-white p-6" style={{ maxWidth: 360, backgroundColor: '#FFFFFF' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 400 }}>
          This discount needs manager approval. Ask a manager or owner to enter their PIN to continue.
        </p>
        <select
          value={selectedStaffId ?? ''}
          onChange={(e) => setSelectedStaffId(e.target.value || null)}
          className="mt-4 w-full rounded-md border p-2"
          style={{ minHeight: 44 }}
        >
          <option value="">Select manager or owner…</option>
          {staff.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <Input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="4-digit PIN"
          className="mt-2"
          style={{ minHeight: 44 }}
        />
        {error && (
          <p className="mt-2 text-sm" style={{ color: '#DC2626' }}>{error}</p>
        )}
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            onClick={submit}
            disabled={!selectedStaffId || pin.length !== 4 || isSubmitting}
            style={{ backgroundColor: '#0058BA', color: '#FFFFFF', minHeight: 44 }}
          >
            Approve
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} style={{ minHeight: 44 }}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
