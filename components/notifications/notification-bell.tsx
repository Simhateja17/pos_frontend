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

/**
 * Top-bar bell. Opening the panel marks every unread notification read (V1's
 * only read-state transition — no per-item mark-as-read, per the decision to
 * keep this a lightweight tray rather than a full inbox).
 */
export function NotificationBell() {
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

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="tb-icon"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        onClick={() => void toggle()}
        style={{ position: 'relative', border: 0, background: 'none', cursor: 'pointer' }}
      >
        <Bell size={18} strokeWidth={1.85} />
        {unread > 0 && <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Notifications">
          <div className={styles.panelHead}>Notifications</div>
          {recent.length === 0 ? (
            <div className={styles.empty}>Nothing yet. You're all caught up.</div>
          ) : (
            recent.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? '/app/notifications'}
                className={styles.item}
                onClick={() => setOpen(false)}
              >
                <div className={styles.itemTitle}>{n.title}</div>
                <div className={styles.itemBody}>{n.body}</div>
              </Link>
            ))
          )}
          <Link href="/app/notifications" className={styles.viewAll} onClick={() => setOpen(false)}>
            View all
          </Link>
        </div>
      )}
    </div>
  )
}
