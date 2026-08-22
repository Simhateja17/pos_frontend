import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { AlertTriangle, Inbox, Loader2, PackageOpen } from 'lucide-react'

export function UsPageHead({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-head anim-up">
      <div className="page-head-left">
        <h2>{title}</h2>
        {sub ? <p>{sub}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  )
}

export function UsCard({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={`card ${className}`} style={style}>{children}</div>
}

export function UsCardHeader({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="card-header">
      <div className="card-header-left">
        <h3>{title}</h3>
        {sub ? <p>{sub}</p> : null}
      </div>
      {right}
    </div>
  )
}

export function UsCardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card-body ${className}`}>{children}</div>
}

export type UsKpi = { label: string; value: ReactNode; meta?: ReactNode; href?: string }

export function UsKpiGrid({ items }: { items: UsKpi[] }) {
  return (
    <div className="kpi-grid">
      {items.map((item) => {
        const body = (
          <>
            <div className="kpi-top"><span className="kpi-label">{item.label}</span></div>
            <div className="kpi-value num">{item.value}</div>
            <div className="kpi-meta">{item.meta ?? ''}</div>
          </>
        )
        return item.href ? <Link key={item.label} href={item.href} className="kpi-card">{body}</Link> : <div key={item.label} className="kpi-card">{body}</div>
      })}
    </div>
  )
}

export function UsTable({ columns, children, minWidth = 640 }: { columns: string[]; children: ReactNode; minWidth?: number }) {
  return (
    <div className="table-wrap">
      <table className="dtable" style={{ minWidth }}>
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function UsEmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="us-state">
      <div className="us-state-icon">{icon ?? <Inbox size={24} strokeWidth={1.8} />}</div>
      <div className="us-state-title">{title}</div>
      {body ? <div className="us-state-body">{body}</div> : null}
      {action ? <div className="us-state-action">{action}</div> : null}
    </div>
  )
}

export function UsErrorState({ message, onRetry }: { message: ReactNode; onRetry: () => void }) {
  return (
    <div className="us-state" role="alert">
      <div className="us-state-icon error"><AlertTriangle size={24} strokeWidth={1.8} /></div>
      <div className="us-state-title">We couldn’t load these records</div>
      <div className="us-state-body">{message}</div>
      <div className="us-state-action"><button type="button" className="btn btn-sm" onClick={onRetry}>Retry</button></div>
    </div>
  )
}

export function UsLoadingState({ label = 'Loading records', rows = 5 }: { label?: string; rows?: number }) {
  return (
    <div className="us-loading" aria-label={label} aria-busy="true">
      {Array.from({ length: rows }, (_, index) => <div key={index} className="us-skeleton" />)}
    </div>
  )
}

export function UsUnavailableValue({ reason, text = 'Unavailable' }: { reason?: string; text?: string }) {
  return <span className="unavailable-value" title={reason}>{text}</span>
}

export function UsUnavailableModulePage({ title, sub, capability }: { title: string; sub?: string; capability: string }) {
  return (
    <>
      <UsPageHead title={title} sub={sub ?? 'Not available in this build'} />
      <UsCard>
        <UsEmptyState
          icon={<PackageOpen size={24} strokeWidth={1.8} />}
          title={`${title} isn’t enabled yet`}
          body={<>{capability} has no backend contract in the current build, so there is nothing real to show here. This screen stays explicit until the capability ships.</>}
          action={<Link className="btn btn-primary" href="/us/dashboard">Back to dashboard</Link>}
        />
      </UsCard>
    </>
  )
}

export function UsInlineLoader({ label }: { label: string }) {
  return <span className="inline-loader"><Loader2 size={14} className="spin" />{label}</span>
}
