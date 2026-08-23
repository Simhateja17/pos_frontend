'use client'

/**
 * Sales tax rates for the US edition.
 *
 * India captures one GST registration at signup, so it has no equivalent
 * screen; a US store sets four jurisdiction rates that checkout combines. The
 * content is therefore US-only, but the design is not: this renders on the same
 * `couture` primitives (PageHead / Card / KpiRow / states) as every India
 * module, so the two editions stay visually identical.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Landmark, Save } from 'lucide-react'
import {
  AuthenticatedRequestError,
  getAuthenticatedSettings,
  updateAuthenticatedSettings,
  type StoreSettings,
} from '@/lib/api/authenticated-client'
import { Card, CardHead, CardPad, KpiRow, ListRow, PageHead, Split2 } from '@/components/couture/ui'
import { ErrorState, LoadingState, UnavailableModulePage } from '@/components/couture/states'

type RateKey = 'state' | 'county' | 'city' | 'district'
type Rates = Record<RateKey, string>

const RATE_LABELS: Array<{ key: RateKey; label: string; help: string }> = [
  { key: 'state', label: 'State rate', help: 'State-level sales tax applied to taxable lines.' },
  { key: 'county', label: 'County rate', help: 'County-level sales tax for this store.' },
  { key: 'city', label: 'City rate', help: 'City-level sales tax for this store.' },
  { key: 'district', label: 'Special district rate', help: 'Special district sales tax, when applicable.' },
]

function errorMessage(error: unknown) {
  return error instanceof AuthenticatedRequestError || error instanceof Error
    ? error.message
    : 'Sales-tax settings are unavailable right now.'
}

function ratesFromSettings(settings: StoreSettings): Rates | null {
  if (!settings.salesTaxRates) return null
  const { state, county, city, district } = settings.salesTaxRates
  return { state, county, city, district }
}

export function SalesTaxView() {
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
      if (nextSettings.region !== 'INTL' || !nextSettings.salesTaxRates) {
        setError('This endpoint did not return International sales-tax settings for the current tenant.')
      }
    } catch (nextError) {
      setError(errorMessage(nextError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const totalRate = useMemo(
    () => (rates ? Object.values(rates).reduce((sum, value) => sum + (Number(value) || 0), 0) : 0),
    [rates],
  )

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
      const nextSettings = await updateAuthenticatedSettings({
        salesTaxRates: { state: values[0], county: values[1], city: values[2], district: values[3] },
      })
      setSettings(nextSettings)
      setRates(ratesFromSettings(nextSettings))
      setNotice('Sales-tax rates saved and read back from the backend.')
    } catch (nextError) {
      setError(errorMessage(nextError))
    } finally {
      setSaving(false)
    }
  }

  const head = <PageHead title="Sales Tax" sub="Store-level sales-tax rates for this location" />

  if (loading) return <>{head}<LoadingState label="Loading sales-tax settings" rows={6} /></>
  if (!settings) {
    return <>{head}<Card><ErrorState message={error || 'Settings are unavailable.'} onRetry={() => void load()} /></Card></>
  }
  if (settings.region !== 'INTL' || !rates) {
    return (
      <UnavailableModulePage
        title="Sales Tax"
        sub="International settings are not available for this tenant"
        capability="The current settings response does not expose the International sales-tax rate contract."
      />
    )
  }

  const readOnly = settings.editableFields.salesTaxRates === false

  return (
    <>
      <PageHead
        title="Sales Tax"
        sub="Plain state, county, city, and special-district sales-tax rates"
        actions={
          <button type="button" className="btn btn-pri" onClick={() => void save()} disabled={saving || readOnly}>
            <Save size={14} />
            {saving ? 'Saving…' : 'Save rates'}
          </button>
        }
      />

      {error ? <div className="notice error" role="alert" style={{ marginBottom: 14 }}>{error}</div> : null}
      {notice ? <div className="notice success" role="status" style={{ marginBottom: 14 }}>{notice}</div> : null}

      <KpiRow
        items={[
          {
            label: 'Estimated combined rate',
            value: `${totalRate.toFixed(3)}%`,
            meta: 'Checkout applies this only to taxable variants. The server remains authoritative.',
          },
        ]}
        cols={1}
      />

      <Split2>
        <Card>
          <CardHead
            title="Store rates"
            sub="Persisted in the store tax-rate columns and used by checkout."
          />
          <CardPad>
            <div className="form-grid">
              {RATE_LABELS.map(({ key, label, help }) => (
                <div className="field" key={key}>
                  <label htmlFor={`sales-tax-${key}`}>{label}</label>
                  <input
                    id={`sales-tax-${key}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.001"
                    value={rates[key]}
                    disabled={readOnly || saving}
                    onChange={(event) =>
                      setRates((current) => (current ? { ...current, [key]: event.target.value } : current))
                    }
                  />
                  <small className="t-sub">{help}</small>
                </div>
              ))}
            </div>
            {readOnly ? (
              <div className="notice" style={{ marginTop: 14 }}>This role can view rates but cannot edit them.</div>
            ) : null}
          </CardPad>
        </Card>

        <Card>
          <CardHead title="Rate breakdown" sub="The four persisted jurisdiction rates" />
          <CardPad style={{ paddingTop: 4 }}>
            {RATE_LABELS.map(({ key, label }) => (
              <ListRow
                key={key}
                icon={<Landmark size={17} strokeWidth={1.85} />}
                title={label}
                sub="Current persisted value"
                action={<span className="num t-strong">{Number(rates[key] || 0).toFixed(3)}%</span>}
              />
            ))}
          </CardPad>
        </Card>
      </Split2>
    </>
  )
}
