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
import { useT, type MessageKey } from '@/lib/i18n/i18n'
import { useAppRegion } from '@/lib/app-region'

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
const BARCODE_FORMAT_OPTIONS: readonly BarcodeLabelFormat[] = ['code128', 'qr', 'ean13', 'upca']

export function SettingsView() {
  const router = useRouter()
  const t = useT()
  const { appPath } = useAppRegion()
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
        setStorePickerError(cause instanceof Error ? cause.message : t('settings.errors.storesLoad'))
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
      setLoadError(serverMessage ?? t('settings.errors.settingsLoad'))
      return
    }
    const typed = data as Settings
    setSettings(typed)
    setForm(typed)
    setTaxRate(typed.combinedTaxRatePercent)
    setDiscountThreshold(typed.discountThresholdPercent)
    setLabelFormat(typed.barcodeLabelFormat)
    // t is intentionally omitted: changing locale must not refetch settings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          ? t('settings.errors.ownerOnly')
          : t('settings.errors.save'),
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
          ? t('settings.errors.ownerOnly')
          : t('settings.errors.save'),
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
          ? t('settings.errors.ownerOnly')
          : t('settings.errors.save'),
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
        <PageHead title={t('settings.title')} sub={t('settings.subtitle')} />
        <Card>
          <LoadingState label={t('settings.loading')} />
        </Card>
      </>
    )
  }

  if (loadError === 'choose_store') {
    return (
      <>
        <PageHead title={t('settings.title')} sub={t('settings.chooseStore')} />
        <Card>
          <CardHead title={t('settings.chooseStoreTitle')} sub={t('settings.chooseStoreSub')} />
          <CardPad>
            {storePickerError ? <ErrorState message={storePickerError} onRetry={() => void load()} /> : null}
            {!storePickerError && stores.length === 0 ? <LoadingState label={t('settings.loadingStores')} /> : null}
            {stores.map((store) => (
              <ListRow
                key={store.id}
                icon={<StoreIcon size={17} strokeWidth={1.85} />}
                title={store.name}
                sub={[store.city, store.state].filter(Boolean).join(' · ') || t('settings.addressNotSet')}
                action={<button className="btn btn-sm btn-pri" onClick={() => chooseStore(store.id)}>{t('settings.openSettings')}</button>}
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
        <PageHead title={t('settings.title')} sub={t('settings.subtitle')} />
        <Card>
          <ErrorState message={loadError ?? t('settings.unavailable')} onRetry={() => void load()} />
          {getActiveStoreId() === 'all' ? <div style={{ padding: '0 24px 24px', textAlign: 'center' }}><Link className="btn btn-sm btn-pri" href={appPath('/app/stores')}>{t('settings.openStores')}</Link></div> : null}
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHead title={t('settings.title')} sub={t('settings.subtitle')} />

      <Card>
        <CardHead title={t('settings.tour')} sub={t('settings.tourSub')} right={<button className="btn btn-sm" onClick={() => void replayTour()} disabled={replayingTour}>{replayingTour ? t('settings.starting') : t('settings.replayTour')}</button>} />
      </Card>

      <Card>
        <CardHead title={t('settings.manageTitle')} sub={t('settings.manageSub')} />
        <CardPad style={{ paddingTop: 4 }}>
          <ListRow
            icon={<UserCog size={17} strokeWidth={1.85} />}
            title={t('settings.staff')}
            sub={t('settings.staffSub')}
            action={
              <Link className="btn btn-sm btn-ghost" href={appPath('/app/settings/members')}>
                {t('settings.open')}
              </Link>
            }
          />
          <ListRow
            icon={<Monitor size={17} strokeWidth={1.85} />}
            title={t('settings.counters')}
            sub={t('settings.countersSub')}
            action={
              <Link className="btn btn-sm btn-ghost" href={appPath('/app/settings/terminals')}>
                {t('settings.open')}
              </Link>
            }
          />
          <ListRow
            icon={<FolderTree size={17} strokeWidth={1.85} />}
            title={t('settings.categories')}
            sub={t('settings.categoriesSub')}
            action={
              <Link className="btn btn-sm btn-ghost" href={appPath('/app/inventory/categories')}>
                {t('settings.open')}
              </Link>
            }
          />
        </CardPad>
      </Card>

      <Card>
        <CardHead
          title={t('settings.businessProfile')}
          sub={
            settings.businessType
              ? t('settings.businessTypeSuggestion', { type: t(`settings.businessTypes.${settings.businessType}` as MessageKey) })
              : t('settings.businessTypeNotSet')
          }
          right={
            canEdit('businessType') ? (
              <Link className="btn btn-sm" href="/store-type">
                {settings.businessType ? t('settings.changeCategories') : t('settings.setBusinessType')}
              </Link>
            ) : <span className="t-sub" style={{ fontSize: 12 }}>{t('settings.ownerOnly')}</span>
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
              <div style={{ marginBottom: 13, fontSize: 13, color: 'var(--brand-1)' }}>{t('settings.profile.saved')}</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <Fld id="settings-business-name" label={t('settings.fields.legalName')}>
                <input
                  id="settings-business-name"
                  required
                  disabled={!canEdit('businessName')}
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                />
              </Fld>
              <Fld id="settings-trade-name" label={t('settings.fields.tradeName')}>
                <input
                  id="settings-trade-name"
                  disabled={!canEdit('tradeName')}
                  value={form.tradeName ?? ''}
                  onChange={(e) => setForm({ ...form, tradeName: e.target.value || null })}
                />
              </Fld>
            </div>
            <p className="t-sub" style={{ fontSize: 11.5, marginTop: -2, marginBottom: 10 }}>
              {t('settings.profile.identityHelp')}
            </p>

            <Fld id="settings-address1" label={t('settings.fields.addressLine1')}>
              <input
                id="settings-address1"
                required
                disabled={!canEdit('addressLine1')}
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
              />
            </Fld>
            <Fld id="settings-address2" label={t('settings.fields.addressLine2')}>
              <input
                id="settings-address2"
                disabled={!canEdit('addressLine2')}
                value={form.addressLine2 ?? ''}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value || null })}
              />
            </Fld>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <Fld id="settings-city" label={t('settings.fields.city')}>
                <input
                  id="settings-city"
                  required
                  disabled={!canEdit('city')}
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </Fld>
              <Fld id="settings-state" label={t('settings.fields.state')}>
                <input
                  id="settings-state"
                  required
                  disabled={!canEdit('state')}
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </Fld>
              <Fld id="settings-postal-code" label={t('settings.fields.pincode')}>
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
              <Fld id="settings-gst-status" label={t('settings.fields.gstRegistration')}>
                <select
                  id="settings-gst-status"
                  disabled={!canEdit('gstStatus')}
                  value={form.gstStatus ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, gstStatus: (e.target.value || null) as Settings['gstStatus'] })
                  }
                >
                  <option value="">{t('settings.profile.gstNotSet')}</option>
                  <option value="regular">{t('settings.profile.regular')}</option>
                  <option value="composition">{t('settings.profile.composition')}</option>
                  <option value="unregistered">{t('settings.profile.unregistered')}</option>
                </select>
              </Fld>
              <Fld id="settings-gstin" label={t('settings.fields.gstin')}>
                <input
                  id="settings-gstin"
                  maxLength={15}
                  disabled={!canEdit('gstin')}
                  value={form.gstin ?? ''}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value || null })}
                  placeholder={t('settings.profile.gstinPlaceholder')}
                />
              </Fld>
            </div>
            <p className="t-sub" style={{ fontSize: 11.5, marginTop: -2, marginBottom: 10 }}>
              {t('settings.profile.gstHelp')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <Fld id="settings-pan" label={t('settings.fields.pan')}>
                <input
                  id="settings-pan"
                  maxLength={10}
                  disabled={!canEdit('pan')}
                  value={form.pan ?? ''}
                  onChange={(e) => setForm({ ...form, pan: e.target.value || null })}
                />
              </Fld>
              <Fld id="settings-place-of-supply" label={t('settings.fields.placeOfSupply')}>
                <input
                  id="settings-place-of-supply"
                  disabled={!canEdit('placeOfSupply')}
                  value={form.placeOfSupply ?? ''}
                  onChange={(e) => setForm({ ...form, placeOfSupply: e.target.value || null })}
                />
              </Fld>
            </div>

            <button type="submit" className="btn btn-pri" disabled={savingProfile} style={{ marginTop: 6 }}>
              {savingProfile ? t('common.saving') : canEdit('businessName') ? t('settings.profile.saveBusiness') : t('settings.profile.saveStore')}
            </button>
          </form>
        </CardPad>
      </Card>

      <Card>
        <CardHead title={t('settings.tax.title')} sub={t('settings.tax.sub')} />
        <CardPad>
          <form onSubmit={saveTax}>
            {taxError && (
              <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                {taxError}
              </div>
            )}
            {taxSaved && !taxError && (
              <div style={{ marginBottom: 13, fontSize: 13, color: 'var(--brand-1)' }}>{t('settings.profile.saved')}</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <Fld id="settings-tax-rate" label={t('settings.fields.legacyTax')}>
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
              <Fld id="settings-discount-threshold" label={t('settings.fields.discountThreshold')}>
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
              {t('settings.tax.discountHelp')}
            </p>

            <button type="submit" className="btn btn-pri" disabled={savingTax || !canEdit('combinedTaxRatePercent')}>
              {savingTax ? t('common.saving') : t('settings.tax.save')}
            </button>
          </form>
        </CardPad>
      </Card>

      <Card>
        <CardHead title={t('settings.barcode.title')} sub={t('settings.barcode.sub')} />
        <CardPad>
          <form onSubmit={saveLabelFormat}>
            {labelError && (
              <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                {labelError}
              </div>
            )}
            {labelSaved && !labelError && (
              <div style={{ marginBottom: 13, fontSize: 13, color: 'var(--brand-1)' }}>{t('settings.profile.saved')}</div>
            )}

            <Fld id="settings-barcode-format" label={t('settings.fields.labelFormat')}>
              <select
                id="settings-barcode-format"
                value={labelFormat}
                disabled={!canEdit('barcodeLabelFormat')}
                onChange={(e) => setLabelFormat(e.target.value as BarcodeLabelFormat)}
              >
                {BARCODE_FORMAT_OPTIONS.map((format) => (
                  <option key={format} value={format}>
                    {t(`settings.barcode.${format}` as MessageKey)}
                  </option>
                ))}
              </select>
            </Fld>
            <p className="t-sub" style={{ fontSize: 11.5, marginTop: -2, marginBottom: 10 }}>
              {t(`settings.barcode.${labelFormat}Hint` as MessageKey)}
              {(labelFormat === 'ean13' || labelFormat === 'upca') && <> {t('settings.barcode.fallbackHint')}</>}
            </p>

            <button type="submit" className="btn btn-pri" disabled={savingLabel || !canEdit('barcodeLabelFormat')}>
              {savingLabel ? t('common.saving') : t('settings.barcode.save')}
            </button>
          </form>
        </CardPad>
      </Card>
    </>
  )
}
