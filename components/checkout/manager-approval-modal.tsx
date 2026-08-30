'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { Fld, Modal } from '@/components/couture/ui'

type ManagerStaff = { id: string; name: string; role: 'owner' | 'manager' | 'cashier'; isActive: boolean }

async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

export function ManagerApprovalModal({
  open,
  reason = 'discount',
  onApproved,
  onCancel,
}: {
  open: boolean
  reason?: 'discount' | 'credit'
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
      body: { staffId: selectedStaffId, pin, sessionType: 'approval' },
      headers,
    })
    setIsSubmitting(false)
    if (apiError || !data) {
      // Verbatim backend copy (same 01-06 strings the terminal PIN page reads):
      // "Incorrect PIN. Try again." / "Too many attempts. Ask a manager to unlock this terminal."
      setError((apiError as { error?: string } | undefined)?.error ?? 'Incorrect PIN. Try again.')
      setPin('')
      return
    }
    onApproved(data.operatorToken)
  }

  if (!open) return null

  const creditApproval = reason === 'credit'

  return (
    <Modal
      title="Manager approval required"
      onClose={onCancel}
      footer={
        <>
          <button className="btn" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-pri"
            type="button"
            onClick={() => void submit()}
            disabled={!selectedStaffId || pin.length !== 4 || isSubmitting}
          >
            {isSubmitting ? 'Approving…' : 'Approve'}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 14 }}>
        {creditApproval
          ? 'This sale would exceed the customer credit limit. Ask a manager or owner to enter their PIN to continue.'
          : 'This discount needs manager approval. Ask a manager or owner to enter their PIN to continue.'}
      </p>
      <Fld id="approval-staff" label="Manager or owner">
        <select id="approval-staff" value={selectedStaffId ?? ''} onChange={(e) => setSelectedStaffId(e.target.value || null)}>
          <option value="">Select manager or owner…</option>
          {staff.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </Fld>
      <Fld id="approval-pin" label="4-digit PIN">
        <input
          id="approval-pin"
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="4-digit PIN"
        />
      </Fld>
      {error && (
        <div role="alert" style={{ fontSize: 13, color: 'var(--danger)' }}>
          {error}
        </div>
      )}
    </Modal>
  )
}
