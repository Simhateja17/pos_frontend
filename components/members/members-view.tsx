'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'

type Role = 'owner' | 'manager' | 'cashier'
type Member = { id: string; name: string; role: Role; isActive: boolean; createdAt: string }
const LOAD_ERROR = "We couldn't load team members. Check your connection and try again."
const labelStyle = { fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const roleLabel = (role: Role) => `${role[0].toUpperCase()}${role.slice(1)}`
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

  return <main className="mx-auto max-w-6xl p-5 md:p-8"><header className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0058ba]">Customers & team</p><h1 className="mt-2 font-heading text-3xl font-bold">Team & access</h1><p className="mt-2 text-sm text-slate-500">Manage real staff access. Server role checks determine which changes are allowed.</p></div><Button className="bg-[#0058ba] hover:bg-[#064b9f]" onClick={() => setInviteOpen(true)}>Invite team member</Button></header>{loadError && <Alert variant="destructive" className="mb-5"><AlertDescription>{loadError}</AlertDescription><Button type="button" variant="outline" className="mt-3" onClick={() => void load()}>Retry loading team</Button></Alert>}{loading && <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />}{!loading && !loadError && members.length === 0 && <section className="rounded-2xl border bg-white p-10 text-center shadow-sm"><h2 className="font-heading text-xl font-bold">You are the only team member</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Invite a manager or cashier when they need access to this register.</p><Button className="mt-5 bg-[#0058ba] hover:bg-[#064b9f]" onClick={() => setInviteOpen(true)}>Invite team member</Button></section>}{!loading && !loadError && members.length > 0 && <section className="overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="border-b px-5 py-4"><h2 className="font-heading text-xl font-bold">Members</h2><p className="mt-1 text-sm text-slate-500">Active permissions and access actions are applied by the server.</p></div><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{members.map((member) => <TableRow key={member.id}><TableCell><strong>{member.name}</strong></TableCell><TableCell><Badge variant={member.role === 'cashier' ? 'outline' : 'default'} className={member.role === 'cashier' ? '' : 'bg-[#0058ba]'}>{roleLabel(member.role)}</Badge></TableCell><TableCell><span className={member.isActive ? 'text-emerald-700' : 'text-slate-500'}>{member.isActive ? 'Active' : 'Inactive'}</span></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm">Manage</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => { setRoleTarget(member); setPendingRole(member.role); setRoleError(null) }}>Change role</DropdownMenuItem><DropdownMenuItem className="text-red-700" onSelect={() => { setRemoveTarget(member); setRemoveError(null) }}>Remove access</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody></Table></section>}
    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}><DialogContent><DialogHeader><DialogTitle>Invite team member</DialogTitle></DialogHeader><form onSubmit={invite} className="space-y-4">{inviteError && <Alert variant="destructive"><AlertDescription>{inviteError}</AlertDescription></Alert>}<div><Label htmlFor="invite-name" style={labelStyle}>Name</Label><Input id="invite-name" required value={inviteName} onChange={(event) => setInviteName(event.target.value)} /></div><div><Label htmlFor="invite-email" style={labelStyle}>Email</Label><Input id="invite-email" required type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} /></div><div><Label style={labelStyle}>Role</Label><Select value={inviteRole} onValueChange={(value) => setInviteRole(value as 'manager' | 'cashier')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manager">Manager</SelectItem><SelectItem value="cashier">Cashier</SelectItem></SelectContent></Select></div><DialogFooter><Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button><Button type="submit" className="bg-[#0058ba] hover:bg-[#064b9f]" disabled={inviting}>{inviting ? 'Sending invitation…' : 'Invite team member'}</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={roleTarget !== null} onOpenChange={(open) => !open && setRoleTarget(null)}><DialogContent><DialogHeader><DialogTitle>Change role</DialogTitle></DialogHeader>{roleTarget && <div className="space-y-4">{roleError && <Alert variant="destructive"><AlertDescription>{roleError}</AlertDescription></Alert>}<div><Label style={labelStyle}>New role</Label><Select value={pendingRole} onValueChange={(value) => setPendingRole(value as Role)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="owner">Owner</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="cashier">Cashier</SelectItem></SelectContent></Select></div><p className="text-sm text-slate-600">Change {roleTarget.name} from {roleLabel(roleTarget.role)} to {roleLabel(pendingRole)}? Their access will change immediately after the server confirms it.</p><DialogFooter><Button variant="outline" onClick={() => setRoleTarget(null)}>Keep current role</Button><Button disabled={changingRole} className="bg-[#0058ba] hover:bg-[#064b9f]" onClick={() => void changeRole()}>{changingRole ? 'Changing role…' : 'Change role'}</Button></DialogFooter></div>}</DialogContent></Dialog>
    <Dialog open={removeTarget !== null} onOpenChange={(open) => !open && setRemoveTarget(null)}><DialogContent><DialogHeader><DialogTitle>Remove access</DialogTitle></DialogHeader>{removeTarget && <div className="space-y-4">{removeError && <Alert variant="destructive"><AlertDescription>{removeError}</AlertDescription></Alert>}<p className="text-sm text-slate-600">Remove {removeTarget.name} from this store? They will lose access immediately. Reinstating access requires a new invitation.</p><DialogFooter><Button variant="outline" onClick={() => setRemoveTarget(null)}>Keep member</Button><Button variant="destructive" disabled={removing} onClick={() => void remove()}>{removing ? 'Removing access…' : 'Remove access'}</Button></DialogFooter></div>}</DialogContent></Dialog>
  </main>
}
