import { format } from 'date-fns';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AccountPage() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div>
      <h1 className="mb-4 text-2xl">Account</h1>
      <Card>
        <CardContent className="space-y-3 pt-5">
          <Row label="Name" value={user.fullName} />
          <Row label="Email" value={user.email} />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-eyebrow text-muted">
              Waiver
            </span>
            {user.healthWaiverSignedAt ? (
              <Badge tone="accent">
                signed {format(new Date(user.healthWaiverSignedAt), 'd MMM yyyy')}
              </Badge>
            ) : (
              <Badge tone="danger">not signed</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="mt-6 w-full" onClick={logout}>
        Sign out
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-eyebrow text-muted">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
