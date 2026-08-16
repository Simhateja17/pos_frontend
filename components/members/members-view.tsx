'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, type BadgeTone, Card, CardHead, CardPad, DataTable, Fld, Modal, PageHead } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'

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
const LOAD_ERROR = "We couldn't load team members. Check your connection and try again."
const roleLabel = (role: Role) => `${role[0].toUpperCase()}${role.slice(1)}`
const ROLE_TONE: Record<Role, BadgeTone> = { owner: 'gold', manager: 'blue', cashier: 'grey' }

export function MembersView({ firstPinSetup = false, returnTo = '/terminal/pin' }: { firstPinSetup?: boolean; returnTo?: string }) {
  const router = useRouter()
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
    if (membersResult.error || !membersResult.data) { setLoadError(LOAD_ERROR); return }
    if (firstPinSetup && membersResult.data.some((member) => member.isActive && member.pinConfigured)) {
      router.replace(returnTo)
      return
    }
    setMembers(membersResult.data)
    if (!sessionsResult.error && sessionsResult.data) setSessions(sessionsResult.data)
  }, [firstPinSetup, returnTo, router])
  useEffect(() => { void load() }, [load])
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setInviting(true); setInviteError(null)
    const result = accessMode === 'pin'
      ? await apiClient.POST('/members', {
          body: { name: inviteName, role: inviteRole, temporaryPin },
          headers: await authHeaders(),
        })
      : await apiClient.POST('/members/invite', {
          body: { name: inviteName, email: inviteEmail, role: inviteRole },
          headers: await authHeaders(),
        })
    setInviting(false)
    if (result.error) {
      setInviteError((result.error as { error?: string }).error ?? 'We could not add this staff member. Check the details and try again.')
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
    if (error) { setRoleError('We could not change this role. Your existing access remains unchanged.'); return }
    setRoleTarget(null); void load()
  }
  async function remove() {
    if (!removeTarget) return
    setRemoving(true); setRemoveError(null)
    const { error } = await apiClient.DELETE('/members/{memberId}', { params: { path: { memberId: removeTarget.id } }, headers: await authHeaders() })
    setRemoving(false)
    if (error) { setRemoveError('We could not remove this member. Their access remains unchanged.'); return }
    setRemoveTarget(null); void load()
  }

  async function resetStaffPin() {
    if (!resetTarget) return
    setResetting(true); setResetError(null)
    const { error } = await apiClient.POST('/members/{memberId}/reset-pin', {
      params: { path: { memberId: resetTarget.id } },
      body: { pin: resetPin },
      headers: await authHeaders(),
    })
    setResetting(false)
    if (error) {
      setResetError((error as { error?: string }).error ?? 'We could not reset this PIN.')
      return
    }
    setResetTarget(null); setResetPin('')
    if (firstPinSetup) router.push(returnTo)
    else void load()
  }

  return (
    <>
      <PageHead
        title={firstPinSetup ? 'Set up the first counter PIN' : 'Staff'}
        sub={firstPinSetup
          ? 'Create one PIN-enabled staff profile, or set a PIN for an existing member. You will return to the register afterward.'
          : 'Manage real staff access. Server role checks determine which changes are allowed.'}
        actions={
          <button className="btn btn-pri" type="button" onClick={() => { setAccessMode('pin'); setInviteOpen(true) }}>
            Add staff
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
          <LoadingState label="Loading team members" rows={4} />
        </Card>
      )}

      {!loading && !loadError && members.length === 0 && (
        <Card>
          <CardPad>
            <EmptyState
              title="You are the only team member"
              body="Add a cashier with a name and PIN. They do not need an email account to use this counter."
              action={
                <button className="btn btn-pri" type="button" onClick={() => { setAccessMode('pin'); setInviteOpen(true) }}>
                  Add staff
                </button>
              }
            />
          </CardPad>
        </Card>
      )}

      {!loading && !loadError && members.length > 0 && (
        <Card>
          <CardHead title="Members" sub="Active permissions and access actions are applied by the server." />
          <CardPad style={{ paddingTop: 4 }}>
            <DataTable headerAlign="center" cols={['Name', 'Role', 'Access', 'Status', { label: 'Actions', align: 'right' }]}>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <strong>{member.name}</strong>
                  </td>
                  <td>
                    <Badge tone={ROLE_TONE[member.role]}>{roleLabel(member.role)}</Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {member.accessMode === 'account' && <Badge tone="blue">Email account</Badge>}
                      <Badge tone={member.pinConfigured ? 'green' : 'amber'}>
                        {member.pinConfigured
                          ? member.pinMustChange
                            ? 'Temporary PIN'
                            : 'Counter PIN ready'
                          : 'No counter PIN'}
                      </Badge>
                    </div>
                  </td>
                  <td>
                    <Badge tone={member.isActive ? 'green' : 'grey'} dot={member.isActive ? 'g' : undefined}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {!firstPinSetup && (
                        <button
                          className="btn btn-sm"
                          type="button"
                          onClick={() => { setRoleTarget(member); setPendingRole(member.role); setRoleError(null) }}
                        >
                          Change role
                        </button>
                      )}
                      {member.isActive && (
                        <button
                          className="btn btn-sm"
                          type="button"
                          onClick={() => { setResetTarget(member); setResetPin(''); setResetError(null) }}
                        >
                          {member.pinConfigured ? 'Reset PIN' : 'Set counter PIN'}
                        </button>
                      )}
                      {!firstPinSetup && (
                        <button
                          className="btn btn-sm btn-ghost"
                          type="button"
                          onClick={() => { setRemoveTarget(member); setRemoveError(null) }}
                        >
                          Remove
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
          <CardHead title="Cashier sessions" sub="Every PIN login, handover, lock, and interruption is retained for the store." />
          <CardPad style={{ paddingTop: 4 }}>
            {sessions.length === 0 ? (
              <p className="t-sub" style={{ fontSize: 13 }}>No cashier sessions recorded yet.</p>
            ) : (
              <DataTable cols={['Staff', 'Counter', 'Logged in', 'Logged out', 'Status']} headerAlign="center" minWidth={780}>
                {sessions.slice(0, 50).map((session) => (
                  <tr key={session.id}>
                    <td className="t-strong">{session.staffName ?? '-'}</td>
                    <td>{session.terminalName ?? '-'}</td>
                    <td className="t-sub">{new Date(session.loggedInAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="t-sub">{session.loggedOutAt ? new Date(session.loggedOutAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</td>
                    <td>
                      <Badge tone={session.loggedOutAt ? 'grey' : 'green'}>
                        {session.loggedOutAt ? session.logoutReason ?? 'Ended' : 'Active'}
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
          title={accessMode === 'pin' ? 'Add counter staff' : 'Invite full account'}
          onClose={() => setInviteOpen(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setInviteOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-pri" type="submit" form="invite-form" disabled={inviting}>
                {inviting ? (accessMode === 'pin' ? 'Adding staff…' : 'Sending invitation…') : accessMode === 'pin' ? 'Add staff' : 'Invite account'}
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
                  Counter PIN
                </button>
                <button className={`btn btn-sm ${accessMode === 'email' ? 'btn-pri' : ''}`} type="button" onClick={() => setAccessMode('email')}>
                  Email account
                </button>
              </div>
            )}
            <p className="t-sub" style={{ fontSize: 12.5, marginBottom: 14 }}>
              {accessMode === 'pin'
                ? 'Use this for cashiers who work inside the store. The name appears on the counter lock screen.'
                : 'Use this when the person needs to sign in from outside the store or manage the organisation remotely.'}
            </p>
            <Fld id="invite-name" label="Name">
              <input id="invite-name" required value={inviteName} onChange={(event) => setInviteName(event.target.value)} />
            </Fld>
            {accessMode === 'email' && <Fld id="invite-email" label="Email">
              <input
                id="invite-email"
                required
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
            </Fld>}
            {accessMode === 'pin' && <Fld id="temporary-pin" label="Temporary PIN">
              <input
                id="temporary-pin"
                required
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                value={temporaryPin}
                onChange={(event) => setTemporaryPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4 digits"
              />
            </Fld>}
            <Fld id="invite-role" label="Role">
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as 'manager' | 'cashier')}
              >
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
              </select>
            </Fld>
          </form>
        </Modal>
      )}

      {resetTarget && (
        <Modal
          title={resetTarget.pinConfigured
            ? `Reset ${resetTarget.name}'s counter PIN`
            : `Set up ${resetTarget.name}'s counter PIN`}
          onClose={() => setResetTarget(null)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setResetTarget(null)}>Cancel</button>
              <button className="btn btn-pri" type="button" disabled={resetting || resetPin.length !== 4} onClick={() => void resetStaffPin()}>
                {resetting
                  ? 'Saving…'
                  : resetTarget.pinConfigured
                    ? 'Reset PIN'
                    : 'Set counter PIN'}
              </button>
            </>
          }
        >
          {resetError && <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>{resetError}</div>}
          <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>
            Enter a temporary four-digit PIN. {resetTarget.name} will use it once on the counter, then choose a private personal PIN.
          </p>
          <Fld id="reset-pin" label="Temporary PIN">
            <input id="reset-pin" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={resetPin} onChange={(event) => setResetPin(event.target.value.replace(/\D/g, '').slice(0, 4))} />
          </Fld>
        </Modal>
      )}

      {roleTarget && (
        <Modal
          title="Change role"
          onClose={() => setRoleTarget(null)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setRoleTarget(null)}>
                Keep current role
              </button>
              <button className="btn btn-pri" type="button" disabled={changingRole} onClick={() => void changeRole()}>
                {changingRole ? 'Changing role…' : 'Change role'}
              </button>
            </>
          }
        >
          {roleError && (
            <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
              {roleError}
            </div>
          )}
          <Fld id="pending-role" label="New role">
            <select id="pending-role" value={pendingRole} onChange={(event) => setPendingRole(event.target.value as Role)}>
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
            </select>
          </Fld>
          <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>
            Change {roleTarget.name} from {roleLabel(roleTarget.role)} to {roleLabel(pendingRole)}? Their access will
            change immediately after the server confirms it.
          </p>
        </Modal>
      )}

      {removeTarget && (
        <Modal
          title="Remove access"
          onClose={() => setRemoveTarget(null)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setRemoveTarget(null)}>
                Keep member
              </button>
              <button className="btn btn-pri" type="button" disabled={removing} onClick={() => void remove()}>
                {removing ? 'Removing access…' : 'Remove access'}
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
            Remove {removeTarget.name} from this store? They will lose access immediately. Reinstating access requires a
            new invitation.
          </p>
        </Modal>
      )}
    </>
  )
}
