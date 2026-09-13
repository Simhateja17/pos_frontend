'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { Fld, Modal } from '@/components/couture/ui'
import { useT } from '@/lib/i18n/i18n'

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
  const t = useT()
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
      setError((apiError as { error?: string } | undefined)?.error ?? t('checkout.approval.incorrectPin'))
      setPin('')
      return
    }
    onApproved(data.operatorToken)
  }

  if (!open) return null

  return (
    <Modal
      title={t('checkout.approval.title')}
      onClose={onCancel}
      footer={
        <>
          <button className="btn" type="button" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button
            className="btn btn-pri"
            type="button"
            onClick={() => void submit()}
            disabled={!selectedStaffId || pin.length !== 4 || isSubmitting}
          >
            {isSubmitting ? t('checkout.approval.approving') : t('checkout.approval.approve')}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 14 }}>
        {t('checkout.approval.body')}
      </p>
      <Fld id="approval-staff" label={t('checkout.approval.staff')}>
        <select id="approval-staff" value={selectedStaffId ?? ''} onChange={(e) => setSelectedStaffId(e.target.value || null)}>
          <option value="">{t('checkout.approval.selectStaff')}</option>
          {staff.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </Fld>
      <Fld id="approval-pin" label={t('checkout.approval.pin')}>
        <input
          id="approval-pin"
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder={t('checkout.approval.pin')}
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
