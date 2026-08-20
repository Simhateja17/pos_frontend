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

type DocumentFilter = 'all' | 'tax_invoice' | 'credit_note'

const FILTERS = [
  { label: 'All documents', value: 'all' as const },
  { label: 'Tax invoices', value: 'tax_invoice' as const },
  { label: 'Credit notes', value: 'credit_note' as const },
]

function money(value: string): string {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : `₹${value}`
}

function documentLabel(document: TaxDocumentSummary): string {
  return document.documentType === 'credit_note' ? 'Credit note' : 'Tax invoice'
}

function buyerName(document: TaxDocumentSummary): string {
  return document.buyer?.legalName ?? document.buyer?.tradeName ?? 'Walk-in customer'
}

/**
 * The list endpoint filters only by exact document number or customer id, so the
 * free-text search runs over the documents already loaded on this page.
 */
function matchesDocument(document: TaxDocumentSummary, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [documentLabel(document), buyerName(document), document.documentNumber, document.financialYear, document.grandTotal]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(needle))
}

function DocumentsPageInner() {
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
      setError(cause instanceof Error ? cause.message : 'GST documents could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }, [filter, saleId])

  useEffect(() => {
    void load()
  }, [load])

  const visibleDocuments = documents.filter((document) => matchesDocument(document, search))

  if (saleId) {
    return (
      <>
        <PageHead
          title="Tax Invoice"
          sub="This document is created from the completed sale and remains unchanged if catalogue or customer data changes later."
          actions={<Link className="btn btn-sm" href="/app/documents">Back to documents</Link>}
        />
        {isLoading ? <LoadingState label="Loading Tax Invoice" rows={7} /> : null}
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {selected ? <TaxDocumentView document={selected} /> : null}
      </>
    )
  }

  return (
    <>
      <PageHead
        title="GST Documents"
        sub="Immutable tax invoices and return-linked credit notes for the stores you can access."
      />
      <Card>
        <CardHead
          title="Document register"
          sub="Numbers, tax values, and payment modes come from the stored document snapshot."
          right={
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Search customer or document no…"
              ariaLabel="Search GST documents"
              width={260}
            />
          }
        />
        <CardPad>
          <Tabs items={FILTERS} active={filter} onSelect={setFilter} ariaLabel="Filter GST documents" disabled={isLoading} />
        </CardPad>
        {isLoading ? <LoadingState label="Loading GST documents" /> : null}
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {!isLoading && !error && documents.length === 0 ? (
          <EmptyState
            icon={<ReceiptText size={24} strokeWidth={1.8} />}
            title="No GST documents yet"
            body="Complete a sale to create its Tax Invoice. A credit note appears here after a return is processed."
            action={<Link className="btn btn-pri" href="/app/billing">Open billing</Link>}
          />
        ) : null}
        {!isLoading && !error && documents.length > 0 && visibleDocuments.length === 0 ? (
          <EmptyState
            icon={<ReceiptText size={24} strokeWidth={1.8} />}
            title="No documents match this search"
            body="Only the documents loaded here are searched. Clear the search or switch tabs to look further back."
          />
        ) : null}
        {!isLoading && !error && visibleDocuments.length > 0 ? (
          <CardPad style={{ paddingTop: 0 }}>
            <DataTable cols={['Document', 'Number', 'Date', 'Financial year', 'Customer', { label: 'Total', align: 'right' }]} minWidth={780}>
              {visibleDocuments.map((document) => (
                <tr key={document.id}>
                  <td>
                    <Link href={`/app/documents/${document.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 700 }}>
                      <FileText size={15} strokeWidth={1.8} />
                      {documentLabel(document)}
                    </Link>
                  </td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{document.documentNumber}</td>
                  <td>{new Date(document.documentDate).toLocaleDateString('en-IN')}</td>
                  <td>{document.financialYear}</td>
                  <td>{buyerName(document)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 700 }}>{money(document.grandTotal)}</td>
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
  return (
    <Suspense fallback={<LoadingState label="Loading GST documents" rows={7} />}>
      <DocumentsPageInner />
    </Suspense>
  )
}
