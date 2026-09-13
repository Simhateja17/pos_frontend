'use client'

import { useState, type FormEvent } from 'react'
import { Fld } from '@/components/couture/ui'
import { useT, type MessageKey } from '@/lib/i18n/i18n'
import type { Customer, CustomerWrite } from './api'

const STATE_CODES = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12',
  '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24',
  '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36',
  '37', '38', '97',
] as const

type FormState = {
  billingName: string
  phone: string
  email: string
  gstin: string
  addressLine1: string
  addressLine2: string
  city: string
  stateCode: string
  postalCode: string
  notes: string
  creditLimit: string
}

const EMPTY_FORM: FormState = {
  billingName: '',
  phone: '',
  email: '',
  gstin: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateCode: '',
  postalCode: '',
  notes: '',
  creditLimit: '',
}

function formFromCustomer(customer: Customer | null): FormState {
  if (!customer) return EMPTY_FORM
  return {
    billingName: customer.billingName ?? customer.name ?? '',
    phone: customer.phone ?? '',
    email: customer.email ?? '',
    gstin: customer.gstin ?? '',
    addressLine1: customer.addressLine1 ?? '',
    addressLine2: customer.addressLine2 ?? '',
    city: customer.city ?? '',
    stateCode: customer.stateCode ?? '',
    postalCode: customer.postalCode ?? '',
    notes: customer.notes ?? '',
    creditLimit: customer.creditLimit ?? '',
  }
}

export function CustomerForm({
  customer,
  onSave,
  onCancel,
  saving,
  serverError,
  canEditCreditLimit = false,
}: {
  customer: Customer | null
  onSave: (body: CustomerWrite) => Promise<void>
  onCancel: () => void
  saving: boolean
  serverError: string | null
  canEditCreditLimit?: boolean
}) {
  const t = useT()
  const [form, setForm] = useState<FormState>(() => formFromCustomer(customer))
  const [validationError, setValidationError] = useState<string | null>(null)

  function setField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setValidationError(null)

    const phone = form.phone.trim()
    const email = form.email.trim()
    if (!phone && !email) {
      setValidationError(t('customers.errors.phoneOrEmail'))
      return
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setValidationError(t('customers.errors.email'))
      return
    }
    if (form.gstin.trim() && !/^\d{2}[A-Za-z]{5}\d{4}[A-Za-z][1-9A-Za-z]Z[A-Za-z0-9]$/.test(form.gstin.trim())) {
      setValidationError(t('customers.errors.gstin'))
      return
    }
    if (form.stateCode && !/^(0[1-9]|[12]\d|3[0-8]|97)$/.test(form.stateCode)) {
      setValidationError(t('customers.errors.stateCode'))
      return
    }
    if (form.postalCode && !/^[1-9]\d{5}$/.test(form.postalCode)) {
      setValidationError(t('customers.errors.pincode'))
      return
    }
    const rawCreditLimit = form.creditLimit.trim()
    if (canEditCreditLimit && rawCreditLimit) {
      if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(rawCreditLimit) || !Number.isFinite(Number(rawCreditLimit)) || Number(rawCreditLimit) < 0) {
        setValidationError(t('customers.errors.creditLimit'))
        return
      }
    }

    await onSave({
      billingName: form.billingName.trim() || null,
      phone: phone || null,
      email: email || null,
      gstin: form.gstin.trim() || null,
      addressLine1: form.addressLine1.trim() || null,
      addressLine2: form.addressLine2.trim() || null,
      city: form.city.trim() || null,
      stateCode: form.stateCode || null,
      postalCode: form.postalCode || null,
      country: 'IN',
      notes: form.notes.trim() || null,
      ...(canEditCreditLimit ? { creditLimit: rawCreditLimit ? Number(rawCreditLimit).toFixed(2) : null } : {}),
    })
  }

  return (
    <form onSubmit={submit}>
      {(validationError || serverError) && (
        <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)', lineHeight: 1.45 }}>
          {validationError ?? serverError}
        </div>
      )}

      <Fld id="customer-billing-name" label={t('customers.form.billingName')}>
        <input id="customer-billing-name" value={form.billingName} onChange={(event) => setField('billingName', event.target.value)} placeholder={t('customers.form.billingNamePlaceholder')} />
      </Fld>

      <div style={{ display: 'flex', gap: 10 }}>
        <Fld id="customer-phone" label={t('customers.form.phone')}>
          <input id="customer-phone" inputMode="tel" value={form.phone} onChange={(event) => setField('phone', event.target.value)} placeholder={t('customers.form.phonePlaceholder')} />
        </Fld>
        <Fld id="customer-email" label={t('customers.form.email')}>
          <input id="customer-email" type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} placeholder={t('customers.form.emailPlaceholder')} />
        </Fld>
      </div>
      <div style={{ marginTop: -7, marginBottom: 13, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
        {t('customers.form.phoneEmailHelp')}
      </div>

      {canEditCreditLimit && (
        <>
          <Fld id="customer-credit-limit" label={t('customers.form.creditLimit')}>
            <input
              id="customer-credit-limit"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={form.creditLimit}
              onChange={(event) => setField('creditLimit', event.target.value)}
              placeholder={t('customers.form.creditLimitPlaceholder')}
            />
          </Fld>
          <div style={{ marginTop: -7, marginBottom: 13, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
            {t('customers.form.creditLimitHelp')}
          </div>
        </>
      )}

      <Fld id="customer-gstin" label={t('customers.form.gstin')}>
        <input id="customer-gstin" value={form.gstin} onChange={(event) => setField('gstin', event.target.value.toUpperCase())} placeholder={t('customers.form.gstinPlaceholder')} maxLength={15} />
      </Fld>

      <div style={{ display: 'flex', gap: 10 }}>
        <Fld id="customer-address-line1" label={t('customers.form.addressLine1')}>
          <input id="customer-address-line1" value={form.addressLine1} onChange={(event) => setField('addressLine1', event.target.value)} placeholder={t('customers.form.addressLine1Placeholder')} />
        </Fld>
        <Fld id="customer-address-line2" label={t('customers.form.addressLine2')}>
          <input id="customer-address-line2" value={form.addressLine2} onChange={(event) => setField('addressLine2', event.target.value)} placeholder={t('customers.form.addressLine2Placeholder')} />
        </Fld>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Fld id="customer-city" label={t('customers.form.city')}>
          <input id="customer-city" value={form.city} onChange={(event) => setField('city', event.target.value)} placeholder={t('customers.form.cityPlaceholder')} />
        </Fld>
        <Fld id="customer-state-code" label={t('customers.form.stateCode')}>
          <select id="customer-state-code" value={form.stateCode} onChange={(event) => setField('stateCode', event.target.value)}>
            <option value="">{t('customers.form.stateNotProvided')}</option>
            {STATE_CODES.map((code) => <option key={code} value={code}>{code}: {t(`customers.states.${code}` as MessageKey)}</option>)}
          </select>
        </Fld>
        <Fld id="customer-postal-code" label={t('customers.form.pincode')}>
          <input id="customer-postal-code" inputMode="numeric" maxLength={6} value={form.postalCode} onChange={(event) => setField('postalCode', event.target.value.replace(/\D/g, ''))} placeholder={t('customers.form.pincodePlaceholder')} />
        </Fld>
      </div>

      <Fld id="customer-notes" label={t('customers.form.notes')}>
        <textarea id="customer-notes" rows={3} value={form.notes} onChange={(event) => setField('notes', event.target.value)} placeholder={t('customers.form.notesPlaceholder')} />
      </Fld>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button className="btn" type="button" onClick={onCancel} disabled={saving}>{t('customers.form.cancel')}</button>
        <button className="btn btn-pri" type="submit" disabled={saving}>{saving ? t('customers.form.saving') : customer ? t('customers.form.save') : t('customers.form.create')}</button>
      </div>
    </form>
  )
}
