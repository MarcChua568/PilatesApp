import { useState } from 'react';
import { ShieldCheck, UserCog, Plus } from 'lucide-react';
import type { UserPublic } from '@pilates/api-client';
import { hooks } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { TeamAccessDialog } from '@/components/TeamAccessDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function TeamPage() {
  const { data, isLoading, error } = hooks.useTeamUsers();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UserPublic | undefined>();

  const columns: Column<UserPublic>[] = [
    { key: 'name', header: 'Name', cell: (r) => r.fullName },
    { key: 'email', header: 'Email', cell: (r) => r.email },
    {
      key: 'role',
      header: 'Role',
      cell: (r) =>
        r.role === 'superadmin' ? (
          <Badge tone="accent">
            <ShieldCheck className="mr-1 h-3 w-3 inline" /> superadmin
          </Badge>
        ) : (
          r.role
        ),
    },
    {
      key: 'access',
      header: 'Access',
      cell: (r) =>
        r.role === 'superadmin' ? (
          <span className="text-muted">everything</span>
        ) : r.permissions.length ? (
          <span className="text-sm text-muted">
            {r.permissions.length} section{r.permissions.length === 1 ? '' : 's'}
          </span>
        ) : (
          <span className="text-sm text-danger">none granted</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-16 text-right',
      cell: (r) =>
        r.role === 'superadmin' ? null : (
          <Button size="icon" variant="ghost" onClick={() => setEditing(r)}>
            <UserCog className="h-4 w-4" />
          </Button>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Team & access"
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New team member
          </Button>
        }
      >
        <p className="mt-1 text-sm text-muted">
          Create accounts for staff and admins, and choose exactly which
          admin-portal sections each one can use. Superadmins always have
          everything.
        </p>
      </PageHeader>
      <div className="rounded-lg border border-line bg-surface">
        <DataTable
          columns={columns}
          rows={data?.data}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          empty="No team members yet."
        />
      </div>

      <TeamAccessDialog open={creating} onOpenChange={setCreating} />
      <TeamAccessDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(undefined)}
        user={editing}
      />
    </div>
  );
}
