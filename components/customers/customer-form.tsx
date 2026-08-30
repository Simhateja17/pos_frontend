'use client'

import { useState, type FormEvent } from 'react'
import { Fld } from '@/components/couture/ui'
import type { Customer, CustomerWrite } from './api'

const STATE_CODES = [
  ['01', 'Jammu and Kashmir'], ['02', 'Himachal Pradesh'], ['03', 'Punjab'], ['04', 'Chandigarh'],
  ['05', 'Uttarakhand'], ['06', 'Haryana'], ['07', 'Delhi'], ['08', 'Rajasthan'],
  ['09', 'Uttar Pradesh'], ['10', 'Bihar'], ['11', 'Sikkim'], ['12', 'Arunachal Pradesh'],
  ['13', 'Nagaland'], ['14', 'Manipur'], ['15', 'Mizoram'], ['16', 'Tripura'],
  ['17', 'Meghalaya'], ['18', 'Assam'], ['19', 'West Bengal'], ['20', 'Jharkhand'],
  ['21', 'Odisha'], ['22', 'Chhattisgarh'], ['23', 'Madhya Pradesh'], ['24', 'Gujarat'],
  ['25', 'Daman and Diu'], ['26', 'Dadra and Nagar Haveli'], ['27', 'Maharashtra'], ['28', 'Andhra Pradesh'],
  ['29', 'Karnataka'], ['30', 'Goa'], ['31', 'Lakshadweep'], ['32', 'Kerala'],
  ['33', 'Tamil Nadu'], ['34', 'Puducherry'], ['35', 'Andaman and Nicobar Islands'], ['36', 'Telangana'],
  ['37', 'Andhra Pradesh'], ['38', 'Ladakh'], ['97', 'Other territory'],
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
      setValidationError('Add a phone number or email so this profile can be found safely later.')
      return
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setValidationError('Enter a valid email address.')
      return
    }
    if (form.gstin.trim() && !/^\d{2}[A-Za-z]{5}\d{4}[A-Za-z][1-9A-Za-z]Z[A-Za-z0-9]$/.test(form.gstin.trim())) {
      setValidationError('GSTIN must be 15 characters in the Indian GST format.')
      return
    }
    if (form.stateCode && !/^(0[1-9]|[12]\d|3[0-8]|97)$/.test(form.stateCode)) {
      setValidationError('Choose a valid two-digit Indian state code.')
      return
    }
    if (form.postalCode && !/^[1-9]\d{5}$/.test(form.postalCode)) {
      setValidationError('PIN code must be six digits.')
      return
    }
    const rawCreditLimit = form.creditLimit.trim()
    if (canEditCreditLimit && rawCreditLimit) {
      if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(rawCreditLimit) || !Number.isFinite(Number(rawCreditLimit)) || Number(rawCreditLimit) < 0) {
        setValidationError('Credit limit must be a non-negative amount.')
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

      <Fld id="customer-billing-name" label="Billing name">
        <input id="customer-billing-name" value={form.billingName} onChange={(event) => setField('billingName', event.target.value)} placeholder="e.g. Asha Rao" />
      </Fld>

      <div style={{ display: 'flex', gap: 10 }}>
        <Fld id="customer-phone" label="Phone">
          <input id="customer-phone" inputMode="tel" value={form.phone} onChange={(event) => setField('phone', event.target.value)} placeholder="+91 98765 43210" />
        </Fld>
        <Fld id="customer-email" label="Email">
          <input id="customer-email" type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} placeholder="name@example.com" />
        </Fld>
      </div>
      <div style={{ marginTop: -7, marginBottom: 13, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
        Phone or email is required. Values are normalized before duplicate checking.
      </div>

      {canEditCreditLimit && (
        <>
          <Fld id="customer-credit-limit" label="Credit limit (optional)">
            <input
              id="customer-credit-limit"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={form.creditLimit}
              onChange={(event) => setField('creditLimit', event.target.value)}
              placeholder="Leave blank for no limit"
            />
          </Fld>
          <div style={{ marginTop: -7, marginBottom: 13, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
            Managers and owners can set or clear this limit. A cashier can still use credit below the limit.
          </div>
        </>
      )}

      <Fld id="customer-gstin" label="GSTIN (optional)">
        <input id="customer-gstin" value={form.gstin} onChange={(event) => setField('gstin', event.target.value.toUpperCase())} placeholder="27ABCDE1234F1Z5" maxLength={15} />
      </Fld>

      <div style={{ display: 'flex', gap: 10 }}>
        <Fld id="customer-address-line1" label="Address line 1">
          <input id="customer-address-line1" value={form.addressLine1} onChange={(event) => setField('addressLine1', event.target.value)} placeholder="Street and building" />
        </Fld>
        <Fld id="customer-address-line2" label="Address line 2">
          <input id="customer-address-line2" value={form.addressLine2} onChange={(event) => setField('addressLine2', event.target.value)} placeholder="Area or landmark" />
        </Fld>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Fld id="customer-city" label="City">
          <input id="customer-city" value={form.city} onChange={(event) => setField('city', event.target.value)} placeholder="Mumbai" />
        </Fld>
        <Fld id="customer-state-code" label="State code">
          <select id="customer-state-code" value={form.stateCode} onChange={(event) => setField('stateCode', event.target.value)}>
            <option value="">Not provided</option>
            {STATE_CODES.map(([code, name]) => <option key={code} value={code}>{code}: {name}</option>)}
          </select>
        </Fld>
        <Fld id="customer-postal-code" label="PIN code">
          <input id="customer-postal-code" inputMode="numeric" maxLength={6} value={form.postalCode} onChange={(event) => setField('postalCode', event.target.value.replace(/\D/g, ''))} placeholder="400001" />
        </Fld>
      </div>

      <Fld id="customer-notes" label="Notes (optional)">
        <textarea id="customer-notes" rows={3} value={form.notes} onChange={(event) => setField('notes', event.target.value)} placeholder="Useful billing context for the team" />
      </Fld>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button className="btn" type="button" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="btn btn-pri" type="submit" disabled={saving}>{saving ? 'Saving…' : customer ? 'Save changes' : 'Create customer'}</button>
      </div>
    </form>
  )
}
