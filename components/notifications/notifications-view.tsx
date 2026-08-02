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

/** "just now" / "12m ago" / "3h ago" / "2d ago" — enough resolution for a notification tray. */
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function NotificationsView() {
  const [list, setList] = useState<NotificationList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getAuthenticatedNotifications()
      setList(data)
      // Opening this page is also "opening the notification surface" — same
      // mark-all-read semantics as the bell dropdown.
      if (data.unreadCount > 0) {
        await markAuthenticatedNotificationsRead()
        setList({ ...data, unreadCount: 0, notifications: data.notifications.map((n) => ({ ...n, read: true })) })
      }
    } catch (cause) {
      setError(
        cause instanceof AuthenticatedRequestError
          ? cause.message
          : 'We couldn’t load your notifications right now.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <>
      <PageHead title="Notifications" sub="Things that happened while you were away" />

      <Card>
        {loading && <LoadingState label="Loading notifications" />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && list && list.notifications.length === 0 && (
          <EmptyState
            icon={<Bell size={24} strokeWidth={1.8} />}
            title="Nothing yet"
            body="Purchase orders, low-stock alerts and setup reminders will show up here as they happen."
          />
        )}
        {!loading && !error && list && list.notifications.length > 0 && (
          <div style={{ padding: '4px 0' }}>
            {list.notifications.map((n) => {
              const Icon = ICON_BY_TYPE[n.type]
              const row = (
                <ListRow
                  key={n.id}
                  icon={<Icon size={17} strokeWidth={1.85} />}
                  tone={TONE_BY_TYPE[n.type]}
                  title={n.title}
                  sub={`${n.body} · ${relativeTime(n.createdAt)}`}
                />
              )
              return n.link ? (
                <Link key={n.id} href={n.link} style={{ textDecoration: 'none', color: 'inherit' }}>
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
