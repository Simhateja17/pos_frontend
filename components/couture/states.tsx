'use client'

/**
 * Shared read-states for India screens, styled to the Ambel design system.
 *
 * Phase 3.2 rule (ROADMAP criterion 4): a screen with no backend contract, or
 * a metric the server reports as unavailable, must say so plainly. It must
 * never render a preview row, fake total, or simulated success. These
 * components make that honest state look deliberate rather than broken.
 */
import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { AlertTriangle, Inbox, Loader2, PackageOpen } from 'lucide-react'
import { Card, CardPad, PageHead } from './ui'

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode
  title: string
  body?: ReactNode
  action?: ReactNode
}) {
  return (
    <div style={{ padding: '46px 24px', textAlign: 'center' }}>
      <div
        style={{
          width: 54,
          height: 54,
          margin: '0 auto 14px',
          borderRadius: 15,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--brand-soft)',
          color: 'var(--brand-1)',
        }}
      >
        {icon ?? <Inbox size={24} strokeWidth={1.8} />}
      </div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, letterSpacing: '-.01em' }}>{title}</div>
      {body ? (
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 5, maxWidth: 420, marginInline: 'auto', lineHeight: 1.5 }}>
          {body}
        </div>
      ) : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: ReactNode; onRetry: () => void }) {
  return (
    <div role="alert" style={{ padding: '34px 24px', textAlign: 'center' }}>
      <div
        style={{
          width: 54,
          height: 54,
          margin: '0 auto 14px',
          borderRadius: 15,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--danger-soft)',
          color: 'var(--danger)',
        }}
      >
        <AlertTriangle size={24} strokeWidth={1.8} />
      </div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700 }}>We couldn’t load these records</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 5, maxWidth: 460, marginInline: 'auto' }}>{message}</div>
      <button className="btn btn-sm" style={{ marginTop: 14 }} onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

/** Skeleton rows that keep the table's rhythm while loading. */
export function LoadingState({ label = 'Loading records', rows = 5 }: { label?: string; rows?: number }) {
  return (
    <div aria-label={label} aria-busy="true" style={{ padding: '14px 16px' }}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="sk"
          style={{
            height: 42,
            borderRadius: 9,
            marginBottom: 8,
            background: 'linear-gradient(90deg,#F1F3F5 25%,#E9ECEF 37%,#F1F3F5 63%)',
            backgroundSize: '400% 100%',
            animation: 'shimmer 1.3s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  )
}

// --kpi-cols, not an inline grid-template — see the note on KpiRow in ui.tsx.
export function KpiSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="kpi-row" style={{ '--kpi-cols': cols } as CSSProperties} aria-busy="true">
      {Array.from({ length: cols }, (_, i) => (
        <div key={i} className="kpi">
          <div
            style={{
              height: 58,
              borderRadius: 8,
              background: 'linear-gradient(90deg,#F1F3F5 25%,#E9ECEF 37%,#F1F3F5 63%)',
              backgroundSize: '400% 100%',
              animation: 'shimmer 1.3s ease-in-out infinite',
            }}
          />
        </div>
      ))}
    </div>
  )
}

/**
 * Value shown for a metric the server explicitly reports as unavailable.
 * Deliberately quiet — an unavailable metric must not read as a real figure.
 */
export function UnavailableValue({ reason, text = 'Not tracked yet' }: { reason?: string; text?: string }) {
  return (
    <span title={reason} style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 600, color: 'var(--muted-2)' }}>
      {text}
    </span>
  )
}

/** Full-page state for modules with no Phase 1-3 backend contract. */
export function UnavailableModulePage({ title, sub, capability }: { title: string; sub?: string; capability?: string }) {
  return (
    <>
      <PageHead title={title} sub={sub ?? 'Not available in this build'} />
      <Card>
        <CardPad>
          <EmptyState
            icon={<PackageOpen size={24} strokeWidth={1.8} />}
            title={`${title} isn’t enabled yet`}
            body={
              <>
                {capability ?? 'This module'} has no backend contract in the current build, so there is nothing real to
                show here. Rather than display sample records, this screen stays empty until the capability ships.
              </>
            }
            action={
              <Link className="btn btn-pri" href="/app/dashboard">
                Back to dashboard
              </Link>
            }
          />
        </CardPad>
      </Card>
    </>
  )
}

export function InlineLoader({ label }: { label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--muted)', fontSize: 13 }}>
      <Loader2 size={14} className="spin" /> {label}
    </span>
  )
}
