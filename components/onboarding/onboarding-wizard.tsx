'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'
import type { components } from '@/lib/api/schema'
import styles from './onboarding-wizard.module.css'

type Values = Record<string, string | boolean>
type Option = readonly [string, string]
type Field = { key: string; label: string; kind?: 'text' | 'number' | 'time' | 'email' | 'textarea' | 'toggle'; options?: readonly Option[]; required?: boolean; hint?: string; secondary?: boolean }
type StepDefinition = { tag: string; title: string; description: string; note: string; fields: readonly Field[]; deferred?: boolean }

/** ONBOARD-01 — only these steps block a new owner from reaching a working till. */
export const REQUIRED_STEP_COUNT = 2

const DRAFT_PREFIX = 'couture.india.onboarding.unsent.'
const categoryOptions = [['fashion', 'Fashion & Apparel'], ['beauty', 'Beauty & Wellness'], ['electronics', 'Electronics & Gadgets'], ['footwear', 'Footwear'], ['jewellery', 'Jewellery'], ['books', 'Books & Stationery'], ['pharmacy', 'Pharmacy & Healthcare'], ['grocery', 'Grocery & FMCG'], ['multi', 'Multi-brand / Other']] as const
const yesNo = (key: string, label: string, defaultValue = false): Field => ({ key, label, kind: 'toggle', hint: defaultValue ? 'Enabled by default' : undefined })

export const ONBOARDING_STEPS: readonly StepDefinition[] = [
  { tag: 'Business Identity', title: 'Tell us about your business.', description: 'Enter details exactly as registered with the Government of India — these appear on every invoice, tax filing, and compliance document.', note: 'Use the legal name shown on your GST Registration Certificate or Certificate of Incorporation / Partnership Deed.', fields: [
    { key: 'legalName', label: 'Legal business name', required: true }, { key: 'tradeName', label: 'Trade / brand name' }, { key: 'businessStructure', label: 'Business structure', secondary: true, options: [['pvtltd', 'Private Limited (Pvt Ltd)'], ['llp', 'LLP — Limited Liability Partnership'], ['partnership', 'Partnership Firm'], ['proprietorship', 'Sole Proprietorship'], ['public', 'Public Limited Company'], ['huf', 'HUF'], ['trust', 'Trust / Section 8 / NGO']] }, { key: 'yearEstablished', label: 'Year established', kind: 'number', secondary: true }, { key: 'registrationNumber', label: 'CIN / LLPIN', secondary: true, hint: 'Needed before filing, not before billing.' }, { key: 'natureOfBusiness', label: 'Nature of business', secondary: true, options: [['retailer', 'Retailer — direct to consumer'], ['wholesaler', 'Wholesaler — B2B only'], ['both', 'Both retail & wholesale'], ['mfr_retail', 'Manufacturer-retailer'], ['service', 'Service + retail']] }, { key: 'storeCount', label: 'Number of stores', secondary: true, options: [['1', '1 store'], ['2', '2 stores'], ['3', '3 stores'], ['4', '4 stores'], ['5', '5 stores'], ['6-10', '6–10 stores'], ['11-20', '11–20 stores'], ['20+', 'More than 20 stores']] },
  ] },
  { tag: 'GST & Legal Compliance', title: 'Tax registration & compliance.', description: 'Your GST registration type determines invoice format, filing schedule and inter-state rules.', note: 'You can save a draft now and verify GST details before issuing the first live invoice.', fields: [
    { key: 'gstStatus', label: 'GST registration type', required: true, options: [['regular', 'Regular taxpayer'], ['composition', 'Composition scheme'], ['unregistered', 'Unregistered — below threshold']] }, { key: 'gstin', label: 'GSTIN (15 characters)' }, { key: 'pan', label: 'PAN (10 characters)' }, { key: 'placeOfSupply', label: 'Primary state of supply', required: true }, { key: 'fssai', label: 'FSSAI license number', secondary: true }, { key: 'drugLicense', label: 'Drug license number', secondary: true }, { key: 'msmeRegistration', label: 'MSME / Udyam registration', secondary: true }, { key: 'shopEstablishmentLicense', label: 'Shop & Establishment license', secondary: true }, { ...yesNo('eInvoiceEnabled', 'E-invoice (IRN) mandatory'), secondary: true }, { ...yesNo('eWayBillEnabled', 'E-way bill for inter-state movement'), secondary: true },
  ] },
  { deferred: true, tag: 'Store Setup', title: 'Configure your store location.', description: 'These details appear on receipt headers, GST invoice address and multi-store reports.', note: 'This becomes the default store selected in the product header.', fields: [
    { key: 'storeName', label: 'Store display name', required: true }, { key: 'addressLine1', label: 'Address line 1', required: true }, { key: 'addressLine2', label: 'Address line 2' }, { key: 'postalCode', label: 'PIN code', required: true }, { key: 'city', label: 'City', required: true }, { key: 'state', label: 'State', required: true }, { key: 'storeType', label: 'Store type', required: true, options: [['mall_kiosk', 'Mall kiosk'], ['mall_shop', 'Mall shop'], ['high_street', 'High street'], ['standalone', 'Standalone'], ['airport', 'Airport'], ['outlet', 'Outlet']] }, { key: 'storeClassification', label: 'Store category', required: true, options: [['flagship', 'Flagship'], ['branch', 'Branch'], ['franchise', 'Franchise'], ['popup', 'Pop-up']] }, { key: 'carpetAreaSqFt', label: 'Carpet area (sq ft)', kind: 'number' }, { key: 'storeCode', label: 'Store code' }, { key: 'openingTime', label: 'Opening time', kind: 'time', required: true }, { key: 'managerName', label: 'Store manager name' }, { key: 'managerPhone', label: 'Manager mobile' },
  ] },
  { deferred: true, tag: 'Billing & Invoice Setup', title: 'Configure invoicing.', description: 'Your invoice series, GST pricing mode and round-off rule apply to every transaction.', note: 'Migrating from another system? Enter your next invoice number to continue seamlessly.', fields: [
    { key: 'invoicePrefix', label: 'Invoice series prefix', required: true }, { key: 'invoiceStartNumber', label: 'Start from number', kind: 'number', required: true }, { key: 'paymentTermsDays', label: 'Payment terms', required: true, options: [['0', 'Immediate — due on issue'], ['7', 'Net 7 days'], ['15', 'Net 15 days'], ['30', 'Net 30 days'], ['45', 'Net 45 days'], ['60', 'Net 60 days']] }, { key: 'gstPricingMode', label: 'GST pricing mode', required: true, options: [['exclusive', 'Exclusive — GST shown separately'], ['inclusive', 'Inclusive — MRP includes GST']] }, { key: 'defaultGstSlab', label: 'Default GST slab', required: true, options: [['0', 'Exempt 0%'], ['5', '5%'], ['12', '12%'], ['18', '18%'], ['28', '28%']] }, { key: 'rounding', label: 'Invoice round-off', required: true, options: [['nearest1', 'Nearest ₹1'], ['nearest50p', 'Nearest 50 paise'], ['none', 'No rounding']] }, { key: 'financialYearStart', label: 'Financial year', required: true, options: [['april', 'April (Indian FY)'], ['jan', 'January (Calendar year)']] }, yesNo('printHsn', 'Print HSN/SAC code on invoice', true), yesNo('printDuplicateCopy', 'Print duplicate copy'), yesNo('invoiceQrEnabled', 'QR code on invoice'), { key: 'invoiceFooter', label: 'Invoice footer message', kind: 'textarea' },
  ] },
  { deferred: true, tag: 'Payment Methods', title: 'How do your customers pay?', description: 'Enable the tender types your cashier can select during billing.', note: 'Gateway and terminal integrations can be connected later without changing billing workflow.', fields: [yesNo('cashEnabled', 'Accept cash payments', true), { key: 'maxCashPerTransaction', label: 'Max cash per transaction (₹)', kind: 'number' }, yesNo('upiEnabled', 'Accept UPI payments', true), { key: 'upiPartner', label: 'UPI partner', options: [['razorpay', 'Razorpay'], ['phonepe', 'PhonePe Biz'], ['bharatpe', 'BharatPe'], ['paytm', 'Paytm Biz'], ['pinelabs_upi', 'Pine Labs UPI'], ['googlepay', 'Google Pay Biz']] }, yesNo('soundBoxEnabled', 'UPI Sound Box / smart speaker'), yesNo('cardEnabled', 'Accept card payments', true), { key: 'cardProvider', label: 'Card terminal provider', options: [['pinelabs', 'Pine Labs'], ['mosambee', 'Mosambee'], ['mswipe', 'Mswipe'], ['hdfc', 'HDFC SmartHub'], ['payu', 'PayU'], ['plural', 'Plural']] }, yesNo('contactlessEnabled', 'Enable contactless / NFC tap-to-pay', true), yesNo('emiEnabled', 'EMI financing'), yesNo('giftCardEnabled', 'Gift cards & vouchers'), yesNo('storeCreditEnabled', 'Store credit / customer wallet'), { key: 'maxStoreCredit', label: 'Max store credit per customer (₹)', kind: 'number' }, yesNo('splitPaymentEnabled', 'Split payment — multiple modes in one bill', true), yesNo('advancePaymentEnabled', 'Advance / booking deposits') ] },
  { deferred: true, tag: 'Product Catalog', title: 'Set up your catalog.', description: 'Define product structure, barcode format and stock tracking rules.', note: 'Import happens after setup; this configures the defaults for every SKU.', fields: [{ key: 'skuCount', label: 'Approximate SKU count', required: true, options: [['under100', '< 100'], ['100-500', '100–500'], ['500-2000', '500–2,000'], ['2000-10000', '2,000–10,000'], ['10000plus', '10,000+']] }, { key: 'importMethod', label: 'Import method', required: true, options: [['csv', 'CSV / Excel file upload'], ['barcode', 'Barcode scan import'], ['tally', 'Import from Tally / ERP'], ['manual', 'Manual / AI catalog builder']] }, { key: 'unitOfMeasure', label: 'Default unit of measure', required: true, options: [['piece', 'Piece'], ['kg', 'Kg'], ['gram', 'Gram'], ['litre', 'Litre'], ['ml', 'Ml'], ['metre', 'Metre'], ['box', 'Box'], ['pack', 'Pack'], ['set', 'Set'], ['pair', 'Pair']] }, { key: 'barcodeFormat', label: 'Barcode format', required: true, options: [['ean13', 'EAN-13'], ['code128', 'Code-128'], ['qr', 'QR code'], ['upca', 'UPC-A'], ['internal', 'Internal auto-generate']] }, yesNo('hsnAutoLookup', 'HSN / SAC auto-lookup', true), yesNo('mrpRequired', 'MRP mandatory on all products', true), yesNo('variantTracking', 'Size & colour variant tracking', true), yesNo('batchTracking', 'Batch / Lot number tracking'), yesNo('expiryTracking', 'Expiry date tracking'), yesNo('serialTracking', 'Serial number tracking'), yesNo('serviceItemsEnabled', 'Service items (non-inventory)'), { key: 'negativeStockPolicy', label: 'Negative stock', required: true, options: [['block', 'Block sale — recommended'], ['warn', 'Warn but allow'], ['allow', 'Allow silently']] }] },
  { deferred: true, tag: 'Hardware & Devices', title: 'Set up your devices.', description: 'Prepare scanners, receipt printers, customer displays and cash drawers for each counter.', note: 'Hardware pairing is deferred until after setup where no live pairing contract exists.', fields: [{ key: 'billingCounters', label: 'Billing counters', required: true, options: [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['5plus', '5+']] }, { key: 'printerConnection', label: 'Receipt printer', required: true, options: [['cloud', 'Cloud print — WiFi'], ['lan', 'LAN / Ethernet'], ['bluetooth', 'Bluetooth'], ['none', 'No printer — digital receipts only']] }, { key: 'paperWidthMm', label: 'Paper width', options: [['58', '58 mm compact'], ['80', '80 mm standard']] }, { key: 'scannerConnection', label: 'Barcode scanner', required: true, options: [['usb', 'USB plug-and-play'], ['bluetooth', 'Bluetooth'], ['rf', 'Wireless RF'], ['none', 'No scanner']] }, { key: 'cashDrawerMode', label: 'Cash drawer', required: true, options: [['auto', 'Auto-open on payment'], ['manual', 'Manual'], ['none', 'No cash drawer']] }, { key: 'cardTerminalType', label: 'Card terminal', required: true, options: [['pinelabs', 'Pine Labs'], ['mosambee', 'Mosambee / Mswipe'], ['order', 'Order later'], ['none', 'No card terminal']] }, yesNo('customerDisplayEnabled', 'Customer-facing display'), yesNo('weighingScaleEnabled', 'Weighing / counting scale'), yesNo('labelPrinterEnabled', 'Label / price tag printer'), yesNo('kitchenDisplayEnabled', 'Kitchen Display System (KDS)')] },
  { deferred: true, tag: 'Team & Access Control', title: 'Secure your store & build your team.', description: 'Set protected-action rules and add the first staff member who will help run the store.', note: 'PINs and hardware credentials are deliberately not collected by this API.', fields: [yesNo('discountEnabled', 'Require approval for discounts', true), { key: 'discountThresholdPercent', label: 'Discount approval threshold (%)', kind: 'number', required: true }, yesNo('refundEnabled', 'Require approval for refunds', true), yesNo('voidEnabled', 'Require approval for voids', true), yesNo('settingsEnabled', 'Require approval for settings', true), { key: 'staffName', label: 'First staff full name' }, { key: 'staffPhone', label: 'First staff mobile' }, { key: 'staffEmail', label: 'First staff email', kind: 'email' }, { key: 'accessLevel', label: 'First staff role', options: [['cashier', 'Cashier'], ['senior_cashier', 'Senior Cashier'], ['floor_staff', 'Floor staff'], ['manager', 'Store Manager']] }, { key: 'defaultShift', label: 'Default shift', options: [['morning', 'Morning'], ['mid', 'Mid-day'], ['evening', 'Evening'], ['full', 'Full day']] }, { key: 'openingFloatPerCounter', label: 'Opening float per counter (₹)', kind: 'number', required: true }, { key: 'endOfDayReminder', label: 'End-of-day reminder', kind: 'time', required: true }, { key: 'autoClockOutHours', label: 'Auto clock-out after', required: true, options: [['8', '8 hours'], ['10', '10 hours'], ['12', '12 hours']] }] },
]

function emptyValues(step: number): Values { return Object.fromEntries(ONBOARDING_STEPS[step - 1].fields.filter((field) => field.kind === 'toggle').map((field) => [field.key, ['cashEnabled', 'upiEnabled', 'cardEnabled', 'printHsn', 'contactlessEnabled', 'splitPaymentEnabled', 'hsnAutoLookup', 'mrpRequired', 'variantTracking', 'discountEnabled', 'refundEnabled', 'voidEnabled', 'settingsEnabled'].includes(field.key)])) }
function serverValues(state: components['schemas']['OnboardingState'], step: number): Values { return { ...emptyValues(step), ...(state.data[step as keyof typeof state.data] as Values | undefined) } }
async function headers() { const { data: { session } } = await supabase.auth.getSession(); if (!session?.access_token) throw new Error('Your session has expired. Sign in again to continue.'); return { Authorization: `Bearer ${session.access_token}` } }

export function OnboardingWizard({ step }: { step: number }) {
  const router = useRouter(); const current = ONBOARDING_STEPS[step - 1]
  const [values, setValues] = useState<Values>(() => emptyValues(step)); const [state, setState] = useState<components['schemas']['OnboardingState'] | null>(null); const [status, setStatus] = useState<'loading' | 'saved' | 'saving' | 'error'>('loading'); const [error, setError] = useState(''); const [retry, setRetry] = useState(0)
  const [showOptional, setShowOptional] = useState(false)
  const percent = useMemo(() => Math.round((Math.min(state?.currentStep ?? 0, REQUIRED_STEP_COUNT) / REQUIRED_STEP_COUNT) * 100), [state])
  useEffect(() => { let active = true; (async () => { setStatus('loading'); try { const { data, error: apiError } = await apiClient.GET('/onboarding', { headers: await headers() }); if (apiError || !data) throw new Error('We could not load your saved setup.'); if (!active) return; const blocked = ONBOARDING_STEPS[step - 1].deferred ? !data.requiredStepsComplete : step > data.currentStep + 1; if (blocked) { router.replace(`/onboarding/${Math.max(1, Math.min(data.currentStep + 1, REQUIRED_STEP_COUNT))}`); return } setState(data); const saved = serverValues(data, step); const raw = window.sessionStorage.getItem(`${DRAFT_PREFIX}${step}`); setValues(raw ? { ...saved, ...JSON.parse(raw) } : saved); setStatus('saved') } catch (cause) { if (active) { setError(cause instanceof Error ? cause.message : 'We could not load your saved setup.'); setStatus('error') } } })(); return () => { active = false } }, [step, retry, router])
  function update(key: string, value: string | boolean) { const next = { ...values, [key]: value }; setValues(next); window.sessionStorage.setItem(`${DRAFT_PREFIX}${step}`, JSON.stringify(next)) }
  function payload() { const base = { ...values }; if (step === 1) { const selection = JSON.parse(window.sessionStorage.getItem(`${DRAFT_PREFIX}selection`) ?? '{}'); Object.assign(base, selection) } if (step === 8) { const firstStaff = base.staffName ? { name: base.staffName, phone: base.staffPhone || undefined, email: base.staffEmail || undefined, accessLevel: base.accessLevel || 'cashier', defaultShift: base.defaultShift || 'full' } : undefined; return { approvalRules: { discountEnabled: Boolean(base.discountEnabled), discountThresholdPercent: Number(base.discountThresholdPercent), refundEnabled: Boolean(base.refundEnabled), voidEnabled: Boolean(base.voidEnabled), settingsEnabled: Boolean(base.settingsEnabled) }, firstStaff, openingFloatPerCounter: Number(base.openingFloatPerCounter), endOfDayReminder: base.endOfDayReminder, autoClockOutHours: base.autoClockOutHours } } return Object.fromEntries(Object.entries(base).map(([key, value]) => [key, ['yearEstablished', 'carpetAreaSqFt', 'invoiceStartNumber', 'maxCashPerTransaction', 'maxStoreCredit'].includes(key) && value !== '' ? Number(value) : value])) }
  async function submit(event: FormEvent) { event.preventDefault(); const missing = current.fields.find((field) => field.required && (values[field.key] === '' || values[field.key] === undefined)); if (missing) { setError(`${missing.label} is required.`); return } setStatus('saving'); setError(''); try { const { data, error: apiError, response } = await apiClient.PUT('/onboarding/steps/{step}', { params: { path: { step } }, headers: await headers(), body: payload() as components['schemas']['OnboardingStepRequest'] }); if (apiError || !data) throw new Error(response.status === 409 ? 'Complete each earlier step before continuing.' : 'Couldn’t save changes. Retry saving.'); window.sessionStorage.removeItem(`${DRAFT_PREFIX}${step}`); if (step === 1) window.sessionStorage.removeItem(`${DRAFT_PREFIX}selection`); setState(data); setStatus('saved'); router.push(current.deferred ? '/app/dashboard' : step === REQUIRED_STEP_COUNT ? '/onboarding/complete' : `/onboarding/${step + 1}`) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Couldn’t save changes. Retry saving.'); setStatus('error') } }
  const primaryFields = current.fields.filter((field) => !field.secondary)
  const secondaryFields = current.fields.filter((field) => field.secondary)
  function renderField(field: Field) {
    return (
          <div key={field.key} className={`${styles.field} ${field.kind === 'toggle' || field.kind === 'textarea' ? styles.wideField : ''}`}>
            {field.kind === 'toggle' ? (
              <label className={styles.toggleField}>
                <span>
                  <strong>{field.label}</strong>
                  {field.hint && <small>{field.hint}</small>}
                </span>
                <input type="checkbox" checked={Boolean(values[field.key])} onChange={(event) => update(field.key, event.target.checked)} />
              </label>
            ) : (
              <>
                <Label htmlFor={field.key}>{field.label}{field.required ? ' *' : ''}</Label>
                {field.options ? (
                  <select id={field.key} required={field.required} value={String(values[field.key] ?? '')} onChange={(event) => update(field.key, event.target.value)}>
                    <option value="">Select an option</option>
                    {field.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                ) : field.kind === 'textarea' ? (
                  <textarea id={field.key} value={String(values[field.key] ?? '')} onChange={(event) => update(field.key, event.target.value)} />
                ) : (
                  <Input id={field.key} required={field.required} type={field.kind ?? 'text'} value={String(values[field.key] ?? '')} onChange={(event) => update(field.key, event.target.value)} />
                )}
              </>
            )}
          </div>
    )
  }
  const completeThrough = state?.currentStep ?? 0
  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>C</div>
          <strong>Couture POS</strong>
        </div>
        <p className={styles.progressLabel}>Required setup · {percent}% complete</p>
        <div className={styles.progressTrack}>
          <div className={styles.progressValue} style={{ width: `${percent}%` }} />
        </div>
        <ol className={styles.steps}>
          {ONBOARDING_STEPS.map((item, index) => {
            const number = index + 1
            const allowed = item.deferred
              ? Boolean(state?.requiredStepsComplete)
              : number <= Math.max(1, completeThrough + 1)
            const numberClass = number <= completeThrough
              ? styles.stepNumberDone
              : number === step ? styles.stepNumberCurrent : ''
            return (
              <li key={item.tag}>
                {number === REQUIRED_STEP_COUNT + 1 && (
                  <p className={styles.progressLabel}>Finish later — the till works without these</p>
                )}
                <button
                  disabled={!allowed}
                  onClick={() => router.push(`/onboarding/${number}`)}
                  className={`${styles.stepButton} ${number === step ? styles.stepActive : ''}`}
                >
                  <span className={`${styles.stepNumber} ${numberClass}`}>{String(number).padStart(2, '0')}</span>
                  <span className={styles.stepMeta}>
                    <small>Step {String(number).padStart(2, '0')}</small>
                    <strong>{item.tag}</strong>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </aside>
      <main className={styles.content}>
        <form className={styles.form} onSubmit={submit}>
          <p className={styles.eyebrow}>{current.deferred ? 'Optional' : `Step ${String(step).padStart(2, '0')} of ${REQUIRED_STEP_COUNT}`} · {current.tag}</p>
          <h1 className={styles.title}>{current.title}</h1>
          <p className={styles.description}>{current.description}</p>
          <div className={styles.note}>{current.note}</div>
          {status === 'loading' ? (
            <div className={styles.loading}>Loading your saved setup…</div>
          ) : (
            <>
              <div className={styles.status} aria-live="polite">
                {status === 'saving' ? 'Saving…' : status === 'saved' ? <span className={styles.saved}>Saved</span> : <span>Couldn’t save changes</span>}
              </div>
              {error && (
                <div className={styles.error}>
                  {error}
                  {status === 'error' && <button type="button" onClick={() => setRetry((count) => count + 1)}> Retry saving</button>}
                </div>
              )}
              <div className={styles.fields}>{primaryFields.map(renderField)}</div>
              {secondaryFields.length > 0 && (
                <>
                  <button type="button" className={styles.optionalToggle} onClick={() => setShowOptional((visible) => !visible)}>
                    {showOptional ? 'Hide' : 'Show'} {secondaryFields.length} optional {secondaryFields.length === 1 ? 'detail' : 'details'}
                  </button>
                  {showOptional && <div className={styles.fields}>{secondaryFields.map(renderField)}</div>}
                </>
              )}
              <div className={styles.actions}>
                <Button type="button" variant="outline" onClick={() => router.push(current.deferred ? '/app/dashboard' : step === 1 ? '/plans' : `/onboarding/${step - 1}`)}>← {current.deferred ? 'Dashboard' : step === 1 ? 'Plans' : 'Back'}</Button>
                <span className={styles.completion}>{current.deferred ? 'Optional — finish later' : `${percent}% of required setup`}</span>
                <Button type="submit" disabled={status === 'saving'}>{status === 'saving' ? 'Saving…' : current.deferred ? 'Save' : step === REQUIRED_STEP_COUNT ? 'Finish setup' : 'Continue →'}</Button>
              </div>
            </>
          )}
        </form>
      </main>
    </div>
  )
}
