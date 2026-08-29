import { useEffect, useState } from 'react';
import { ADMIN_PERMISSIONS, type AdminPermission, type UserPublic } from '@pilates/api-client';
import { hooks } from '@/lib/api';
import { toast, toastError } from '@/lib/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const LABELS: Record<AdminPermission, string> = {
  schedule: 'Schedule & check-in',
  classes: 'Classes',
  instructors: 'Instructors',
  rooms: 'Rooms',
  events: 'Events',
  promotions: 'Promotions',
  pricing: 'Pricing & packages',
  shop: 'MILE Shop',
  'site-content': 'Site content',
  waivers: 'Waivers',
  reports: 'Reports',
  announcements: 'Announcements',
  settings: 'Settings',
};

/**
 * Edits an existing STAFF/ADMIN user's role + granted admin-portal sections,
 * or (when `user` is omitted) creates a brand-new team member. Superadmin
 * only — enforced server-side too.
 */
export function TeamAccessDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user?: UserPublic;
}) {
  const { createStaff, updateAccess } = hooks.useTeamMutations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'staff' | 'admin'>('staff');
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setEmail(user?.email ?? '');
    setPassword('');
    setFullName(user?.fullName ?? '');
    setRole((user?.role as 'staff' | 'admin') ?? 'staff');
    setPermissions(user?.permissions ?? []);
  }, [open, user]);

  const toggle = (key: AdminPermission) =>
    setPermissions((p) =>
      p.includes(key) ? p.filter((k) => k !== key) : [...p, key],
    );

  const mutation = user ? updateAccess : createStaff;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const run = user
      ? updateAccess.mutateAsync({ id: user.id, body: { role, permissions } })
      : createStaff.mutateAsync({ email, password, fullName, role, permissions });
    run
      .then(() => {
        toast.success(user ? 'Access updated' : 'Team member added');
        onOpenChange(false);
      })
      .catch(toastError);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? `Edit access — ${user.fullName}` : 'New team member'}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          {!user && (
            <>
              <Field label="Full name" htmlFor="tm-name">
                <Input
                  id="tm-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email" htmlFor="tm-email">
                  <Input
                    id="tm-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Temporary password" htmlFor="tm-password">
                  <Input
                    id="tm-password"
                    type="text"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
              </div>
            </>
          )}

          <Field label="Role" htmlFor="tm-role">
            <select
              id="tm-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'staff' | 'admin')}
              className="h-9 w-full rounded-md border border-line bg-surface px-3 text-sm"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium">Admin portal access</p>
            <div className="grid grid-cols-2 gap-2 rounded-md border border-line p-3">
              {ADMIN_PERMISSIONS.map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-sm"
                >
                  <Switch
                    checked={permissions.includes(key)}
                    onCheckedChange={() => toggle(key)}
                  />
                  {LABELS[key]}
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
