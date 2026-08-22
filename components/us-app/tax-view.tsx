'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import { AuthenticatedRequestError, getAuthenticatedSettings, updateAuthenticatedSettings, type StoreSettings } from '@/lib/api/authenticated-client'
import { UsCard, UsCardBody, UsCardHeader, UsErrorState, UsLoadingState, UsPageHead, UsUnavailableModulePage } from './states'

type RateKey = 'state' | 'county' | 'city' | 'district'
type Rates = Record<RateKey, string>
const RATE_LABELS: Array<{ key: RateKey; label: string; help: string }> = [
  { key: 'state', label: 'State rate', help: 'State-level sales tax applied to taxable lines.' },
  { key: 'county', label: 'County rate', help: 'County-level sales tax for this store.' },
  { key: 'city', label: 'City rate', help: 'City-level sales tax for this store.' },
  { key: 'district', label: 'Special district rate', help: 'Special district sales tax, when applicable.' },
]

function errorMessage(error: unknown) { return error instanceof AuthenticatedRequestError || error instanceof Error ? error.message : 'Sales-tax settings are unavailable right now.' }

function ratesFromSettings(settings: StoreSettings): Rates | null {
  if (!settings.salesTaxRates) return null
  return { state: settings.salesTaxRates.state, county: settings.salesTaxRates.county, city: settings.salesTaxRates.city, district: settings.salesTaxRates.district }
}

export function UsTaxView() {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [rates, setRates] = useState<Rates | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const nextSettings = await getAuthenticatedSettings()
      setSettings(nextSettings)
      setRates(ratesFromSettings(nextSettings))
      if (nextSettings.region !== 'INTL' || !nextSettings.salesTaxRates) setError('This endpoint did not return International sales-tax settings for the current tenant.')
    } catch (nextError) {
      setError(errorMessage(nextError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const totalRate = useMemo(() => rates ? Object.values(rates).reduce((sum, value) => sum + (Number(value) || 0), 0) : 0, [rates])

  async function save() {
    if (!rates) return
    const values = Object.values(rates).map(Number)
    if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
      setError('Each sales-tax rate must be a number between 0 and 100.')
      return
    }
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const nextSettings = await updateAuthenticatedSettings({ salesTaxRates: { state: values[0], county: values[1], city: values[2], district: values[3] } })
      setSettings(nextSettings)
      setRates(ratesFromSettings(nextSettings))
      setNotice('Sales-tax rates saved and read back from the backend.')
    } catch (nextError) {
      setError(errorMessage(nextError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <><UsPageHead title="Sales Tax" sub="Store-level International sales-tax rates" /><UsLoadingState label="Loading sales-tax settings" rows={6} /></>
  if (!settings) return <><UsPageHead title="Sales Tax" sub="Store-level International sales-tax rates" /><UsCard><UsErrorState message={error || 'Settings are unavailable.'} onRetry={() => void load()} /></UsCard></>
  if (settings.region !== 'INTL' || !rates) return <UsUnavailableModulePage title="Sales Tax" sub="International settings are not available for this tenant" capability="The current settings response does not expose the International sales-tax rate contract." />

  return (
    <>
      <UsPageHead title="Sales Tax" sub="Plain state, county, city, and special-district sales-tax rates" actions={<button type="button" className="btn btn-primary" onClick={() => void save()} disabled={saving || settings.editableFields.salesTaxRates === false}><Save size={14} />{saving ? 'Saving…' : 'Save rates'}</button>} />
      {error ? <div className="notice error" role="alert" style={{ marginBottom: 14 }}>{error}</div> : null}
      {notice ? <div className="notice success" role="status" style={{ marginBottom: 14 }}>{notice}</div> : null}
      <div className="grid cols-2">
        <UsCard>
          <UsCardHeader title="Store rates" sub="These values are persisted in the existing store tax-rate columns and used by checkout." />
          <UsCardBody>
            <div className="form-grid">{RATE_LABELS.map(({ key, label, help }) => <div className="field" key={key}><label htmlFor={`us-tax-${key}`}>{label}</label><input id={`us-tax-${key}`} type="number" min="0" max="100" step="0.001" value={rates[key]} disabled={settings.editableFields.salesTaxRates === false || saving} onChange={(event) => setRates((current) => current ? { ...current, [key]: event.target.value } : current)} /><small>{help}</small></div>)}</div>
            {settings.editableFields.salesTaxRates === false ? <div className="notice" style={{ marginTop: 14 }}>This role can view rates but cannot edit them.</div> : null}
          </UsCardBody>
        </UsCard>
        <UsCard>
          <UsCardHeader title="Combined checkout rate" sub="A read-only sum of the four persisted jurisdiction rates" />
          <UsCardBody>
            <div className="kpi-card" style={{ boxShadow: 'none', background: 'var(--blue-pale)', borderColor: '#c7d7ff' }}><div className="kpi-label">Estimated combined rate</div><div className="kpi-value num">{totalRate.toFixed(3)}%</div><div className="kpi-meta">Checkout applies this combined rate only to taxable catalog variants. The server remains authoritative.</div></div>
            <div className="item-list" style={{ marginTop: 14 }}>{RATE_LABELS.map(({ key, label }) => <div className="item-row" key={key}><div className="item-body"><b>{label}</b><small>Current persisted value</small></div><span className="num">{Number(rates[key] || 0).toFixed(3)}%</span></div>)}</div>
          </UsCardBody>
        </UsCard>
      </div>
    </>
  )
}
