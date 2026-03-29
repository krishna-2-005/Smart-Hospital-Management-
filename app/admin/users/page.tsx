'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, UserPlus, Copy, ShieldCheck, Users, ToggleLeft, ToggleRight, Pencil, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

const DOCTOR_SPECIALIZATIONS = [
  'General Medicine', 'Cardiology', 'Orthopedics', 'Dermatology',
  'Pediatrics', 'Neurology', 'Psychiatry', 'ENT', 'Gynecology', 'Urology',
];

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  doctor: 'bg-blue-100 text-blue-800',
  reception: 'bg-green-100 text-green-800',
  driver: 'bg-amber-100 text-amber-800',
};

const ROLE_CARDS = [
  { role: 'admin',     prefix: 'A', label: 'Admins' },
  { role: 'doctor',    prefix: 'D', label: 'Doctors' },
  { role: 'reception', prefix: 'R', label: 'Receptionists' },
  { role: 'driver',    prefix: 'E', label: 'Drivers' },
];

interface StaffUser {
  id: number;
  staffId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
}

interface NewStaffResult { staffId: string; firstName: string; lastName: string; role: string; }

const EMPTY_FORM = { firstName: '', lastName: '', email: '', phone: '', role: '', specialization: '' };
const EMPTY_EDIT = { firstName: '', lastName: '', email: '', phone: '', specialization: '' };

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Create
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createdUser, setCreatedUser] = useState<NewStaffResult | null>(null);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffUser | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const visibleUsers = activeFilter ? users.filter((u) => u.role === activeFilter) : users;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!form.firstName || !form.lastName || !form.role) {
      setCreateError('First name, last name, and role are required');
      return;
    }
    if (!form.email) { setCreateError('Email is required'); return; }
    if (!form.phone) { setCreateError('Mobile number is required'); return; }
    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || 'Failed to create user'); return; }
      setCreatedUser({ staffId: data.user.staffId, firstName: data.user.firstName, lastName: data.user.lastName, role: data.user.role });
      setForm(EMPTY_FORM);
      await loadUsers();
    } catch { setCreateError('Unexpected error'); } finally { setIsCreating(false); }
  };

  const openEdit = (u: StaffUser) => {
    setEditTarget(u);
    setEditForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone || '', specialization: '' });
    setEditError('');
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.email) { setEditError('Email is required'); return; }
    if (!editForm.phone) { setEditError('Mobile number is required'); return; }
    setEditError('');
    setIsSavingEdit(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: editTarget.id, ...editForm }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || 'Failed to update'); return; }
      toast.success('Staff details updated');
      setEditOpen(false);
      await loadUsers();
    } catch { setEditError('Unexpected error'); } finally { setIsSavingEdit(false); }
  };

  const handleToggle = async (userId: number, currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, isActive: !currentActive }),
      });
      if (res.ok) { toast.success(`User ${!currentActive ? 'activated' : 'deactivated'}`); await loadUsers(); }
    } catch { toast.error('Failed to update user'); }
  };

  const copyStaffId = (id: string) => { navigator.clipboard.writeText(id); toast.success('Staff ID copied!'); };
  const roleCount = (role: string) => users.filter((u) => u.role === role).length;

  const listTitle = activeFilter
    ? `${ROLE_CARDS.find((r) => r.role === activeFilter)?.label} (${visibleUsers.length})`
    : `All Staff (${users.length})`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/dashboard')}><ArrowLeft className="w-4 h-4" /></Button>
            <div>
              <h1 className="text-xl font-bold text-primary">Staff Management</h1>
              <p className="text-xs text-muted-foreground">Create and manage hospital staff accounts</p>
            </div>
          </div>

          {/* ── Create dialog ── */}
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setCreatedUser(null); setCreateError(''); setForm(EMPTY_FORM); } }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90"><UserPlus className="w-4 h-4 mr-2" />Add Staff</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Staff Account</DialogTitle>
                <DialogDescription>Default password is <span className="font-mono font-bold">123456</span>. Staff must change it on first login.</DialogDescription>
              </DialogHeader>

              {createdUser ? (
                <div className="space-y-4">
                  <div className="rounded-lg border-2 border-primary bg-primary/5 p-5 text-center space-y-3">
                    <ShieldCheck className="w-10 h-10 text-primary mx-auto" />
                    <p className="font-semibold text-lg">{createdUser.firstName} {createdUser.lastName}</p>
                    <Badge className={ROLE_COLORS[createdUser.role]}>{createdUser.role}</Badge>
                    <div className="p-3 bg-white rounded border-2 border-dashed border-primary">
                      <p className="text-xs text-muted-foreground mb-1">Staff ID</p>
                      <p className="text-3xl font-mono font-bold text-primary tracking-widest">{createdUser.staffId}</p>
                    </div>
                    <div className="rounded bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800">
                      <KeyRound className="w-3 h-3 inline mr-1" />
                      Default password: <span className="font-mono font-bold">123456</span>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => copyStaffId(createdUser.staffId)}>
                      <Copy className="w-4 h-4 mr-2" />Copy Staff ID
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setCreatedUser(null)}>Add Another</Button>
                    <Button className="flex-1" onClick={() => setCreateOpen(false)}>Done</Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="space-y-4">
                  {createError && <Alert variant="destructive"><AlertDescription>{createError}</AlertDescription></Alert>}
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>First Name *</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="John" required /></div>
                    <div><Label>Last Name *</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" required /></div>
                  </div>
                  <div>
                    <Label>Role *</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v, specialization: '' })}>
                      <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="doctor">Doctor — ID starts with D</SelectItem>
                        <SelectItem value="reception">Receptionist — ID starts with R</SelectItem>
                        <SelectItem value="driver">Driver — ID starts with E</SelectItem>
                        <SelectItem value="admin">Admin — ID starts with A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.role === 'doctor' && (
                    <div>
                      <Label>Specialization</Label>
                      <Select value={form.specialization} onValueChange={(v) => setForm({ ...form, specialization: v })}>
                        <SelectTrigger><SelectValue placeholder="Select specialization" /></SelectTrigger>
                        <SelectContent>{DOCTOR_SPECIALIZATIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                  <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="staff@hospital.com" required /></div>
                  <div><Label>Mobile Number *</Label><Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 15) })} placeholder="9876543210" required /></div>
                  <div className="rounded bg-secondary/5 border border-secondary/20 p-3 text-xs text-muted-foreground">
                    <KeyRound className="w-3 h-3 inline mr-1" />Password will be <span className="font-mono font-bold">123456</span> — staff changes it on first login
                  </div>
                  <Button type="submit" disabled={isCreating} className="w-full bg-primary hover:bg-primary/90">
                    {isCreating ? 'Creating...' : 'Create & Generate Staff ID'}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* ── Edit dialog ── */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditError(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit — {editTarget?.firstName} {editTarget?.lastName}</DialogTitle>
            <DialogDescription>Update name, email, mobile{editTarget?.role === 'doctor' ? ', or specialization' : ''}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {editError && <Alert variant="destructive"><AlertDescription>{editError}</AlertDescription></Alert>}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First Name</Label><Input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} /></div>
              <div><Label>Last Name</Label><Input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} /></div>
            </div>
            <div><Label>Email *</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required /></div>
            <div><Label>Mobile Number *</Label><Input type="tel" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '').slice(0, 15) })} required /></div>
            {editTarget?.role === 'doctor' && (
              <div>
                <Label>Specialization</Label>
                <Select value={editForm.specialization} onValueChange={(v) => setEditForm({ ...editForm, specialization: v })}>
                  <SelectTrigger><SelectValue placeholder="Change specialization" /></SelectTrigger>
                  <SelectContent>{DOCTOR_SPECIALIZATIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSavingEdit} className="flex-1 bg-primary hover:bg-primary/90">{isSavingEdit ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* ── Role filter cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ROLE_CARDS.map(({ role, prefix, label }) => {
            const isActive = activeFilter === role;
            return (
              <Card
                key={role}
                onClick={() => setActiveFilter(isActive ? null : role)}
                className={`border-secondary/20 cursor-pointer transition-all hover:shadow-md hover:scale-105 ${isActive ? 'ring-2 ring-primary border-primary/40 bg-primary/5' : ''}`}
              >
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground uppercase">{label}</p>
                  <p className={`text-3xl font-bold mt-1 ${isActive ? 'text-primary' : 'text-foreground'}`}>{roleCount(role)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Prefix: <span className="font-mono font-bold">{prefix}</span></p>
                  {isActive && <p className="text-xs text-primary mt-1 font-medium">Filtered ✓ — click to clear</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Staff list ── */}
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" />
              {listTitle}
            </CardTitle>
            <CardDescription>
              {activeFilter
                ? `Showing only ${activeFilter} accounts. Click the card above to clear filter.`
                : 'All staff. Click a role card above to filter.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-10 text-center text-muted-foreground">Loading staff...</div>
            ) : visibleUsers.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                {activeFilter ? `No ${activeFilter} accounts yet.` : 'No staff accounts yet.'}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleUsers.map((u) => (
                  <div key={u.id} className={`rounded-lg border p-4 flex flex-wrap items-center justify-between gap-3 transition-opacity ${u.isActive ? '' : 'opacity-50'}`}>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{u.firstName} {u.lastName}</p>
                        {u.mustChangePassword && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                            <KeyRound className="w-3 h-3" />Password not changed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                      {u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={ROLE_COLORS[u.role] || 'bg-muted'}>{u.role}</Badge>
                      <div className="flex items-center gap-1 font-mono text-sm bg-secondary/10 px-2 py-1 rounded border border-secondary/20">
                        <span className="text-primary font-bold">{u.staffId || 'N/A'}</span>
                        {u.staffId && (
                          <button onClick={() => copyStaffId(u.staffId)} className="ml-1 text-muted-foreground hover:text-primary">
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <Badge variant="outline" className={u.isActive ? 'text-green-700 border-green-300' : 'text-red-700 border-red-300'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(u)} title="Edit">
                        <Pencil className="w-4 h-4 text-secondary" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleToggle(u.id, u.isActive)} title={u.isActive ? 'Deactivate' : 'Activate'}>
                        {u.isActive ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
