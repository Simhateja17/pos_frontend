'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FolderTree, Monitor, Store as StoreIcon, UserCog } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { Card, CardHead, CardPad, Fld, ListRow, PageHead } from '@/components/couture/ui'
import type { BarcodeLabelFormat } from '@/components/barcode-label'
import { ErrorState, LoadingState } from '@/components/couture/states'
import { getActiveStoreId, setActiveStoreId } from '@/lib/store-context'
import { getAuthenticatedStores, type Store } from '@/lib/api/authenticated-client'

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
  barcodeLabelFormat: BarcodeLabelFormat
  editableFields: Record<string, boolean>
}

/**
 * Ordered for the picker: the two that work for every variant first, then the
 * two that need a manufacturer barcode.
 */
const BARCODE_FORMAT_OPTIONS: { value: BarcodeLabelFormat; label: string; hint: string }[] = [
  { value: 'code128', label: 'Code 128', hint: 'Encodes your own SKU. Works for every product.' },
  { value: 'qr', label: 'QR', hint: 'Encodes your own SKU as a 2D code, for phone cameras.' },
  { value: 'ean13', label: 'EAN-13', hint: 'Needs a 13-digit manufacturer barcode on the variant.' },
  { value: 'upca', label: 'UPC-A', hint: 'Needs a 12-digit manufacturer barcode on the variant.' },
]

const BUSINESS_TYPE_LABELS: Record<NonNullable<Settings['businessType']>, string> = {
  supermarket: 'Supermarket',
  grocery: 'Grocery / Kirana',
  bakery: 'Bakery',
  general: 'General store',
  apparel: 'Clothing & footwear',
  electronics: 'Electronics',
  other: 'Something else',
}

export function SettingsView() {
  const router = useRouter()
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

  const [labelFormat, setLabelFormat] = useState<BarcodeLabelFormat>('code128')
  const [labelError, setLabelError] = useState<string | null>(null)
  const [labelSaved, setLabelSaved] = useState(false)
  const [savingLabel, setSavingLabel] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [storePickerError, setStorePickerError] = useState<string | null>(null)
  const [replayingTour, setReplayingTour] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    // Combined dashboards use the sentinel `all`, but settings contain
    // store-specific address, tax and place-of-supply values. Show the picker
    // before making a settings request so the API never has to guess a shop.
    if (getActiveStoreId() === 'all') {
      try {
        const payload = await getAuthenticatedStores()
        setStores(payload.stores.filter((store) => store.isActive))
        setStorePickerError(null)
      } catch (cause) {
        setStorePickerError(cause instanceof Error ? cause.message : 'We couldn’t load your stores.')
      }
      setLoading(false)
      setLoadError('choose_store')
      return
    }

    const { data, error } = await apiClient.GET('/settings', { headers: await authHeaders() })
    setLoading(false)
    if (error || !data) {
      const serverError = error as { error?: unknown } | undefined
      const serverMessage = typeof serverError?.error === 'string' ? serverError.error : null
      setLoadError(serverMessage ?? 'We couldn’t load your store settings. Check your connection and try again.')
      return
    }
    const typed = data as Settings
    setSettings(typed)
    setForm(typed)
    setTaxRate(typed.combinedTaxRatePercent)
    setDiscountThreshold(typed.discountThresholdPercent)
    setLabelFormat(typed.barcodeLabelFormat)
  }, [])

  function canEdit(field: string): boolean {
    if (!settings) return false
    // The metadata is server-owned. The fallback keeps an older rolling
    // backend from making company fields writable by accident.
    return settings.editableFields?.[field] ?? ['addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'placeOfSupply', 'combinedTaxRatePercent'].includes(field)
  }

  function chooseStore(storeId: string) {
    setActiveStoreId(storeId)
    setLoadError(null)
    void load()
  }

  async function replayTour() {
    setReplayingTour(true)
    const result = await apiClient.PATCH('/setup/tour', {
      body: { status: 'in_progress', lastStep: 'dashboard', seenSteps: [] },
      headers: await authHeaders(),
    })
    setReplayingTour(false)
    if (!result.error) router.push('/app/dashboard#guided-tour')
  }

  useEffect(() => {
    void load()
  }, [load])

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    if (!form) return
    setProfileError(null)
    setProfileSaved(false)
    setSavingProfile(true)

    const body: Record<string, unknown> = {}
    for (const field of ['businessName', 'tradeName', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'gstStatus', 'gstin', 'pan', 'placeOfSupply'] as const) {
      if (canEdit(field)) body[field] = form[field]
    }
    const { data, error } = await apiClient.PATCH('/settings', {
      body: body as never,
      headers: await authHeaders(),
    })

    setSavingProfile(false)

    if (error) {
      setProfileError(
        (error as { error?: string }).error === 'Only the owner can change these settings'
          ? 'Only the store owner can change these details.'
          : 'That could not be saved. Try again.',
      )
      return
    }

    setSettings(data as Settings)
    setForm(data as Settings)
    setProfileSaved(true)
  }

  async function saveTax(event: FormEvent) {
    event.preventDefault()
    setTaxError(null)
    setTaxSaved(false)
    setSavingTax(true)

    const body: Record<string, unknown> = { combinedTaxRatePercent: Number(taxRate) }
    if (canEdit('discountThresholdPercent')) body.discountThresholdPercent = Number(discountThreshold)
    const { data, error } = await apiClient.PATCH('/settings', {
      body: body as never,
      headers: await authHeaders(),
    })

    setSavingTax(false)

    if (error) {
      setTaxError(
        (error as { error?: string }).error === 'Only the owner can change these settings'
          ? 'Only the store owner can change these details.'
          : 'That could not be saved. Try again.',
      )
      return
    }

    const typed = data as Settings
    setSettings(typed)
    setForm(typed)
    setTaxRate(typed.combinedTaxRatePercent)
    setDiscountThreshold(typed.discountThresholdPercent)
    setTaxSaved(true)
  }

  async function saveLabelFormat(event: FormEvent) {
    event.preventDefault()
    setLabelError(null)
    setLabelSaved(false)
    setSavingLabel(true)

    const { data, error } = await apiClient.PATCH('/settings', {
      body: { barcodeLabelFormat: labelFormat } as never,
      headers: await authHeaders(),
    })

    setSavingLabel(false)

    if (error) {
      setLabelError(
        (error as { error?: string }).error === 'Only the owner can change these settings'
          ? 'Only the store owner can change these details.'
          : 'That could not be saved — try again.',
      )
      return
    }

    const typed = data as Settings
    setSettings(typed)
    setForm(typed)
    setLabelFormat(typed.barcodeLabelFormat)
    setLabelSaved(true)
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

  if (loadError === 'choose_store') {
    return (
      <>
        <PageHead title="Settings" sub="Choose a store" />
        <Card>
          <CardHead title="Which store do you want to configure?" sub="Address, tax and place-of-supply settings belong to one store." />
          <CardPad>
            {storePickerError ? <ErrorState message={storePickerError} onRetry={() => void load()} /> : null}
            {!storePickerError && stores.length === 0 ? <LoadingState label="Loading stores" /> : null}
            {stores.map((store) => (
              <ListRow
                key={store.id}
                icon={<StoreIcon size={17} strokeWidth={1.85} />}
                title={store.name}
                sub={[store.city, store.state].filter(Boolean).join(' · ') || 'Address not set'}
                action={<button className="btn btn-sm btn-pri" onClick={() => chooseStore(store.id)}>Open settings</button>}
              />
            ))}
          </CardPad>
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
          {getActiveStoreId() === 'all' ? <div style={{ padding: '0 24px 24px', textAlign: 'center' }}><Link className="btn btn-sm btn-pri" href="/app/stores">Open Stores</Link></div> : null}
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHead title="Settings" sub="Store configuration" />

      <Card>
        <CardHead title="Guided tour" sub="Replay the back-office tour for this staff member and store." right={<button className="btn btn-sm" onClick={() => void replayTour()} disabled={replayingTour}>{replayingTour ? 'Starting…' : 'Replay guided tour'}</button>} />
      </Card>

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
            canEdit('businessType') ? (
              <Link className="btn btn-sm" href="/store-type">
                {settings.businessType ? 'Change & add categories' : 'Set business type'}
              </Link>
            ) : <span className="t-sub" style={{ fontSize: 12 }}>Owner only</span>
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
                  disabled={!canEdit('businessName')}
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                />
              </Fld>
              <Fld id="settings-trade-name" label="Trade / brand name">
                <input
                  id="settings-trade-name"
                  disabled={!canEdit('tradeName')}
                  value={form.tradeName ?? ''}
                  onChange={(e) => setForm({ ...form, tradeName: e.target.value || null })}
                />
              </Fld>
            </div>
            <p className="t-sub" style={{ fontSize: 11.5, marginTop: -2, marginBottom: 10 }}>
              Must match your GST registration. Changing it here does not amend your registration. File Form GST
              REG-14 on the GST portal first, then update it here to match.
            </p>

            <Fld id="settings-address1" label="Address line 1">
              <input
                id="settings-address1"
                required
                disabled={!canEdit('addressLine1')}
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
              />
            </Fld>
            <Fld id="settings-address2" label="Address line 2">
              <input
                id="settings-address2"
                disabled={!canEdit('addressLine2')}
                value={form.addressLine2 ?? ''}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value || null })}
              />
            </Fld>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <Fld id="settings-city" label="City">
                <input
                  id="settings-city"
                  required
                  disabled={!canEdit('city')}
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </Fld>
              <Fld id="settings-state" label="State">
                <input
                  id="settings-state"
                  required
                  disabled={!canEdit('state')}
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </Fld>
              <Fld id="settings-postal-code" label="PIN code">
                <input
                  id="settings-postal-code"
                  required
                  disabled={!canEdit('postalCode')}
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                />
              </Fld>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <Fld id="settings-gst-status" label="GST registration">
                <select
                  id="settings-gst-status"
                  disabled={!canEdit('gstStatus')}
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
                  disabled={!canEdit('gstin')}
                  value={form.gstin ?? ''}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value || null })}
                  placeholder="Leave blank if not registered"
                />
              </Fld>
            </div>
            <p className="t-sub" style={{ fontSize: 11.5, marginTop: -2, marginBottom: 10 }}>
              Same rule as the name above: this must match what is on file with the GST portal.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <Fld id="settings-pan" label="PAN">
                <input
                  id="settings-pan"
                  maxLength={10}
                  disabled={!canEdit('pan')}
                  value={form.pan ?? ''}
                  onChange={(e) => setForm({ ...form, pan: e.target.value || null })}
                />
              </Fld>
              <Fld id="settings-place-of-supply" label="Place of supply">
                <input
                  id="settings-place-of-supply"
                  disabled={!canEdit('placeOfSupply')}
                  value={form.placeOfSupply ?? ''}
                  onChange={(e) => setForm({ ...form, placeOfSupply: e.target.value || null })}
                />
              </Fld>
            </div>

            <button type="submit" className="btn btn-pri" disabled={savingProfile} style={{ marginTop: 6 }}>
              {savingProfile ? 'Saving…' : canEdit('businessName') ? 'Save business profile' : 'Save store details'}
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
                  disabled={!canEdit('combinedTaxRatePercent')}
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
                  disabled={!canEdit('discountThresholdPercent')}
                  value={discountThreshold}
                  onChange={(e) => setDiscountThreshold(e.target.value)}
                />
              </Fld>
            </div>
            <p className="t-sub" style={{ fontSize: 11.5, marginTop: -2, marginBottom: 10 }}>
              Discounts above this percentage need manager or owner approval at checkout.
            </p>

            <button type="submit" className="btn btn-pri" disabled={savingTax || !canEdit('combinedTaxRatePercent')}>
              {savingTax ? 'Saving…' : 'Save tax & discounts'}
            </button>
          </form>
        </CardPad>
      </Card>

      <Card>
        <CardHead title="Barcode labels" sub="The symbology used when you print product labels" />
        <CardPad>
          <form onSubmit={saveLabelFormat}>
            {labelError && (
              <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                {labelError}
              </div>
            )}
            {labelSaved && !labelError && (
              <div style={{ marginBottom: 13, fontSize: 13, color: 'var(--brand-1)' }}>Saved.</div>
            )}

            <Fld id="settings-barcode-format" label="Label format">
              <select
                id="settings-barcode-format"
                value={labelFormat}
                disabled={!canEdit('barcodeLabelFormat')}
                onChange={(e) => setLabelFormat(e.target.value as BarcodeLabelFormat)}
              >
                {BARCODE_FORMAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Fld>
            <p className="t-sub" style={{ fontSize: 11.5, marginTop: -2, marginBottom: 10 }}>
              {BARCODE_FORMAT_OPTIONS.find((o) => o.value === labelFormat)?.hint}
              {(labelFormat === 'ean13' || labelFormat === 'upca') &&
                ' Variants without one still print as Code 128 of the SKU, and the label screen says which.'}
            </p>

            <button type="submit" className="btn btn-pri" disabled={savingLabel || !canEdit('barcodeLabelFormat')}>
              {savingLabel ? 'Saving…' : 'Save label format'}
            </button>
          </form>
        </CardPad>
      </Card>
    </>
  )
}
