import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/auth/useAuth';
import { hooks } from '@/lib/api';
import { errorMessage, toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';

export function AccountPage() {
  const { user, logout, refetchUser } = useAuth();
  const { data: waiver } = hooks.useMyWaiver();
  const update = hooks.useUpdateProfileMutation();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone ?? '');
    }
  }, [user, editing]);

  if (!user) return null;

  function save(e: React.FormEvent) {
    e.preventDefault();
    update.mutate(
      { fullName, phone },
      {
        onSuccess: async () => {
          await refetchUser();
          toast.success('Profile updated');
          setEditing(false);
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-light tracking-tight">
        Account
      </h1>

      <Card>
        <CardContent className="pt-5">
          {editing ? (
            <form onSubmit={save} className="space-y-4">
              <Field label="Full name" htmlFor="a-name">
                <Input
                  id="a-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Field>
              <Field label="Phone" htmlFor="a-phone">
                <Input
                  id="a-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+63 9…"
                />
              </Field>
              <p className="text-xs text-muted">
                Email can't be changed here — contact the studio.
              </p>
              <div className="flex gap-2">
                <Button type="submit" disabled={update.isPending}>
                  {update.isPending ? 'Saving…' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <Row label="Name" value={user.fullName} />
              <Row label="Email" value={user.email} />
              <Row label="Phone" value={user.phone ?? '—'} />
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-eyebrow text-muted">
                  Waiver
                </span>
                {user.healthWaiverSignedAt ? (
                  <Badge tone="accent">
                    signed{' '}
                    {format(new Date(user.healthWaiverSignedAt), 'd MMM yyyy')}
                  </Badge>
                ) : (
                  <Badge tone="danger">not signed</Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setEditing(true)}
              >
                Edit profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {waiver && (
        <Card className="mt-4">
          <CardContent className="pt-5">
            <p className="eyebrow mb-3">Waiver on file</p>
            <div className="space-y-2 text-sm">
              <Row label="Date of birth" value={waiver.dateOfBirth} />
              <Row
                label="Emergency contact"
                value={`${waiver.emergencyContactName} · ${waiver.emergencyContactPhone}`}
              />
              <Row
                label="Medical notes"
                value={waiver.medicalNotes ?? 'None on file'}
              />
              <Row
                label="Submitted"
                value={format(new Date(waiver.submittedAt), 'd MMM yyyy')}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" className="mt-6 w-full" onClick={logout}>
        Sign out
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs uppercase tracking-eyebrow text-muted">
        {label}
      </span>
      <span className="text-right text-sm">{value}</span>
    </div>
  );
}
