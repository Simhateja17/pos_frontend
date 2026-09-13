'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, ReceiptText } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import {
  getAuthenticatedTaxDocuments,
  getAuthenticatedTaxInvoiceForSale,
  type TaxDocument,
  type TaxDocumentListQuery,
  type TaxDocumentSummary,
} from '@/lib/api/authenticated-client'
import { Card, CardHead, CardPad, DataTable, PageHead, SearchField, Tabs } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { TaxDocumentView } from '@/components/documents/tax-document-view'
import { MessageKey, useT } from '@/lib/i18n/i18n'
import { useAppRegion } from '@/lib/app-region'

type DocumentFilter = 'all' | 'tax_invoice' | 'credit_note'

function money(value: string, formatMoney: (value: string | number) => string): string {
  const amount = Number(value)
  return Number.isFinite(amount) ? formatMoney(amount) : value
}

function documentLabel(document: TaxDocumentSummary, labels: { credit: string; invoice: string }): string {
  return document.documentType === 'credit_note' ? labels.credit : labels.invoice
}

function buyerName(document: TaxDocumentSummary, walkIn: string): string {
  return document.buyer?.legalName ?? document.buyer?.tradeName ?? walkIn
}

/**
 * The list endpoint filters only by exact document number or customer id, so the
 * free-text search runs over the documents already loaded on this page.
 */
function matchesDocument(document: TaxDocumentSummary, query: string, labels: { credit: string; invoice: string; walkIn: string }): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [documentLabel(document, labels), buyerName(document, labels.walkIn), document.documentNumber, document.financialYear, document.grandTotal]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(needle))
}

function DocumentsPageInner() {
  const t = useT()
  const { money: formatMoney, dateLocale, appPath } = useAppRegion()
  const searchParams = useSearchParams()
  const saleId = searchParams.get('saleId')
  const [filter, setFilter] = useState<DocumentFilter>('all')
  const [search, setSearch] = useState('')
  const [documents, setDocuments] = useState<TaxDocumentSummary[]>([])
  const [selected, setSelected] = useState<TaxDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (saleId) {
        setSelected(await getAuthenticatedTaxInvoiceForSale(saleId))
        setDocuments([])
      } else {
        const query: TaxDocumentListQuery = {
          limit: 50,
          ...(filter === 'all' ? {} : { documentType: filter }),
        }
        const result = await getAuthenticatedTaxDocuments(query)
        setDocuments(result.items)
        setSelected(null)
      }
    } catch (cause) {
        setError(cause instanceof Error ? cause.message : t('documents.loadError'))
    } finally {
      setIsLoading(false)
    }
    // t is intentionally omitted: changing locale must not refetch documents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, saleId])

  useEffect(() => {
    void load()
  }, [load])

  const filterItems = (['all', 'tax_invoice', 'credit_note'] as const).map((value) => ({ value, label: t(`documents.filters.${value}` as MessageKey) }))
  const labels = { credit: t('documents.creditNote'), invoice: t('documents.taxInvoice'), walkIn: t('documents.walkIn') }
  const visibleDocuments = documents.filter((document) => matchesDocument(document, search, labels))

  if (saleId) {
    return (
      <>
        <PageHead
          title={t('documents.invoiceTitle')}
          sub={t('documents.invoiceSub')}
          actions={<Link className="btn btn-sm" href={appPath('/app/documents')}>{t('documents.back')}</Link>}
        />
        {isLoading ? <LoadingState label={t('documents.loadingInvoice')} rows={7} /> : null}
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {selected ? <TaxDocumentView document={selected} /> : null}
      </>
    )
  }

  return (
    <>
      <PageHead
        title={t('documents.title')}
        sub={t('documents.subtitle')}
      />
      <Card>
        <CardHead
          title={t('documents.listTitle')}
          sub={t('documents.listSub')}
          right={
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder={t('documents.searchPlaceholder')}
              ariaLabel={t('documents.searchLabel')}
              width={260}
            />
          }
        />
        <CardPad>
          <Tabs items={filterItems} active={filter} onSelect={setFilter} ariaLabel={t('documents.filterLabel')} disabled={isLoading} />
        </CardPad>
        {isLoading ? <LoadingState label={t('documents.loading')} /> : null}
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {!isLoading && !error && documents.length === 0 ? (
          <EmptyState
            icon={<ReceiptText size={24} strokeWidth={1.8} />}
            title={t('documents.noDocuments')}
            body={t('documents.noDocumentsBody')}
            action={<Link className="btn btn-pri" href={appPath('/app/billing')}>{t('documents.openBilling')}</Link>}
          />
        ) : null}
        {!isLoading && !error && documents.length > 0 && visibleDocuments.length === 0 ? (
          <EmptyState
            icon={<ReceiptText size={24} strokeWidth={1.8} />}
            title={t('documents.noMatch')}
            body={t('documents.noMatchBody')}
          />
        ) : null}
        {!isLoading && !error && visibleDocuments.length > 0 ? (
          <CardPad style={{ paddingTop: 0 }}>
            <DataTable cols={[t('documents.cols.document'), t('documents.cols.number'), t('documents.cols.date'), t('documents.cols.year'), t('documents.cols.customer'), t('documents.cols.total')]} minWidth={780}>
              {visibleDocuments.map((document) => (
                <tr key={document.id}>
                  <td>
                    <Link href={`/app/documents/${document.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 700 }}>
                      <FileText size={15} strokeWidth={1.8} />
                      {documentLabel(document, labels)}
                    </Link>
                  </td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{document.documentNumber}</td>
                  <td>{new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium' }).format(new Date(document.documentDate))}</td>
                  <td>{document.financialYear}</td>
                  <td>{buyerName(document, labels.walkIn)}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{money(document.grandTotal, formatMoney)}</td>
                </tr>
              ))}
            </DataTable>
          </CardPad>
        ) : null}
      </Card>
    </>
  )
}

export default function DocumentsPage() {
  const t = useT()
  return (
    <Suspense fallback={<LoadingState label={t('documents.loading')} rows={7} />}>
      <DocumentsPageInner />
    </Suspense>
  )
}
