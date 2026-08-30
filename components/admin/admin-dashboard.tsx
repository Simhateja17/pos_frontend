'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import styles from './admin.module.css'
import {
  AdminApiError,
  activateAdmin,
  adminLogout,
  createEntitlementOverride,
  createSupportRequest,
  getAdminAudit,
  getAdminContext,
  getAdminOverview,
  getAdminTeam,
  getAdminTenant,
  inviteAdmin,
  listRecentAdminTenants,
  listSupportRequests,
  resetAdminMfa,
  resendMerchantInvitation,
  revokeMerchantSessions,
  searchAdminTenants,
  startSupportSession,
  suspendAdmin,
  terminateSupportSession,
  retryAdminOperation,
  type AdminContext,
  type AdminOverview,
  type AdminRole,
  type AdminTenantListResult,
  type TenantDetail,
} from '@/lib/admin-api'

type View = 'overview' | 'businesses' | 'users' | 'subscriptions' | 'support' | 'operations' | 'audit' | 'team' | 'settings'

const NAV: Array<{ id: View; label: string; group?: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'businesses', label: 'Businesses', group: 'Diagnostics' },
  { id: 'users', label: 'Users' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'support', label: 'Support', group: 'Safe operations' },
  { id: 'operations', label: 'Operations' },
  { id: 'audit', label: 'Audit log', group: 'Governance' },
  { id: 'team', label: 'Admin team' },
  { id: 'settings', label: 'Settings' },
]

function errorMessage(error: unknown, fallback = 'The regional Admin Panel could not complete that request.') {
  if (error instanceof AdminApiError && error.message) return error.message
  return error instanceof Error ? error.message : fallback
}

function dateLabel(value: unknown) {
  if (!value) return '—'
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

function statusClass(value: unknown) {
  const status = String(value ?? '').toLowerCase()
  if (['active', 'approved', 'replayed'].includes(status)) return styles.badgeGreen
  if (['failed', 'suspended', 'denied', 'expired', 'terminated', 'cancelled'].includes(status)) return styles.badgeRed
  return styles.badgeAmber
}

function Badge({ value }: { value: unknown }) {
  return <span className={`${styles.badge} ${statusClass(value)}`}>{String(value ?? 'unknown')}</span>
}

export function AdminDashboard() {
  const router = useRouter()
  const [view, setView] = useState<View>('overview')
  const [context, setContext] = useState<AdminContext | null>(null)
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const requested = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('view') as View | null
    if (requested && NAV.some((item) => item.id === requested)) setView(requested)
  }, [])

  useEffect(() => {
    let cancelled = false
    void getAdminContext().then((next) => {
      if (cancelled) return
      setContext(next)
      if (next.aal !== 'aal2') {
        router.replace(next.requiresMfaSetup ? '/admin/mfa/setup' : '/admin/mfa/challenge')
        return
      }
      void getAdminOverview().then((data) => { if (!cancelled) setOverview(data) }).catch((cause) => { if (!cancelled) setError(errorMessage(cause)) }).finally(() => { if (!cancelled) setLoading(false) })
    }).catch((cause) => {
      if (cancelled) return
      setError(errorMessage(cause, 'Your admin session has expired.'))
      setLoading(false)
      if (cause instanceof AdminApiError && cause.status === 403 && cause.body?.code === 'mfa_required') router.replace('/admin/mfa/challenge')
      else router.replace('/admin/login')
    })
    return () => { cancelled = true }
  }, [router])

  function chooseView(next: View) {
    setView(next)
    router.replace(`/admin?view=${next}`)
  }

  async function logout() {
    await adminLogout().catch(() => undefined)
    router.replace('/admin/login')
  }

  if (loading || !context || !overview) {
    return <main className={styles.loginShell}><section className={styles.loginCard}><div className={styles.loginBrand}><div className={styles.mark}>A</div><div><div className={styles.brandName}>Ambel Admin</div><div className={styles.brandMeta}>Regional control plane</div></div></div>{error ? <div className={styles.error}>{error}</div> : <div className={styles.notice}>Loading regional control-plane data…</div>}</section></main>
  }

  const allowed = (id: View) => id !== 'settings' || Boolean(context)

  return (
    <div className={styles.shell}>
      <aside className={styles.rail}>
        <div className={styles.brand}><div className={styles.mark}>A</div><div><div className={styles.brandName}>Ambel Admin</div><div className={styles.brandMeta}>{context.admin.region === 'IN' ? 'India' : 'International'} control plane</div></div></div>
        <nav className={styles.nav} aria-label="Admin navigation">
          {NAV.map((item) => <div key={item.id}>
            {item.group && <div className={styles.navGroup}>{item.group}</div>}
            <button type="button" className={`${styles.navButton} ${view === item.id ? styles.navButtonActive : ''}`} onClick={() => chooseView(item.id)} disabled={!allowed(item.id)}>{item.label}</button>
          </div>)}
        </nav>
        <div className={styles.railFooter}><div className={styles.identity}>{context.admin.displayName}</div><div className={styles.identityMeta}>{context.admin.role.replace('_', ' ')}</div><button className={styles.logout} type="button" onClick={() => void logout()}>Sign out</button></div>
      </aside>
      <section className={styles.main}>
        <header className={styles.topbar}><div><div className={styles.eyebrow}>Ambel internal systems</div><div className={styles.title}>{NAV.find((item) => item.id === view)?.label}</div></div><span className={styles.region}>{context.admin.region} · AAL2</span></header>
        <div className={styles.content}>
          {error && <div className={styles.error} style={{ marginBottom: 16 }} role="alert">{error}</div>}
          {view === 'overview' && <OverviewView overview={overview} />}
          {view === 'businesses' && <BusinessesView context={context} onError={setError} />}
          {view === 'users' && <BusinessesView context={context} onError={setError} focus="users" />}
          {view === 'subscriptions' && <BusinessesView context={context} onError={setError} focus="subscriptions" />}
          {view === 'support' && <SupportView context={context} onError={setError} />}
          {view === 'operations' && <OperationsView context={context} onError={setError} />}
          {view === 'audit' && <AuditView context={context} onError={setError} />}
          {view === 'team' && <TeamView context={context} onError={setError} />}
          {view === 'settings' && <SettingsView context={context} />}
        </div>
      </section>
    </div>
  )
}

function OverviewView({ overview }: { overview: AdminOverview }) {
  return <>
    <h1 className={styles.heading}>Regional overview</h1>
    <p className={styles.subheading}>Operational facts from the {overview.region === 'IN' ? 'India' : 'International'} Supabase project. No cross-region aggregation is performed.</p>
    <div className={`${styles.grid} ${styles.kpis}`}>
      <div className={styles.kpi}><div className={styles.kpiLabel}>Businesses</div><div className={styles.kpiValue}>{overview.signups.totalTenants}</div><div className={styles.kpiHint}>regional tenants</div></div>
      <div className={styles.kpi}><div className={styles.kpiLabel}>Active trials</div><div className={styles.kpiValue}>{overview.signups.activeTrials}</div><div className={styles.kpiHint}>current trial access</div></div>
      <div className={styles.kpi}><div className={styles.kpiLabel}>Subscriptions</div><div className={styles.kpiValue}>{overview.subscriptions.active}</div><div className={styles.kpiHint}>{overview.subscriptions.expired} expired</div></div>
      <div className={styles.kpi}><div className={styles.kpiLabel}>Merchant users</div><div className={styles.kpiValue}>{overview.activeMerchantUsers}</div><div className={styles.kpiHint}>active staff records</div></div>
    </div>
    <div className={`${styles.grid} ${styles.columns}`}>
      <section className={styles.card}><div className={styles.cardHeader}><div className={styles.cardTitle}>Safe operations boundary</div><Badge value="read/write allowlist" /></div><div className={styles.cardBody}><div className={styles.notice}>Admin actions never rewrite provider payment truth, transaction history, secrets, PINs, or merchant roles. Every privileged action is appended to the regional audit ledger.</div></div></section>
      <section className={styles.card}><div className={styles.cardHeader}><div className={styles.cardTitle}>Failures · last 24 hours</div></div><div className={styles.cardBody}><div className={styles.list}>{styleslistItem(overview.operationalFailures.emails, 'Email sends')}{styleslistItem(overview.operationalFailures.imports, 'Imports')}{styleslistItem(overview.operationalFailures.forecasts, 'Forecast runs')}</div></div></section>
    </div>
  </>
}

function styleslistItem(value: number, label: string) {
  return <div className={styles.listItem} key={label}><div className={styles.split}><span className={styles.listMain}>{label}</span><Badge value={value ? 'attention' : 'clear'} /></div><div className={styles.listMeta}>{value} recorded failure{value === 1 ? '' : 's'} in the reporting window.</div></div>
}

function BusinessesView({ context, onError, focus }: { context: AdminContext; onError: (message: string | null) => void; focus?: 'users' | 'subscriptions' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AdminTenantListResult[]>([])
  const [resultMode, setResultMode] = useState<'recent' | 'search'>('recent')
  const [total, setTotal] = useState(0)
  const [detail, setDetail] = useState<TenantDetail | null>(null)
  const [busy, setBusy] = useState(false)
  const [override, setOverride] = useState({ key: 'max_locations', value: '1', ticket: '', reason: '', expiresAt: '' })

  useEffect(() => {
    let cancelled = false
    setBusy(true)
    onError(null)
    setResults([])
    setTotal(0)
    setResultMode('recent')
    setDetail(null)
    void listRecentAdminTenants().then((response) => {
      if (cancelled) return
      setResults(response.results)
      setTotal(response.total)
      setResultMode('recent')
    }).catch((cause) => {
      if (!cancelled) onError(errorMessage(cause))
    }).finally(() => {
      if (!cancelled) setBusy(false)
    })
    return () => { cancelled = true }
  }, [focus, onError])

  async function search(event?: FormEvent) {
    event?.preventDefault()
    if (query.trim().length < 2) { onError('Enter at least two characters to search.'); return }
    setBusy(true); onError(null)
    try {
      const response = await searchAdminTenants(query.trim())
      setResults(response.results)
      setTotal(response.total)
      setResultMode('search')
      setDetail(null)
    } catch (cause) { onError(errorMessage(cause)) } finally { setBusy(false) }
  }
  async function openTenant(id: string) {
    setBusy(true); onError(null)
    try { setDetail(await getAdminTenant(id)) } catch (cause) { onError(errorMessage(cause)) } finally { setBusy(false) }
  }
  async function action(fn: () => Promise<unknown>, message: string) {
    if (!detail || !window.confirm(message)) return
    setBusy(true); onError(null)
    try { await fn(); setDetail(await getAdminTenant(detail.tenant.id)) } catch (cause) { onError(errorMessage(cause)) } finally { setBusy(false) }
  }
  async function createOverride(event: FormEvent) {
    event.preventDefault()
    if (!detail || context.admin.role !== 'platform_owner') return
    setBusy(true); onError(null)
    try { await createEntitlementOverride({ tenantId: detail.tenant.id, entitlementKey: override.key, overrideValue: Number(override.value), justification: override.reason, ticketId: override.ticket, expiresAt: override.expiresAt }); setDetail(await getAdminTenant(detail.tenant.id)); setOverride({ key: 'max_locations', value: '1', ticket: '', reason: '', expiresAt: '' }) } catch (cause) { onError(errorMessage(cause)) } finally { setBusy(false) }
  }

  return <>
    <h1 className={styles.heading}>{focus === 'users' ? 'Merchant users' : focus === 'subscriptions' ? 'Subscriptions' : 'Businesses'}</h1>
    <p className={styles.subheading}>Showing the newest {context.admin.region === 'IN' ? 'India' : 'International'} records first. Search by business, merchant identity, store, tenant ID, or provider billing identifier.</p>
    <section className={styles.card}><div className={styles.cardBody}><form className={styles.formRow} onSubmit={search}><input className={styles.input} aria-label="Tenant search" placeholder="Business, email, tenant ID, provider ID…" value={query} onChange={(event) => setQuery(event.target.value)} /><button className={`${styles.button} ${styles.primary}`} disabled={busy} type="submit">{busy ? 'Searching…' : 'Search'}</button></form></div></section>
    {results.length > 0 ? <section className={styles.card} style={{ marginTop: 16 }}><div className={styles.cardHeader}><div className={styles.cardTitle}>{resultMode === 'recent' ? 'Recent regional businesses' : 'Matches'}</div><span className={styles.muted}>{total || results.length} total · {results.length} shown</span></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Business</th>{focus === 'users' ? <th>Users</th> : focus === 'subscriptions' ? <th>Subscriptions</th> : <th>Location</th>}{focus === 'users' ? <th>Location</th> : focus === 'subscriptions' ? <th>Latest status</th> : <th>Region</th>}<th>Created</th></tr></thead><tbody>{results.map((result) => <tr key={result.id}><td><button type="button" className={styles.tableButton} onClick={() => void openTenant(result.id)}>{result.tradeName || result.businessName}</button><div className={styles.listMeta}>{result.businessName}<br />{result.id}</div></td>{focus === 'users' ? <><td>{result.activeUserCount == null ? '—' : `${result.activeUserCount} active · ${result.userCount ?? 0} total`}</td><td>{result.city || '—'}</td></> : focus === 'subscriptions' ? <><td>{result.subscriptionCount == null ? '—' : `${result.activeSubscriptionCount ?? 0} active · ${result.subscriptionCount} total`}</td><td>{result.latestSubscriptionStatus ? <Badge value={result.latestSubscriptionStatus} /> : <span className={styles.muted}>None</span>}</td></> : <><td>{result.city || '—'}</td><td>{result.country || '—'}</td></>}<td>{dateLabel(result.createdAt)}</td></tr>)}</tbody></table></div></section> : <section className={styles.card} style={{ marginTop: 16 }}><div className={styles.empty}>{resultMode === 'recent' ? 'No businesses have been created in this regional database yet.' : 'No businesses matched that search.'}</div></section>}
    {detail && <>
      <section className={styles.card} style={{ marginTop: 16 }}><div className={styles.cardHeader}><div><div className={styles.cardTitle}>{detail.tenant.tradeName || detail.tenant.businessName}</div><div className={styles.muted}>{detail.tenant.id}</div></div><div className={styles.formRow}><button className={styles.button} disabled={busy} type="button" onClick={() => void action(() => resendMerchantInvitation(detail.tenant.id), 'Resend the merchant Owner invitation?')}>Resend invite</button><button className={`${styles.button} ${styles.danger}`} disabled={busy} type="button" onClick={() => void action(() => revokeMerchantSessions(detail.tenant.id), 'Revoke active merchant sessions for this tenant?')}>Revoke sessions</button></div></div><div className={styles.cardBody}><div className={`${styles.grid} ${styles.detailGrid}`}><div><div className={styles.muted}>Address</div><div className={styles.detailValue}>{detail.tenant.address.city}, {detail.tenant.address.state}<br />{detail.tenant.address.country} {detail.tenant.address.postalCode}</div></div><div><div className={styles.muted}>Stores</div><div className={styles.detailValue}>{detail.stores.length}</div></div><div><div className={styles.muted}>Merchant users</div><div className={styles.detailValue}>{detail.users.length}</div></div></div></div></section>
      <section className={`${styles.grid} ${styles.columns}`} style={{ marginTop: 16 }}><section className={styles.card}><div className={styles.cardHeader}><div className={styles.cardTitle}>Users and stores</div></div><div className={styles.cardBody}><div className={styles.list}>{detail.users.map((user) => <div className={styles.listItem} key={user.id}><div className={styles.split}><span className={styles.listMain}>{user.name}</span><Badge value={user.isActive ? user.role : 'suspended'} /></div><div className={styles.listMeta}>{user.email || 'No email account'} · {user.id}</div></div>)}</div></div></section><section className={styles.card}><div className={styles.cardHeader}><div className={styles.cardTitle}>Subscriptions</div></div><div className={styles.cardBody}><div className={styles.list}>{detail.subscriptions.map((subscription) => <div className={styles.listItem} key={String(subscription.id)}><div className={styles.split}><span className={styles.listMain}>{String(subscription.planKey ?? subscription.plan_key ?? 'Plan')}</span><Badge value={subscription.status} /></div><div className={styles.listMeta}>{String(subscription.currency ?? '')} · entitlement {String(subscription.entitlementStatus ?? subscription.entitlement_status ?? '—')} · updated {dateLabel(subscription.updatedAt ?? subscription.updated_at)}</div></div>)}</div>{detail.subscriptions.length === 0 && <div className={styles.empty}>No subscription rows.</div>}</div></section></section>
      {context.admin.role === 'platform_owner' && <section className={styles.card} style={{ marginTop: 16 }}><div className={styles.cardHeader}><div className={styles.cardTitle}>Bounded entitlement override</div><span className={styles.muted}>Does not change provider billing</span></div><div className={styles.cardBody}><form onSubmit={createOverride} className={styles.formRow}><select className={styles.select} value={override.key} onChange={(event) => setOverride((current) => ({ ...current, key: event.target.value }))}><option value="max_locations">Max locations</option><option value="max_active_users">Max active users</option><option value="max_active_registers">Max active registers</option><option value="forecast_monthly_runs">Forecast runs</option><option value="catalog_products">Catalog products</option></select><input className={styles.input} style={{ minWidth: 100, flex: '0 1 120px' }} type="number" min="0" max="100000" required value={override.value} onChange={(event) => setOverride((current) => ({ ...current, value: event.target.value }))} placeholder="Value" /><input className={styles.input} placeholder="Ticket ID" required value={override.ticket} onChange={(event) => setOverride((current) => ({ ...current, ticket: event.target.value }))} /><input className={styles.input} placeholder="Expiry (ISO)" required value={override.expiresAt} onChange={(event) => setOverride((current) => ({ ...current, expiresAt: event.target.value }))} /><input className={styles.input} placeholder="Justification" required value={override.reason} onChange={(event) => setOverride((current) => ({ ...current, reason: event.target.value }))} /><button className={`${styles.button} ${styles.primary}`} disabled={busy} type="submit">Create override</button></form></div></section>}
    </>}
  </>
}

function SupportView({ context, onError }: { context: AdminContext; onError: (message: string | null) => void }) {
  const canOperate = context.admin.role === 'platform_owner' || context.admin.role === 'support_admin'
  const [requests, setRequests] = useState<Array<Record<string, unknown>>>([])
  const [form, setForm] = useState({ tenantId: '', ticketId: '', reason: '' })
  const [session, setSession] = useState<{ token: string; requestId: string; expiresAt: string } | null>(null)
  const [busy, setBusy] = useState(false)
  async function load() { try { setRequests((await listSupportRequests()).requests) } catch (cause) { onError(errorMessage(cause)) } }
  useEffect(() => { if (canOperate) void load() }, [canOperate])
  async function create(event: FormEvent) { event.preventDefault(); setBusy(true); onError(null); try { await createSupportRequest(form); setForm({ tenantId: '', ticketId: '', reason: '' }); await load() } catch (cause) { onError(errorMessage(cause)) } finally { setBusy(false) } }
  async function start(id: string) { setBusy(true); onError(null); try { const started = await startSupportSession(id); setSession({ token: started.sessionToken, requestId: id, expiresAt: started.expiresAt }) } catch (cause) { onError(errorMessage(cause)) } finally { setBusy(false) } }
  async function terminate(id: string) { if (!window.confirm('Terminate this support session?')) return; setBusy(true); try { await terminateSupportSession(id); setSession(null); await load() } catch (cause) { onError(errorMessage(cause)) } finally { setBusy(false) } }
  if (!canOperate) return <><h1 className={styles.heading}>Support</h1><p className={styles.subheading}>Read-only administrators cannot request or open merchant support sessions.</p><div className={styles.notice}>Support access requires a ticket, reason, merchant Owner consent, and a 30-minute expiry.</div></>
  return <><h1 className={styles.heading}>Merchant support</h1><p className={styles.subheading}>Requests render supported read models only. They never mint a merchant JWT or enable writes.</p><section className={styles.card}><div className={styles.cardHeader}><div className={styles.cardTitle}>Request read-only access</div></div><div className={styles.cardBody}><form onSubmit={create}><div className={styles.formRow}><input className={styles.input} required placeholder="Tenant ID" value={form.tenantId} onChange={(event) => setForm((current) => ({ ...current, tenantId: event.target.value }))} /><input className={styles.input} required placeholder="Ticket ID" value={form.ticketId} onChange={(event) => setForm((current) => ({ ...current, ticketId: event.target.value }))} /></div><textarea className={styles.textarea} required placeholder="Why is access needed?" value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} /><button className={`${styles.button} ${styles.primary}`} disabled={busy} type="submit">Create consent request</button></form></div></section><section className={styles.card} style={{ marginTop: 16 }}><div className={styles.cardHeader}><div className={styles.cardTitle}>Consent queue</div><button className={styles.button} type="button" onClick={() => void load()}>Refresh</button></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Ticket</th><th>Tenant</th><th>Status</th><th>Expiry</th><th>Action</th></tr></thead><tbody>{requests.map((request) => <tr key={String(request.id)}><td>{String(request.ticketId ?? request.ticket_id)}</td><td>{String(request.tenantId ?? request.tenant_id)}</td><td><Badge value={request.status} /></td><td>{dateLabel(request.expiresAt ?? request.expires_at)}</td><td>{request.status === 'approved' ? <><button className={styles.tableButton} disabled={busy} type="button" onClick={() => void start(String(request.id))}>Start</button>{' · '}<button className={styles.tableButton} type="button" onClick={() => void terminate(String(request.id))}>Terminate</button></> : <span className={styles.muted}>Awaiting Owner</span>}</td></tr>)}</tbody></table></div>{requests.length === 0 && <div className={styles.empty}>No support requests.</div>}</section>{session && <section className={styles.card} style={{ marginTop: 16 }}><div className={styles.banner}>Support session active until {dateLabel(session.expiresAt)}. Keep the visible banner in any supported read model.</div><div className={styles.cardBody}><div className={styles.muted}>Session token is held in this tab only. Use the server read-model client; never attach it to merchant routes.</div><button className={`${styles.button} ${styles.danger}`} style={{ marginTop: 12 }} type="button" onClick={() => void terminate(session.requestId)}>Terminate now</button></div></section>}</>
}

function OperationsView({ context, onError }: { context: AdminContext; onError: (message: string | null) => void }) {
  const [form, setForm] = useState({ kind: 'email', id: '', key: '' })
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); onError(null); try { await retryAdminOperation({ operationKind: form.kind, operationId: form.id, idempotencyKey: form.key }); setForm({ ...form, id: '', key: '' }) } catch (cause) { onError(errorMessage(cause)) } finally { setBusy(false) } }
  return <><h1 className={styles.heading}>Safe operations</h1><p className={styles.subheading}>Only known, idempotent webhook, email, import, and forecast operations can be queued for retry.</p><section className={styles.card}><div className={styles.cardHeader}><div className={styles.cardTitle}>Retry an approved operation</div><Badge value={context.admin.role === 'read_only' ? 'view only' : 'allowlisted'} /></div><div className={styles.cardBody}>{context.admin.role === 'read_only' ? <div className={styles.notice}>Read-only administrators can inspect operations but cannot retry them.</div> : <form className={styles.formRow} onSubmit={submit}><select className={styles.select} value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))}><option value="email">Email</option><option value="webhook">Webhook</option><option value="import">Import</option><option value="forecast">Forecast</option></select><input className={styles.input} required placeholder="Operation ID" value={form.id} onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))} /><input className={styles.input} required placeholder="Established key (kind:id)" value={form.key} onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))} /><button className={`${styles.button} ${styles.primary}`} disabled={busy} type="submit">Queue retry</button></form>}</div></section></>
}

function AuditView({ context, onError }: { context: AdminContext; onError: (message: string | null) => void }) {
  const [events, setEvents] = useState<Array<Record<string, unknown>>>([])
  const [busy, setBusy] = useState(false)
  async function load() { setBusy(true); onError(null); try { const result = await getAdminAudit(); if (typeof result !== 'string') setEvents(result.events) } catch (cause) { onError(errorMessage(cause)) } finally { setBusy(false) } }
  useEffect(() => { void load() }, [])
  async function exportCsv() { try { const csv = await getAdminAudit({ format: 'csv' }); if (typeof csv !== 'string') return; const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'ambel-admin-audit.csv'; link.click(); URL.revokeObjectURL(url) } catch (cause) { onError(errorMessage(cause)) } }
  return <><h1 className={styles.heading}>Audit log</h1><p className={styles.subheading}>Append-only privileged actions, denied attempts, support consent, and sensitive read-model access for this region.</p><section className={styles.card}><div className={styles.cardHeader}><div className={styles.cardTitle}>{events.length} recent events</div><div className={styles.formRow}><button className={styles.button} disabled={busy} type="button" onClick={() => void load()}>Refresh</button>{context.admin.role !== 'support_admin' && <button className={styles.button} type="button" onClick={() => void exportCsv()}>Export visible rows</button>}</div></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>When</th><th>Action</th><th>Target</th><th>Reason / ticket</th></tr></thead><tbody>{events.map((event) => <tr key={String(event.id)}><td>{dateLabel(event.created_at)}</td><td><span className={styles.listMain}>{String(event.action)}</span><div className={styles.listMeta}>{String(event.administrator_id ?? 'merchant/system')}</div></td><td>{String(event.target_type ?? '—')}<br />{String(event.target_id ?? event.tenant_id ?? '—')}</td><td>{String(event.reason ?? '—')} {event.ticket_id ? `· ${String(event.ticket_id)}` : ''}</td></tr>)}</tbody></table></div>{events.length === 0 && <div className={styles.empty}>No audit events in this view.</div>}</section></>
}

function TeamView({ context, onError }: { context: AdminContext; onError: (message: string | null) => void }) {
  const [admins, setAdmins] = useState<Array<AdminContext['admin'] & { invitedAt: string; activatedAt: string | null; suspendedAt: string | null }>>([])
  const [invite, setInvite] = useState({ email: '', displayName: '', role: 'support_admin' as AdminRole })
  const [reset, setReset] = useState<{ id: string; email: string; reason: string } | null>(null)
  const [busy, setBusy] = useState(false)
  async function load() { try { setAdmins((await getAdminTeam()).admins) } catch (cause) { onError(errorMessage(cause)) } }
  useEffect(() => { void load() }, [])
  async function sendInvite(event: FormEvent) { event.preventDefault(); setBusy(true); onError(null); try { await inviteAdmin(invite); setInvite({ email: '', displayName: '', role: 'support_admin' }); await load() } catch (cause) { onError(errorMessage(cause)) } finally { setBusy(false) } }
  async function change(admin: typeof admins[number], action: 'suspend' | 'activate') { if (admin.id === context.admin.id || !window.confirm(`${action === 'suspend' ? 'Suspend' : 'Activate'} ${admin.email}?`)) return; setBusy(true); onError(null); try { if (action === 'suspend') await suspendAdmin(admin.id); else await activateAdmin(admin.id); await load() } catch (cause) { onError(errorMessage(cause)) } finally { setBusy(false) } }
  async function submitReset(event: FormEvent) { event.preventDefault(); if (!reset) return; setBusy(true); onError(null); try { await resetAdminMfa(reset.id, { targetEmail: reset.email, reason: reset.reason }); setReset(null) } catch (cause) { onError(errorMessage(cause)) } finally { setBusy(false) } }
  return <><h1 className={styles.heading}>Admin team</h1><p className={styles.subheading}>Regional employee accounts only. Every administrator belongs to one project and must use email OTP plus authenticator TOTP.</p>{context.admin.role === 'platform_owner' && <section className={styles.card}><div className={styles.cardHeader}><div className={styles.cardTitle}>Invite an administrator</div><span className={styles.muted}>Owner step-up required</span></div><div className={styles.cardBody}><form className={styles.formRow} onSubmit={sendInvite}><input className={styles.input} required type="email" placeholder="employee@ambelpos.com" value={invite.email} onChange={(event) => setInvite((current) => ({ ...current, email: event.target.value }))} /><input className={styles.input} required placeholder="Display name" value={invite.displayName} onChange={(event) => setInvite((current) => ({ ...current, displayName: event.target.value }))} /><select className={styles.select} value={invite.role} onChange={(event) => setInvite((current) => ({ ...current, role: event.target.value as AdminRole }))}><option value="platform_owner">Platform Owner</option><option value="support_admin">Support Admin</option><option value="read_only">Read-only</option></select><button className={`${styles.button} ${styles.primary}`} disabled={busy} type="submit">Send invite</button></form></div></section>}
    <section className={styles.card} style={{ marginTop: 16 }}><div className={styles.cardHeader}><div className={styles.cardTitle}>Regional administrators</div><button className={styles.button} type="button" onClick={() => void load()}>Refresh</button></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Administrator</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{admins.map((admin) => <tr key={admin.id}><td><span className={styles.listMain}>{admin.displayName}</span><div className={styles.listMeta}>{admin.email}</div></td><td>{admin.role.replace('_', ' ')}</td><td><Badge value={admin.status} /></td><td>{context.admin.role === 'platform_owner' && admin.id !== context.admin.id && <><button className={styles.tableButton} type="button" onClick={() => void change(admin, admin.status === 'suspended' ? 'activate' : 'suspend')}>{admin.status === 'suspended' ? 'Activate' : 'Suspend'}</button>{' · '}<button className={styles.tableButton} type="button" onClick={() => setReset({ id: admin.id, email: admin.email, reason: '' })}>Reset MFA</button></>}</td></tr>)}</tbody></table></div></section>{reset && <div className={styles.modalBackdrop}><section className={styles.modal}><div className={styles.modalHeader}><div className={styles.cardTitle}>Reset another administrator’s MFA</div><button className={styles.close} type="button" onClick={() => setReset(null)} aria-label="Close">×</button></div><div className={styles.cardBody}><div className={styles.notice}>This deletes the target’s factors and revokes their active Supabase sessions. Self-reset is not available.</div><form onSubmit={submitReset} style={{ marginTop: 14 }}><label className={styles.field}><span className={styles.label}>Type target email exactly</span><input className={styles.input} required type="email" value={reset.email} onChange={(event) => setReset((current) => current && ({ ...current, email: event.target.value }))} /></label><label className={styles.field}><span className={styles.label}>Reason / incident ticket</span><textarea className={styles.textarea} required value={reset.reason} onChange={(event) => setReset((current) => current && ({ ...current, reason: event.target.value }))} /></label><button className={`${styles.button} ${styles.primary}`} disabled={busy} type="submit">Reset factors</button></form></div></section></div>}</>
}

function SettingsView({ context }: { context: AdminContext }) {
  return <><h1 className={styles.heading}>Admin settings</h1><p className={styles.subheading}>Security and deployment facts for this regional control plane.</p><div className={`${styles.grid} ${styles.columns}`}><section className={styles.card}><div className={styles.cardHeader}><div className={styles.cardTitle}>Authentication policy</div></div><div className={styles.cardBody}><div className={styles.list}><div className={styles.listItem}><div className={styles.listMain}>Email OTP</div><div className={styles.listMeta}>Existing regional Supabase Auth delivery</div></div><div className={styles.listItem}><div className={styles.listMain}>Authenticator TOTP</div><div className={styles.listMeta}>Required for AAL2 · phone MFA is disabled</div></div><div className={styles.listItem}><div className={styles.listMain}>Current session</div><div className={styles.listMeta}>{context.admin.email} · {context.admin.region}</div></div></div></div></section><section className={styles.card}><div className={styles.cardHeader}><div className={styles.cardTitle}>Safety boundary</div></div><div className={styles.cardBody}><div className={styles.notice}>The emergency disable flag affects only /admin and /api/admin. Merchant POS access remains independent.</div></div></section></div></>
}
