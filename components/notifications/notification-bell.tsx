'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import {
  getAuthenticatedNotifications,
  markAuthenticatedNotificationsRead,
  type NotificationList,
} from '@/lib/api/authenticated-client'
import styles from './notification-bell.module.css'
import { useT } from '@/lib/i18n/i18n'
import { useAppRegion } from '@/lib/app-region'

/**
 * Top-bar bell. Opening the panel marks every unread notification read (V1's
 * only read-state transition: no per-item mark-as-read, per the decision to
 * keep this a lightweight tray rather than a full inbox).
 */
export function NotificationBell() {
  const t = useT()
  const { appPath } = useAppRegion()
  const [list, setList] = useState<NotificationList | null>(null)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAuthenticatedNotifications()
      .then(setList)
      .catch(() => {
        // A failed background fetch must not disrupt the rest of the shell.
      })
  }, [])

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next && list && list.unreadCount > 0) {
      await markAuthenticatedNotificationsRead()
      setList({ ...list, unreadCount: 0, notifications: list.notifications.map((n) => ({ ...n, read: true })) })
    }
  }

  const unread = list?.unreadCount ?? 0
  const recent = list?.notifications.slice(0, 6) ?? []
  const digests = list?.dailyDigest.slice(0, 3) ?? []

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="tb-icon"
        aria-label={unread > 0 ? t('shell.bell.unread', { count: unread }) : t('shell.bell.notifications')}
        onClick={() => void toggle()}
        style={{ position: 'relative', border: 0, background: 'none', cursor: 'pointer' }}
      >
        <Bell size={18} strokeWidth={1.85} />
        {unread > 0 && <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label={t('shell.bell.notifications')}>
          <div className={styles.panelHead}>{t('shell.bell.notifications')}</div>
          {recent.length === 0 && digests.length === 0 ? (
            <div className={styles.empty}>{t('shell.bell.empty')}</div>
          ) : (
            <>
            {digests.map((digest) => (
              <Link
                key={`${digest.date}:${digest.storeId}`}
                href="/app/notifications"
                className={styles.item}
                onClick={() => setOpen(false)}
              >
                <div className={styles.itemTitle}>{digest.storeName} · {digest.date}</div>
                <div className={styles.itemBody}>
                  {digest.totalCount === 1 ? t('shell.bell.alertCountOne') : t('shell.bell.alertCount', { count: digest.totalCount })} · {digest.sampleTitles.join(', ')}
                </div>
              </Link>
            ))}
            {recent.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? '/app/notifications'}
                className={styles.item}
                onClick={() => setOpen(false)}
              >
                <div className={styles.itemTitle}>{n.title}</div>
                <div className={styles.itemBody}>{n.body}</div>
              </Link>
            ))}
            </>
          )}
          <Link href={appPath('/app/notifications')} className={styles.viewAll} onClick={() => setOpen(false)}>
            {t('shell.bell.viewAll')}
          </Link>
        </div>
      )}
    </div>
  )
}
