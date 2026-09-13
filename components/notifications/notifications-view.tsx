'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Boxes, Rocket, UserCheck, Warehouse } from 'lucide-react'
import {
  AuthenticatedRequestError,
  getAuthenticatedNotifications,
  markAuthenticatedNotificationsRead,
  type NotificationList,
} from '@/lib/api/authenticated-client'
import { Card, ListRow, PageHead } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { type Translate, useT } from '@/lib/i18n/i18n'
import { useAppRegion } from '@/lib/app-region'

type NotificationType = NotificationList['notifications'][number]['type']

const ICON_BY_TYPE: Record<NotificationType, typeof Bell> = {
  business_type_unset: Rocket,
  po_received: Warehouse,
  staff_activated: UserCheck,
  stock_low: Boxes,
}

const TONE_BY_TYPE: Record<NotificationType, 'blue' | 'green' | 'amber'> = {
  business_type_unset: 'blue',
  po_received: 'green',
  staff_activated: 'blue',
  stock_low: 'amber',
}

/** "just now" / "12m ago" / "3h ago" / "2d ago": enough resolution for a notification tray. */
function relativeTime(iso: string, t: Translate): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return t('notifications.justNow')
  if (minutes < 60) return t('notifications.minutesAgo', { count: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('notifications.hoursAgo', { count: hours })
  return t('notifications.daysAgo', { count: Math.floor(hours / 24) })
}

export function NotificationsView() {
  const t = useT()
  const { appPath } = useAppRegion()
  const [list, setList] = useState<NotificationList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getAuthenticatedNotifications()
      setList(data)
      // Opening this page is also "opening the notification surface": same
      // mark-all-read semantics as the bell dropdown.
      if (data.unreadCount > 0) {
        await markAuthenticatedNotificationsRead()
        setList({ ...data, unreadCount: 0, notifications: data.notifications.map((n) => ({ ...n, read: true })) })
      }
    } catch (cause) {
      setError(
        cause instanceof AuthenticatedRequestError
          ? cause.message
          : t('notifications.unavailable'),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // t is intentionally omitted: changing locale must not refetch notifications.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <PageHead title={t('notifications.title')} sub={t('notifications.subtitle')} />

      <Card>
        {loading && <LoadingState label={t('notifications.loading')} />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && list && list.notifications.length === 0 && list.dailyDigest.length === 0 && (
          <EmptyState
            icon={<Bell size={24} strokeWidth={1.8} />}
            title={t('notifications.emptyTitle')}
            body={t('notifications.emptyBody')}
          />
        )}
        {!loading && !error && list && (list.notifications.length > 0 || list.dailyDigest.length > 0) && (
          <div style={{ padding: '4px 0' }}>
            {list.dailyDigest.map((digest) => (
              <ListRow
                key={`${digest.date}:${digest.storeId}`}
                icon={<Boxes size={17} strokeWidth={1.85} />}
                tone="amber"
                title={t('notifications.digestTitle', { store: digest.storeName, date: digest.date })}
                sub={t('notifications.digestSub', { count: `${digest.totalCount} ${digest.totalCount === 1 ? t('notifications.alertsOne') : t('notifications.alertsMany')}`, titles: digest.sampleTitles.join(', ') })}
              />
            ))}
            {list.notifications.map((n) => {
              const Icon = ICON_BY_TYPE[n.type]
              const row = (
                <ListRow
                  key={n.id}
                  icon={<Icon size={17} strokeWidth={1.85} />}
                  tone={TONE_BY_TYPE[n.type]}
                  title={n.title}
                  sub={t('notifications.rowSub', { body: n.body, time: relativeTime(n.createdAt, t) })}
                />
              )
              return n.link ? (
                <Link key={n.id} href={appPath(n.link)} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {row}
                </Link>
              ) : (
                row
              )
            })}
          </div>
        )}
      </Card>
    </>
  )
}
