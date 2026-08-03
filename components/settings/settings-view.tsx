'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { FolderTree, Monitor, UserCog } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'
import { Card, CardHead, CardPad, Fld, ListRow, PageHead } from '@/components/couture/ui'
import { ErrorState, LoadingState } from '@/components/couture/states'

type Settings = {
  businessName: string
  tradeName: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  postalCode: string
  gstStatus: 'regular' | 'composition' | 'unregistered' | null
  gstin: string | null
  pan: string | null
  placeOfSupply: string | null
  businessType: 'supermarket' | 'grocery' | 'bakery' | 'general' | 'apparel' | 'electronics' | 'other' | null
  combinedTaxRatePercent: string
  discountThresholdPercent: string
}

const BUSINESS_TYPE_LABELS: Record<NonNullable<Settings['businessType']>, string> = {
  supermarket: 'Supermarket',
  grocery: 'Grocery / Kirana',
  bakery: 'Bakery',
  general: 'General store',
  apparel: 'Clothing & footwear',
  electronics: 'Electronics',
  other: 'Something else',
}

async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

export function SettingsView() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [form, setForm] = useState<Settings | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const [taxRate, setTaxRate] = useState('')
  const [discountThreshold, setDiscountThreshold] = useState('')
  const [taxError, setTaxError] = useState<string | null>(null)
  const [taxSaved, setTaxSaved] = useState(false)
  const [savingTax, setSavingTax] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const { data, error } = await apiClient.GET('/settings', { headers: await authHeader() })
    setLoading(false)
    if (error || !data) {
      setLoadError('We couldn’t load your store settings. Check your connection and try again.')
      return
    }
    const typed = data as Settings
    setSettings(typed)
    setForm(typed)
    setTaxRate(typed.combinedTaxRatePercent)
    setDiscountThreshold(typed.discountThresholdPercent)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    if (!form) return
    setProfileError(null)
    setProfileSaved(false)
    setSavingProfile(true)

    const { data, error } = await apiClient.PATCH('/settings', {
      body: {
        businessName: form.businessName,
        tradeName: form.tradeName,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        gstStatus: form.gstStatus,
        gstin: form.gstin,
        pan: form.pan,
        placeOfSupply: form.placeOfSupply,
      },
      headers: await authHeader(),
    })

    setSavingProfile(false)

    if (error) {
      setProfileError(
        (error as { error?: string }).error === 'Only the owner can change store settings'
          ? 'Only the store owner can change these details.'
          : 'That could not be saved — try again.',
      )
      return
    }

    setSettings(data as Settings)
    setProfileSaved(true)
  }

  async function saveTax(event: FormEvent) {
    event.preventDefault()
    setTaxError(null)
    setTaxSaved(false)
    setSavingTax(true)

    const { data, error } = await apiClient.PATCH('/settings', {
      body: {
        combinedTaxRatePercent: Number(taxRate),
        discountThresholdPercent: Number(discountThreshold),
      },
      headers: await authHeader(),
    })

    setSavingTax(false)

    if (error) {
      setTaxError(
        (error as { error?: string }).error === 'Only the owner can change store settings'
          ? 'Only the store owner can change these details.'
          : 'That could not be saved — try again.',
      )
      return
    }

    const typed = data as Settings
    setSettings(typed)
    setTaxRate(typed.combinedTaxRatePercent)
    setDiscountThreshold(typed.discountThresholdPercent)
    setTaxSaved(true)
  }

  if (loading) {
    return (
      <>
        <PageHead title="Settings" sub="Store configuration" />
        <Card>
          <LoadingState label="Loading settings" />
        </Card>
      </>
    )
  }

  if (loadError || !settings || !form) {
    return (
      <>
        <PageHead title="Settings" sub="Store configuration" />
        <Card>
          <ErrorState message={loadError ?? 'Settings are unavailable.'} onRetry={() => void load()} />
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHead title="Settings" sub="Store configuration" />

      <Card>
        <CardHead title="Staff, Counters & Categories" sub="Managed on their own screens" />
        <CardPad style={{ paddingTop: 4 }}>
          <ListRow
            icon={<UserCog size={17} strokeWidth={1.85} />}
            title="Staff"
            sub="Who has access, and what they can approve"
            action={
              <Link className="btn btn-sm btn-ghost" href="/app/settings/members">
                Open
              </Link>
            }
          />
          <ListRow
            icon={<Monitor size={17} strokeWidth={1.85} />}
            title="Counters"
            sub="The tills cashiers open a shift against"
            action={
              <Link className="btn btn-sm btn-ghost" href="/app/settings/terminals">
                Open
              </Link>
            }
          />
          <ListRow
            icon={<FolderTree size={17} strokeWidth={1.85} />}
            title="Categories"
            sub="How your products are grouped"
            action={
              <Link className="btn btn-sm btn-ghost" href="/app/inventory/categories">
                Open
              </Link>
            }
          />
        </CardPad>
      </Card>

      <Card>
        <CardHead
          title="Business profile"
          sub={
            settings.businessType
              ? `${BUSINESS_TYPE_LABELS[settings.businessType]} · used to suggest categories`
              : 'Business type not set'
          }
          right={
            <Link className="btn btn-sm" href="/store-type">
              {settings.businessType ? 'Change & add categories' : 'Set business type'}
            </Link>
          }
        />
        <CardPad>
          <form onSubmit={saveProfile}>
            {profileError && (
              <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                {profileError}
              </div>
            )}
            {profileSaved && !profileError && (
              <div style={{ marginBottom: 13, fontSize: 13, color: 'var(--brand-1)' }}>Saved.</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <Fld id="settings-business-name" label="Legal business name">
                <input
                  id="settings-business-name"
                  required
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                />
              </Fld>
              <Fld id="settings-trade-name" label="Trade / brand name">
                <input
                  id="settings-trade-name"
                  value={form.tradeName ?? ''}
                  onChange={(e) => setForm({ ...form, tradeName: e.target.value || null })}
                />
              </Fld>
            </div>
            <p className="t-sub" style={{ fontSize: 11.5, marginTop: -2, marginBottom: 10 }}>
              Must match your GST registration. Changing it here does not amend your registration — file Form GST
              REG-14 on the GST portal first, then update it here to match.
            </p>

            <Fld id="settings-address1" label="Address line 1">
              <input
                id="settings-address1"
                required
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
              />
            </Fld>
            <Fld id="settings-address2" label="Address line 2">
              <input
                id="settings-address2"
                value={form.addressLine2 ?? ''}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value || null })}
              />
            </Fld>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <Fld id="settings-city" label="City">
                <input
                  id="settings-city"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </Fld>
              <Fld id="settings-state" label="State">
                <input
                  id="settings-state"
                  required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </Fld>
              <Fld id="settings-postal-code" label="PIN code">
                <input
                  id="settings-postal-code"
                  required
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                />
              </Fld>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <Fld id="settings-gst-status" label="GST registration">
                <select
                  id="settings-gst-status"
                  value={form.gstStatus ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, gstStatus: (e.target.value || null) as Settings['gstStatus'] })
                  }
                >
                  <option value="">Not registered / not set</option>
                  <option value="regular">Regular</option>
                  <option value="composition">Composition</option>
                  <option value="unregistered">Unregistered</option>
                </select>
              </Fld>
              <Fld id="settings-gstin" label="GSTIN">
                <input
                  id="settings-gstin"
                  maxLength={15}
                  value={form.gstin ?? ''}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value || null })}
                  placeholder="Leave blank if not registered"
                />
              </Fld>
            </div>
            <p className="t-sub" style={{ fontSize: 11.5, marginTop: -2, marginBottom: 10 }}>
              Same rule as the name above — this must match what is on file with the GST portal.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <Fld id="settings-pan" label="PAN">
                <input
                  id="settings-pan"
                  maxLength={10}
                  value={form.pan ?? ''}
                  onChange={(e) => setForm({ ...form, pan: e.target.value || null })}
                />
              </Fld>
              <Fld id="settings-place-of-supply" label="Place of supply">
                <input
                  id="settings-place-of-supply"
                  value={form.placeOfSupply ?? ''}
                  onChange={(e) => setForm({ ...form, placeOfSupply: e.target.value || null })}
                />
              </Fld>
            </div>

            <button type="submit" className="btn btn-pri" disabled={savingProfile} style={{ marginTop: 6 }}>
              {savingProfile ? 'Saving…' : 'Save business profile'}
            </button>
          </form>
        </CardPad>
      </Card>

      <Card>
        <CardHead title="Tax & discounts" sub="Applied at checkout and to staff discount approval" />
        <CardPad>
          <form onSubmit={saveTax}>
            {taxError && (
              <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                {taxError}
              </div>
            )}
            {taxSaved && !taxError && (
              <div style={{ marginBottom: 13, fontSize: 13, color: 'var(--brand-1)' }}>Saved.</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <Fld id="settings-tax-rate" label="Combined tax rate (%)">
                <input
                  id="settings-tax-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
              </Fld>
              <Fld id="settings-discount-threshold" label="Discount approval threshold (%)">
                <input
                  id="settings-discount-threshold"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  value={discountThreshold}
                  onChange={(e) => setDiscountThreshold(e.target.value)}
                />
              </Fld>
            </div>
            <p className="t-sub" style={{ fontSize: 11.5, marginTop: -2, marginBottom: 10 }}>
              Discounts above this percentage need manager or owner approval at checkout.
            </p>

            <button type="submit" className="btn btn-pri" disabled={savingTax}>
              {savingTax ? 'Saving…' : 'Save tax & discounts'}
            </button>
          </form>
        </CardPad>
      </Card>
    </>
  )
}
