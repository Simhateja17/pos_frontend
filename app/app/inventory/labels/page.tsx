'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useReactToPrint } from 'react-to-print'
import { Printer } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { Card, CardHead, CardPad, PageHead } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { BarcodeLabel, type BarcodeLabelFormat } from '@/components/barcode-label'
import { money } from '@/lib/region'
import { useT, type MessageKey } from '@/lib/i18n/i18n'
import { LABEL_SIZE_LIMITS, LABEL_SIZE_PRESETS, labelPageStyle, presetIdFor, useLabelSize } from '@/lib/label-sizes'

// 96 CSS px per inch; preview is capped so a 4×6in label still fits the card.
const MM_TO_PX = 96 / 25.4
const PREVIEW_MAX_WIDTH_PX = 380

type Variant = {
  id: string
  productId: string
  sku: string
  barcode: string | null
  size: string | null
  color: string | null
  material: string | null
  price: string
  reorderThreshold: number
  identityLocked: boolean
  currentStock: number
  createdAt: string
}

type Product = {
  id: string
  name: string
  category: string | null
  createdAt: string
  variants: Variant[]
}

type VariantRow = {
  variant: Variant
  productName: string
}

function variantDisplayName(row: VariantRow) {
  const attrs = [row.variant.size, row.variant.color, row.variant.material].filter(Boolean).join(' / ')
  return attrs ? `${row.productName} - ${attrs}` : row.productName
}

export default function LabelsPage() {
  return (
    <Suspense fallback={null}>
      <LabelsPageContent />
    </Suspense>
  )
}

function LabelsPageContent() {
  const t = useT()
  const searchParams = useSearchParams()
  const preselectVariantId = searchParams.get('variantId')

  const [rows, setRows] = useState<VariantRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  // The tenant's chosen symbology (0050). Null until settings load: labels
  // render in code128 meanwhile, which is what every tenant defaults to.
  const [labelFormat, setLabelFormat] = useState<BarcodeLabelFormat | null>(null)
  // Variants that could not be rendered in the chosen format and fell back to
  // CODE128. Surfaced rather than hidden: a label quietly printing a different
  // symbology than the owner selected is invented data.
  const [fellBack, setFellBack] = useState<Set<string>>(new Set())

  const noteFallback = useCallback((sku: string) => {
    setFellBack((prev) => (prev.has(sku) ? prev : new Set(prev).add(sku)))
  }, [])

  const [labelSize, setLabelSize] = useLabelSize()
  const [customOpen, setCustomOpen] = useState(false)
  const activePresetId = customOpen ? null : presetIdFor(labelSize)
  const previewZoom = Math.min(2, PREVIEW_MAX_WIDTH_PX / (labelSize.widthMm * MM_TO_PX))

  const contentRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({ contentRef, pageStyle: labelPageStyle(labelSize) })

  function setCustomDimension(key: 'widthMm' | 'heightMm', raw: string) {
    const value = Number(raw)
    if (!Number.isFinite(value)) return
    setLabelSize({ ...labelSize, [key]: value })
  }

  const loadVariants = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    const headers = await authHeaders()
    const { data, error } = await apiClient.GET('/products', { headers })

    setIsLoading(false)

    if (error || !data) {
      setLoadError(t('inventory.errors.catalogLoad'))
      return
    }

    const products = data as Product[]
    const flat: VariantRow[] = products.flatMap((product) =>
      product.variants.map((variant) => ({ variant, productName: product.name })),
    )
    setRows(flat)
    // t is intentionally omitted: changing locale must not refetch variants.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadLabelFormat = useCallback(async () => {
    const { data } = await apiClient.GET('/settings', { headers: await authHeaders() })
    // A settings failure must not block label printing: fall back to the
    // same code128 default the column itself carries.
    setLabelFormat(((data as { barcodeLabelFormat?: BarcodeLabelFormat } | undefined)
      ?.barcodeLabelFormat) ?? 'code128')
  }, [])

  useEffect(() => {
    loadVariants()
    void loadLabelFormat()
  }, [loadVariants, loadLabelFormat])

  // A format change invalidates which variants fell back.
  useEffect(() => {
    setFellBack(new Set())
  }, [labelFormat])

  useEffect(() => {
    if (preselectVariantId) {
      setSelectedIds(new Set([preselectVariantId]))
    }
  }, [preselectVariantId])

  function toggleSelected(variantId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(variantId)) next.delete(variantId)
      else next.add(variantId)
      return next
    })
  }

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => {
      const haystack = [
        row.productName,
        row.variant.sku,
        row.variant.barcode ?? '',
        row.variant.size ?? '',
        row.variant.color ?? '',
        row.variant.material ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [rows, query])

  const selectedRows = useMemo(() => rows.filter((row) => selectedIds.has(row.variant.id)), [rows, selectedIds])
  const formatLabel = (format: BarcodeLabelFormat) => t(`inventory.labels.${format === 'qr' ? 'qr' : format}` as MessageKey)

  return (
    <>
      <PageHead
        title={t('inventory.labels.title')}
        sub={t('inventory.labels.subtitle')}
        actions={
          <button className="btn btn-pri" disabled={selectedRows.length === 0} onClick={() => handlePrint()}>
            <Printer size={15} /> {t('inventory.labels.print')}
          </button>
        }
      />

      <Card>
        <CardHead title={t('inventory.newProduct.variants')} sub={rows.length > 0 ? `${rows.length} ${rows.length === 1 ? t('inventory.labels.variantsOne') : t('inventory.labels.variantsMany')}` : undefined} />

        {!isLoading && !loadError && rows.length > 0 && (
          <CardPad style={{ paddingBottom: 0 }}>
            <input
              type="search"
              className="fld-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('inventory.labels.searchPlaceholder')}
              style={{ width: '100%' }}
            />
          </CardPad>
        )}

        {isLoading && <LoadingState label={t('inventory.labels.loading')} />}
        {!isLoading && loadError && <ErrorState message={loadError} onRetry={() => void loadVariants()} />}
        {!isLoading && !loadError && rows.length === 0 && (
          <EmptyState title={t('inventory.labels.emptyTitle')} body={t('inventory.labels.emptyBody')} />
        )}
        {!isLoading && !loadError && rows.length > 0 && filteredRows.length === 0 && (
          <CardPad>
            <p className="t-sub">{t('inventory.labels.noSearchResults', { query })}</p>
          </CardPad>
        )}
        {!isLoading && !loadError && filteredRows.length > 0 && (
          <CardPad style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
            {filteredRows.map((row) => (
              <label
                key={row.variant.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  minHeight: 44,
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(row.variant.id)}
                  onChange={() => toggleSelected(row.variant.id)}
                  style={{ width: 18, height: 18 }}
                />
                <span>{variantDisplayName(row)}</span>
                <span className="t-sub">{row.variant.sku}</span>
              </label>
            ))}
          </CardPad>
        )}
      </Card>

      <Card>
        <CardHead
          title={t('inventory.labels.preview')}
          sub={labelFormat ? t('inventory.labels.printingAs', { format: formatLabel(labelFormat) }) : undefined}
        />
        <CardPad>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', marginBottom: 8 }}>
            <label className="fld" style={{ marginBottom: 0, minWidth: 220 }}>
              <span>{t('inventory.labels.labelSize')}</span>
              <select
                value={activePresetId ?? 'custom'}
                onChange={(e) => {
                  const preset = LABEL_SIZE_PRESETS.find((p) => p.id === e.target.value)
                  setCustomOpen(!preset)
                  if (preset) setLabelSize(preset.size)
                }}
              >
                {LABEL_SIZE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="custom">{t('inventory.labels.customSize')}</option>
              </select>
            </label>
            {activePresetId === null && (
              <>
                <label className="fld" style={{ marginBottom: 0, width: 120 }}>
                  <span>{t('inventory.labels.widthMm')}</span>
                  <input
                    type="number"
                    min={LABEL_SIZE_LIMITS.min}
                    max={LABEL_SIZE_LIMITS.max}
                    value={labelSize.widthMm}
                    onChange={(e) => setCustomDimension('widthMm', e.target.value)}
                  />
                </label>
                <label className="fld" style={{ marginBottom: 0, width: 120 }}>
                  <span>{t('inventory.labels.heightMm')}</span>
                  <input
                    type="number"
                    min={LABEL_SIZE_LIMITS.min}
                    max={LABEL_SIZE_LIMITS.max}
                    value={labelSize.heightMm}
                    onChange={(e) => setCustomDimension('heightMm', e.target.value)}
                  />
                </label>
              </>
            )}
          </div>
          <p className="t-sub" style={{ marginBottom: 16 }}>{t('inventory.labels.labelSizeHint')}</p>
          {selectedRows.length === 0 ? (
            <p className="t-sub">{t('inventory.labels.selectHint')}</p>
          ) : (
            <>
              {fellBack.size > 0 && labelFormat && (
                <p className="t-sub" style={{ marginBottom: 12 }}>
                  {t(fellBack.size === 1 ? 'inventory.labels.fallbackOne' : 'inventory.labels.fallbackMany', { count: fellBack.size, format: formatLabel(labelFormat) })}
                </p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
                {selectedRows.map((row) => (
                  <div key={row.variant.id} style={{ zoom: previewZoom, outline: '1px dashed var(--border)' }}>
                    <BarcodeLabel
                      sku={row.variant.sku}
                      name={variantDisplayName(row)}
                      price={money(row.variant.price)}
                      barcode={row.variant.barcode}
                      format={labelFormat ?? 'code128'}
                      size={labelSize}
                      onFallback={noteFallback}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </CardPad>
      </Card>

      {/* Actual printable content: natural (1x) scale, hidden on screen via sr-only,
          made visible in @media print via globals.css's .label-sheet rules. Kept in
          the DOM at all times so contentRef always has content to print. */}
      <div ref={contentRef} className="label-sheet sr-only">
        {selectedRows.map((row) => (
          <BarcodeLabel
            key={row.variant.id}
            sku={row.variant.sku}
            name={variantDisplayName(row)}
            price={money(row.variant.price)}
            barcode={row.variant.barcode}
            format={labelFormat ?? 'code128'}
            size={labelSize}
          />
        ))}
      </div>
    </>
  )
}
