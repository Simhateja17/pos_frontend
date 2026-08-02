'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Badge, type BadgeTone, Card, CardHead, CardPad, DataTable, Fld, Modal, PageHead } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'

type Role = 'owner' | 'manager' | 'cashier'
type Member = { id: string; name: string; role: Role; isActive: boolean; createdAt: string }
const LOAD_ERROR = "We couldn't load team members. Check your connection and try again."
const roleLabel = (role: Role) => `${role[0].toUpperCase()}${role.slice(1)}`
const ROLE_TONE: Record<Role, BadgeTone> = { owner: 'gold', manager: 'blue', cashier: 'grey' }
async function authHeader() { const { data } = await supabase.auth.getSession(); return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : undefined }

export function MembersView() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'manager' | 'cashier'>('cashier')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)
  const [roleTarget, setRoleTarget] = useState<Member | null>(null)
  const [pendingRole, setPendingRole] = useState<Role>('cashier')
  const [roleError, setRoleError] = useState<string | null>(null)
  const [changingRole, setChangingRole] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setLoadError(null)
    const { data, error } = await apiClient.GET('/members', { headers: await authHeader() })
    setLoading(false)
    if (error || !data) { setLoadError(LOAD_ERROR); return }
    setMembers(data)
  }, [])
  useEffect(() => { void load() }, [load])
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setInviting(true); setInviteError(null)
    const { error } = await apiClient.POST('/members/invite', { body: { name: inviteName, email: inviteEmail, role: inviteRole }, headers: await authHeader() })
    setInviting(false)
    if (error) { setInviteError('We could not send this invitation. Check the details and try again.'); return }
    setInviteOpen(false); setInviteName(''); setInviteEmail(''); setInviteRole('cashier'); void load()
  }
  async function changeRole() {
    if (!roleTarget) return
    setChangingRole(true); setRoleError(null)
    const { error } = await apiClient.PATCH('/members/{memberId}/role', { params: { path: { memberId: roleTarget.id } }, body: { role: pendingRole }, headers: await authHeader() })
    setChangingRole(false)
    if (error) { setRoleError('We could not change this role. Your existing access remains unchanged.'); return }
    setRoleTarget(null); void load()
  }
  async function remove() {
    if (!removeTarget) return
    setRemoving(true); setRemoveError(null)
    const { error } = await apiClient.DELETE('/members/{memberId}', { params: { path: { memberId: removeTarget.id } }, headers: await authHeader() })
    setRemoving(false)
    if (error) { setRemoveError('We could not remove this member. Their access remains unchanged.'); return }
    setRemoveTarget(null); void load()
  }

  return (
    <>
      <PageHead
        title="Staff"
        sub="Manage real staff access. Server role checks determine which changes are allowed."
        actions={
          <button className="btn btn-pri" type="button" onClick={() => setInviteOpen(true)}>
            Invite team member
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
              body="Invite a manager or cashier when they need access to this register."
              action={
                <button className="btn btn-pri" type="button" onClick={() => setInviteOpen(true)}>
                  Invite team member
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
            <DataTable cols={['Name', 'Role', 'Status', { label: 'Actions', align: 'right' }]}>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <strong>{member.name}</strong>
                  </td>
                  <td>
                    <Badge tone={ROLE_TONE[member.role]}>{roleLabel(member.role)}</Badge>
                  </td>
                  <td>
                    <Badge tone={member.isActive ? 'green' : 'grey'} dot={member.isActive ? 'g' : undefined}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-sm"
                        type="button"
                        onClick={() => { setRoleTarget(member); setPendingRole(member.role); setRoleError(null) }}
                      >
                        Change role
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        type="button"
                        onClick={() => { setRemoveTarget(member); setRemoveError(null) }}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
          </CardPad>
        </Card>
      )}

      {inviteOpen && (
        <Modal
          title="Invite team member"
          onClose={() => setInviteOpen(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setInviteOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-pri" type="submit" form="invite-form" disabled={inviting}>
                {inviting ? 'Sending invitation…' : 'Invite team member'}
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
            <Fld id="invite-name" label="Name">
              <input id="invite-name" required value={inviteName} onChange={(event) => setInviteName(event.target.value)} />
            </Fld>
            <Fld id="invite-email" label="Email">
              <input
                id="invite-email"
                required
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
            </Fld>
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
