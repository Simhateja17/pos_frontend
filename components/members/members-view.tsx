'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, type BadgeTone, Card, CardHead, CardPad, DataTable, Fld, Modal, PageHead } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { useAppRegion } from '@/lib/app-region'
import { useT } from '@/lib/i18n/i18n'

type Role = 'owner' | 'manager' | 'cashier'
type Member = {
  id: string
  name: string
  role: Role
  isActive: boolean
  createdAt: string
  email?: string | null
  accessMode?: 'account' | 'pin'
  pinConfigured?: boolean
  pinMustChange?: boolean
}
type StaffSession = {
  id: string
  staffName: string | null
  terminalName: string | null
  loggedInAt: string
  loggedOutAt: string | null
  logoutReason: string | null
}
const ROLE_TONE: Record<Role, BadgeTone> = { owner: 'gold', manager: 'blue', cashier: 'grey' }

export function MembersView({ firstPinSetup = false, returnTo = '/terminal/pin' }: { firstPinSetup?: boolean; returnTo?: string }) {
  const router = useRouter()
  const t = useT()
  const { dateLocale } = useAppRegion()
  const [members, setMembers] = useState<Member[]>([])
  const [sessions, setSessions] = useState<StaffSession[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [accessMode, setAccessMode] = useState<'pin' | 'email'>('pin')
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'manager' | 'cashier'>('cashier')
  const [temporaryPin, setTemporaryPin] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)
  const [roleTarget, setRoleTarget] = useState<Member | null>(null)
  const [pendingRole, setPendingRole] = useState<Role>('cashier')
  const [roleError, setRoleError] = useState<string | null>(null)
  const [changingRole, setChangingRole] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const [resetTarget, setResetTarget] = useState<Member | null>(null)
  const [resetPin, setResetPin] = useState('')
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setLoadError(null)
    const headers = await authHeaders()
    const [membersResult, sessionsResult] = await Promise.all([
      apiClient.GET('/members', { headers }),
      apiClient.GET('/terminal/pin/sessions', { headers }),
    ])
    setLoading(false)
    if (membersResult.error || !membersResult.data) { setLoadError(t('members.errors.load')); return }
    if (firstPinSetup && membersResult.data.some((member) => member.isActive && member.pinConfigured)) {
      router.replace(returnTo)
      return
    }
    setMembers(membersResult.data)
    if (!sessionsResult.error && sessionsResult.data) setSessions(sessionsResult.data)
    // t is intentionally omitted: changing locale must not refetch members.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstPinSetup, returnTo, router])
  useEffect(() => { void load() }, [load])
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setInviting(true); setInviteError(null)
    // A new staff member always belongs to one store. Omitting the header
    // when the owner has the combined "All stores" view open lets the
    // server fall back to the owner's own membership store instead of
    // sending X-Store-Id: all to a route that cannot act business-wide —
    // this screen has no store picker to resolve that any other way.
    const result = accessMode === 'pin'
      ? await apiClient.POST('/members', {
          body: { name: inviteName, role: inviteRole, temporaryPin },
          headers: await authHeaders({ includeStore: false }),
        })
      : await apiClient.POST('/members/invite', {
          body: { name: inviteName, email: inviteEmail, role: inviteRole },
          headers: await authHeaders({ includeStore: false }),
        })
    setInviting(false)
    if (result.error) {
      setInviteError((result.error as { error?: string }).error ?? t('members.errors.invite'))
      return
    }
    setInviteOpen(false); setInviteName(''); setInviteEmail(''); setTemporaryPin(''); setInviteRole('cashier'); setAccessMode('pin')
    if (firstPinSetup) router.push(returnTo)
    else void load()
  }
  async function changeRole() {
    if (!roleTarget) return
    setChangingRole(true); setRoleError(null)
    const { error } = await apiClient.PATCH('/members/{memberId}/role', { params: { path: { memberId: roleTarget.id } }, body: { role: pendingRole }, headers: await authHeaders() })
    setChangingRole(false)
    if (error) { setRoleError(t('members.errors.role')); return }
    setRoleTarget(null); void load()
  }
  async function remove() {
    if (!removeTarget) return
    setRemoving(true); setRemoveError(null)
    const { error } = await apiClient.DELETE('/members/{memberId}', { params: { path: { memberId: removeTarget.id } }, headers: await authHeaders() })
    setRemoving(false)
    if (error) { setRemoveError(t('members.errors.remove')); return }
    setRemoveTarget(null); void load()
  }

  async function resetStaffPin() {
    if (!resetTarget) return
    setResetting(true); setResetError(null)
    // Same single-store fallback as invite() above — a PIN reset is scoped
    // to the member's own store, and this modal has no store picker.
    const { error } = await apiClient.POST('/members/{memberId}/reset-pin', {
      params: { path: { memberId: resetTarget.id } },
      body: { pin: resetPin },
      headers: await authHeaders({ includeStore: false }),
    })
    setResetting(false)
    if (error) {
      setResetError((error as { error?: string }).error ?? t('members.errors.reset'))
      return
    }
    setResetTarget(null); setResetPin('')
    if (firstPinSetup) router.push(returnTo)
    else void load()
  }

  return (
    <>
      <PageHead
        title={firstPinSetup ? t('members.firstPinTitle') : t('members.title')}
        sub={firstPinSetup
          ? t('members.firstPinSubtitle')
          : t('members.subtitle')}
        actions={
          <button className="btn btn-pri" type="button" onClick={() => { setAccessMode('pin'); setInviteOpen(true) }}>
            {t('members.add')}
          </button>
        }
      />

      {loadError && (
        <Card>
          <CardPad>
            <ErrorState message={loadError} onRetry={() => void load()} />
          </CardPad>
        </Card>
      )}

      {loading && !loadError && (
        <Card>
          <LoadingState label={t('members.members')} rows={4} />
        </Card>
      )}

      {!loading && !loadError && members.length === 0 && (
        <Card>
          <CardPad>
            <EmptyState
              title={t('members.onlyMember')}
              body={t('members.onlyMemberBody')}
              action={
                <button className="btn btn-pri" type="button" onClick={() => { setAccessMode('pin'); setInviteOpen(true) }}>
                  {t('members.add')}
                </button>
              }
            />
          </CardPad>
        </Card>
      )}

      {!loading && !loadError && members.length > 0 && (
        <Card>
          <CardHead title={t('members.members')} sub={t('members.membersSub')} />
          <CardPad style={{ paddingTop: 4 }}>
            <DataTable cols={[t('members.table.name'), t('members.table.role'), t('members.table.access'), t('members.table.status'), t('members.table.actions')]}>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <strong>{member.name}</strong>
                  </td>
                  <td>
                    <Badge tone={ROLE_TONE[member.role]}>{t(`members.roles.${member.role}` as const)}</Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {member.accessMode === 'account' && <Badge tone="blue">{t('members.access.emailAccount')}</Badge>}
                      <Badge tone={member.pinConfigured ? 'green' : 'amber'}>
                        {member.pinConfigured
                          ? member.pinMustChange
                            ? t('members.access.temporaryPin')
                            : t('members.access.counterPinReady')
                          : t('members.access.noCounterPin')}
                      </Badge>
                    </div>
                  </td>
                  <td>
                    <Badge tone={member.isActive ? 'green' : 'grey'} dot={member.isActive ? 'g' : undefined}>
                      {member.isActive ? t('members.status.active') : t('members.status.inactive')}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {!firstPinSetup && (
                        <button
                          className="btn btn-sm"
                          type="button"
                          onClick={() => { setRoleTarget(member); setPendingRole(member.role); setRoleError(null) }}
                        >
                          {t('members.actions.changeRole')}
                        </button>
                      )}
                      {member.isActive && (
                        <button
                          className="btn btn-sm"
                          type="button"
                          onClick={() => { setResetTarget(member); setResetPin(''); setResetError(null) }}
                        >
                          {member.pinConfigured ? t('members.actions.resetPin') : t('members.actions.setPin')}
                        </button>
                      )}
                      {!firstPinSetup && (
                        <button
                          className="btn btn-sm btn-ghost"
                          type="button"
                          onClick={() => { setRemoveTarget(member); setRemoveError(null) }}
                        >
                          {t('members.actions.remove')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
          </CardPad>
        </Card>
      )}

      {!firstPinSetup && !loading && !loadError && (
        <Card>
          <CardHead title={t('members.sessions.title')} sub={t('members.sessions.sub')} />
          <CardPad style={{ paddingTop: 4 }}>
            {sessions.length === 0 ? (
              <p className="t-sub" style={{ fontSize: 13 }}>{t('members.sessions.empty')}</p>
            ) : (
              <DataTable cols={[t('members.sessions.staff'), t('members.sessions.counter'), t('members.sessions.loggedIn'), t('members.sessions.loggedOut'), t('members.sessions.status')]} minWidth={780}>
                {sessions.slice(0, 50).map((session) => (
                  <tr key={session.id}>
                    <td className="t-strong">{session.staffName ?? '-'}</td>
                    <td>{session.terminalName ?? '-'}</td>
                    <td className="t-sub">{new Date(session.loggedInAt).toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="t-sub">{session.loggedOutAt ? new Date(session.loggedOutAt).toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</td>
                    <td>
                      <Badge tone={session.loggedOutAt ? 'grey' : 'green'}>
                        {session.loggedOutAt ? session.logoutReason ?? t('members.status.ended') : t('members.status.active')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </CardPad>
        </Card>
      )}

      {inviteOpen && (
        <Modal
          title={accessMode === 'pin' ? t('members.invite.counterTitle') : t('members.invite.accountTitle')}
          onClose={() => setInviteOpen(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setInviteOpen(false)}>
                {t('members.invite.cancel')}
              </button>
              <button className="btn btn-pri" type="submit" form="invite-form" disabled={inviting}>
                {inviting ? (accessMode === 'pin' ? t('members.invite.adding') : t('members.invite.sending')) : accessMode === 'pin' ? t('members.add') : t('members.invite.inviteAccount')}
              </button>
            </>
          }
        >
          <form id="invite-form" onSubmit={invite}>
            {inviteError && (
              <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                {inviteError}
              </div>
            )}
            {!firstPinSetup && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button className={`btn btn-sm ${accessMode === 'pin' ? 'btn-pri' : ''}`} type="button" onClick={() => setAccessMode('pin')}>
                  {t('members.invite.counterPin')}
                </button>
                <button className={`btn btn-sm ${accessMode === 'email' ? 'btn-pri' : ''}`} type="button" onClick={() => setAccessMode('email')}>
                  {t('members.invite.emailAccount')}
                </button>
              </div>
            )}
            <p className="t-sub" style={{ fontSize: 12.5, marginBottom: 14 }}>
              {accessMode === 'pin'
                ? t('members.invite.pinHelp')
                : t('members.invite.accountHelp')}
            </p>
            <Fld id="invite-name" label={t('members.invite.name')}>
              <input id="invite-name" required value={inviteName} onChange={(event) => setInviteName(event.target.value)} />
            </Fld>
            {accessMode === 'email' && <Fld id="invite-email" label={t('members.invite.email')}>
              <input
                id="invite-email"
                required
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
            </Fld>}
            {accessMode === 'pin' && <Fld id="temporary-pin" label={t('members.invite.temporaryPin')}>
              <input
                id="temporary-pin"
                required
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                value={temporaryPin}
                onChange={(event) => setTemporaryPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder={t('members.invite.pinPlaceholder')}
              />
            </Fld>}
            <Fld id="invite-role" label={t('members.invite.role')}>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as 'manager' | 'cashier')}
              >
                <option value="manager">{t('members.roles.manager')}</option>
                <option value="cashier">{t('members.roles.cashier')}</option>
              </select>
            </Fld>
          </form>
        </Modal>
      )}

      {resetTarget && (
        <Modal
          title={resetTarget.pinConfigured
            ? t('members.reset.resetTitle', { name: resetTarget.name })
            : t('members.reset.setupTitle', { name: resetTarget.name })}
          onClose={() => setResetTarget(null)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setResetTarget(null)}>{t('members.reset.cancel')}</button>
              <button className="btn btn-pri" type="button" disabled={resetting || resetPin.length !== 4} onClick={() => void resetStaffPin()}>
                {resetting
                  ? t('members.reset.saving')
                  : resetTarget.pinConfigured
                    ? t('members.actions.resetPin')
                    : t('members.actions.setPin')}
              </button>
            </>
          }
        >
          {resetError && <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>{resetError}</div>}
          <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>
            {t('members.reset.help', { name: resetTarget.name })}
          </p>
          <Fld id="reset-pin" label={t('members.invite.temporaryPin')}>
            <input id="reset-pin" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={resetPin} onChange={(event) => setResetPin(event.target.value.replace(/\D/g, '').slice(0, 4))} />
          </Fld>
        </Modal>
      )}

      {roleTarget && (
        <Modal
          title={t('members.roleChange.title')}
          onClose={() => setRoleTarget(null)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setRoleTarget(null)}>
                {t('members.roleChange.keep')}
              </button>
              <button className="btn btn-pri" type="button" disabled={changingRole} onClick={() => void changeRole()}>
                {changingRole ? t('members.roleChange.changing') : t('members.roleChange.title')}
              </button>
            </>
          }
        >
          {roleError && (
            <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
              {roleError}
            </div>
          )}
          <Fld id="pending-role" label={t('members.roleChange.newRole')}>
            <select id="pending-role" value={pendingRole} onChange={(event) => setPendingRole(event.target.value as Role)}>
              <option value="owner">{t('members.roles.owner')}</option>
              <option value="manager">{t('members.roles.manager')}</option>
              <option value="cashier">{t('members.roles.cashier')}</option>
            </select>
          </Fld>
          <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>
            {t('members.roleChange.prompt', { name: roleTarget.name, from: t(`members.roles.${roleTarget.role}` as const), to: t(`members.roles.${pendingRole}` as const) })}
          </p>
        </Modal>
      )}

      {removeTarget && (
        <Modal
          title={t('members.remove.title')}
          onClose={() => setRemoveTarget(null)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setRemoveTarget(null)}>
                {t('members.remove.keep')}
              </button>
              <button className="btn btn-pri" type="button" disabled={removing} onClick={() => void remove()}>
                {removing ? t('members.remove.removing') : t('members.remove.remove')}
              </button>
            </>
          }
        >
          {removeError && (
            <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
              {removeError}
            </div>
          )}
          <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>
            {t('members.remove.prompt', { name: removeTarget.name })}
          </p>
        </Modal>
      )}
    </>
  )
}
