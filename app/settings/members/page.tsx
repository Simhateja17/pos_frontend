'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

type Role = 'owner' | 'manager' | 'cashier'

type Member = {
  id: string
  name: string
  role: Role
  isActive: boolean
  createdAt: string
}

const LOAD_ERROR = "Couldn't load team members. Check your connection and try again."

function labelStyle() {
  return {
    fontSize: '13px',
    fontWeight: 700 as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  }
}

function roleLabel(role: Role) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'manager' | 'cashier'>('cashier')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [isInviting, setIsInviting] = useState(false)

  const [roleChangeTarget, setRoleChangeTarget] = useState<Member | null>(null)
  const [pendingRole, setPendingRole] = useState<Role>('cashier')
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null)
  const [isChangingRole, setIsChangingRole] = useState(false)

  const [removeTarget, setRemoveTarget] = useState<Member | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  const loadMembers = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    const headers = await authHeader()
    const { data, error } = await apiClient.GET('/members', { headers })

    setIsLoading(false)

    if (error || !data) {
      setLoadError(LOAD_ERROR)
      return
    }

    setMembers(data)
  }, [])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  async function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setInviteError(null)
    setIsInviting(true)

    const headers = await authHeader()
    const { error } = await apiClient.POST('/members/invite', {
      body: { name: inviteName, email: inviteEmail, role: inviteRole },
      headers,
    })

    setIsInviting(false)

    if (error) {
      setInviteError('Something went wrong sending the invite — try again.')
      return
    }

    setInviteOpen(false)
    setInviteName('')
    setInviteEmail('')
    setInviteRole('cashier')
    loadMembers()
  }

  function openRoleChange(member: Member) {
    setRoleChangeTarget(member)
    setPendingRole(member.role)
    setRoleChangeError(null)
  }

  async function confirmRoleChange() {
    if (!roleChangeTarget) return
    setIsChangingRole(true)
    setRoleChangeError(null)

    const headers = await authHeader()
    const { error } = await apiClient.PATCH('/members/{memberId}/role', {
      params: { path: { memberId: roleChangeTarget.id } },
      body: { role: pendingRole },
      headers,
    })

    setIsChangingRole(false)

    if (error) {
      setRoleChangeError('Something went wrong changing this role — try again.')
      return
    }

    setRoleChangeTarget(null)
    loadMembers()
  }

  async function confirmRemove() {
    if (!removeTarget) return
    setIsRemoving(true)
    setRemoveError(null)

    const headers = await authHeader()
    const { error } = await apiClient.DELETE('/members/{memberId}', {
      params: { path: { memberId: removeTarget.id } },
      headers,
    })

    setIsRemoving(false)

    if (error) {
      setRemoveError('Something went wrong removing access — try again.')
      return
    }

    setRemoveTarget(null)
    loadMembers()
  }

  async function handleLogout() {
    // D-11's explicit end-of-shift logout. No dedicated shift/register UI
    // exists yet this phase (Phase 3's concern, CASH-01/02) — this Settings
    // page header is a reasonable interim placement for the explicit-logout
    // action, alongside the PIN pad's auto-timeout (D-11's other half).
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1
          style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: '20px',
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          Team members
        </h1>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={() => setInviteOpen(true)}
            style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
          >
            Invite team member
          </Button>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm"
            style={{ color: '#64748B' }}
          >
            Log out
          </button>
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{loadError}</AlertDescription>
          <Button
            type="button"
            onClick={loadMembers}
            className="mt-2"
            style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
          >
            Retry
          </Button>
        </Alert>
      )}

      {!loadError && isLoading && (
        <p className="text-sm" style={{ color: '#64748B' }}>
          Loading team members…
        </p>
      )}

      {!loadError && !isLoading && members.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <h2
            style={{
              fontFamily: 'Sora, sans-serif',
              fontSize: '20px',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            No team members yet
          </h2>
          <p className="max-w-md text-sm" style={{ color: '#64748B' }}>
            Invite a manager or cashier to give them access to this register. They&apos;ll
            set their own PIN on first login.
          </p>
        </div>
      )}

      {!loadError && !isLoading && members.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.name}</TableCell>
                <TableCell>
                  <Badge
                    style={
                      member.role === 'owner' || member.role === 'manager'
                        ? { backgroundColor: '#0058BA', color: '#FFFFFF' }
                        : undefined
                    }
                    variant={
                      member.role === 'owner' || member.role === 'manager'
                        ? 'default'
                        : 'outline'
                    }
                  >
                    {roleLabel(member.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" type="button">
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => openRoleChange(member)}>
                        Change role
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setRemoveTarget(member)
                          setRemoveError(null)
                        }}
                      >
                        Remove access
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4">
            {inviteError && (
              <Alert variant="destructive">
                <AlertDescription>{inviteError}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-name" style={labelStyle()}>
                Name
              </Label>
              <Input
                id="invite-name"
                required
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-email" style={labelStyle()}>
                Email
              </Label>
              <Input
                id="invite-email"
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={labelStyle()}>Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(value) => setInviteRole(value as 'manager' | 'cashier')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={isInviting}
                style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
              >
                Invite team member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change-role confirm dialog — reversible, primary blue, NOT destructive */}
      <Dialog
        open={roleChangeTarget !== null}
        onOpenChange={(open) => !open && setRoleChangeTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
          </DialogHeader>
          {roleChangeTarget && (
            <div className="flex flex-col gap-4">
              {roleChangeError && (
                <Alert variant="destructive">
                  <AlertDescription>{roleChangeError}</AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col gap-1.5">
                <Label style={labelStyle()}>New role</Label>
                <Select
                  value={pendingRole}
                  onValueChange={(value) => setPendingRole(value as Role)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm" style={{ color: '#64748B' }}>
                Change {roleChangeTarget.name} from {roleLabel(roleChangeTarget.role)} to{' '}
                {roleLabel(pendingRole)}? They&apos;ll lose access to reports, refunds,
                and discount approval.
              </p>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRoleChangeTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="default"
                  disabled={isChangingRole}
                  onClick={confirmRoleChange}
                  style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
                >
                  Change role
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove-access confirm dialog — destructive, red */}
      <Dialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove access</DialogTitle>
          </DialogHeader>
          {removeTarget && (
            <div className="flex flex-col gap-4">
              {removeError && (
                <Alert variant="destructive">
                  <AlertDescription>{removeError}</AlertDescription>
                </Alert>
              )}
              <p className="text-sm" style={{ color: '#64748B' }}>
                {`Remove ${removeTarget.name}'s access to this store? They won't be able to log in or PIN-switch on any terminal. This can't be undone from here — you'll need to re-invite them.`}
              </p>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRemoveTarget(null)}>
                  Keep access
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isRemoving}
                  onClick={confirmRemove}
                  style={{ backgroundColor: '#DC2626', color: '#FFFFFF' }}
                >
                  Remove access
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
