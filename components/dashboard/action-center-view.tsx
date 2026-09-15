'use client'

import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { AuthenticatedRequestError, getAuthenticatedDashboard, type Dashboard } from '@/lib/api/authenticated-client'
import { Card, CardPad, PageHead } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { ActionableItemRow } from '@/components/dashboard/action-center-row'
import { useT } from '@/lib/i18n/i18n'

export function ActionCenterView() {
  const t = useT()
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setDashboard(await getAuthenticatedDashboard('7d'))
    } catch (cause) {
      setError(cause instanceof AuthenticatedRequestError ? cause.message : t('dashboard.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const items = dashboard?.actionable.items ?? []

  return (
    <>
      <PageHead title={t('dashboard.actions.title')} sub={t('dashboard.actions.sub')} />

      <Card>
        {loading && <LoadingState label={t('dashboard.loading')} />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            icon={<AlertCircle size={24} strokeWidth={1.8} />}
            title={t('dashboard.actions.emptyTitle')}
            body={t('dashboard.actions.emptyBody')}
          />
        )}
        {!loading && !error && items.length > 0 && (
          <CardPad style={{ paddingTop: 4 }}>
            {items.map((item) => (
              <ActionableItemRow key={item.type === 'low_stock' ? item.variantId : item.shiftId} item={item} />
            ))}
          </CardPad>
        )}
      </Card>
    </>
  )
}
