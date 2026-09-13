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
import { useT } from '@/lib/i18n/i18n'
import { useAppRegion } from '@/lib/app-region'

export default function TaxDocumentDetailPage() {
  const t = useT()
  const { dateLocale, appPath, money } = useAppRegion()
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
      setError(cause instanceof Error ? cause.message : t('documents.loadError'))
    } finally {
      setIsLoading(false)
    }
    // t is intentionally omitted: changing locale must not refetch this document.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <>
      <PageHead
        title={document?.documentType === 'credit_note' ? t('documents.creditNote') : t('documents.invoiceTitle')}
        sub={t('documents.detailSub')}
        actions={<Link className="btn btn-sm" href={appPath('/app/documents')}>{t('documents.back')}</Link>}
      />
      {isLoading ? <LoadingState label={t('documents.detailLoading')} rows={8} /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {document ? <TaxDocumentView document={document} /> : null}

      {document?.documentType === 'tax_invoice' ? (
        <Card style={{ marginTop: 18 }}>
          <CardHead title={t('documents.linkedTitle')} sub={t('documents.linkedSub')} />
          <CardPad>
            {creditNotes.length === 0 ? (
              <EmptyState title={t('documents.noLinked')} body={t('documents.noLinkedBody')} />
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {creditNotes.map((creditNote) => (
                  <Link
                    key={creditNote.id}
                    href={appPath(`/app/documents/${creditNote.id}`)}
                    className="lrow"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    <span className="lico b-green"><FileText size={16} /></span>
                    <span style={{ flex: 1 }}>
                      <span className="lt">{creditNote.documentNumber}</span>
                      <span className="ls">{new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium' }).format(new Date(creditNote.documentDate))} · {money(creditNote.grandTotal)}</span>
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
