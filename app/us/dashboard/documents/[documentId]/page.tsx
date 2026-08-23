/*
 * US edition mirror of app/app/documents/[documentId]/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { FileText } from 'lucide-react'
import {
  getAuthenticatedCreditNotes,
  getAuthenticatedTaxDocument,
  type TaxDocument,
  type TaxDocumentSummary,
} from '@/lib/api/authenticated-client'
import { Card, CardHead, CardPad, PageHead } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { TaxDocumentView } from '@/components/documents/tax-document-view'

export default function TaxDocumentDetailPage() {
  const params = useParams<{ documentId: string }>()
  const documentId = params.documentId
  const [document, setDocument] = useState<TaxDocument | null>(null)
  const [creditNotes, setCreditNotes] = useState<TaxDocumentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getAuthenticatedTaxDocument(documentId)
      setDocument(result)
      if (result.documentType === 'tax_invoice') {
        setCreditNotes(await getAuthenticatedCreditNotes(result.id))
      } else {
        setCreditNotes([])
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'GST document could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <>
      <PageHead
        title={document?.documentType === 'credit_note' ? 'Credit note' : 'Tax Invoice'}
        sub="Immutable document snapshot"
        actions={<Link className="btn btn-sm" href="/app/documents">Back to documents</Link>}
      />
      {isLoading ? <LoadingState label="Loading GST document" rows={8} /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {document ? <TaxDocumentView document={document} /> : null}

      {document?.documentType === 'tax_invoice' ? (
        <Card style={{ marginTop: 18 }}>
          <CardHead title="Linked credit notes" sub="Returns reference this Tax Invoice without rewriting it." />
          <CardPad>
            {creditNotes.length === 0 ? (
              <EmptyState title="No credit notes linked" body="A partial return will create a credit note here after the refund commits." />
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {creditNotes.map((creditNote) => (
                  <Link
                    key={creditNote.id}
                    href={`/app/documents/${creditNote.id}`}
                    className="lrow"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    <span className="lico b-green"><FileText size={16} /></span>
                    <span style={{ flex: 1 }}>
                      <span className="lt">{creditNote.documentNumber}</span>
                      <span className="ls">{new Date(creditNote.documentDate).toLocaleDateString('en-IN')} · ₹{creditNote.grandTotal}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardPad>
        </Card>
      ) : null}
    </>
  )
}
