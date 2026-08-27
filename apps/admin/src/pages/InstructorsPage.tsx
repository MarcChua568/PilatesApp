import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus } from 'lucide-react';
import type { Instructor } from '@pilates/api-client';
import { queryKeys } from '@pilates/api-client';
import { api } from '@/lib/api';
import { hooks } from '@/lib/api';
import { toast, toastError } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { InstructorFormDialog } from '@/components/InstructorFormDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function InstructorsPage() {
  const { data, isLoading, error } = hooks.useInstructors();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Instructor | undefined>();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Instructor | undefined>();

  const del = useMutation({
    mutationFn: (id: string) => api.instructors.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.instructors });
      toast.success('Instructor removed');
      setDeleting(undefined);
    },
    onError: toastError,
  });

  const columns: Column<Instructor>[] = [
    { key: 'name', header: 'Name', cell: (r) => r.name },
    {
      key: 'bio',
      header: 'Bio',
      cell: (r) => (
        <span className="line-clamp-1 text-muted">{r.bio ?? '—'}</span>
      ),
    },
    {
      key: 'photo',
      header: 'Photo',
      cell: (r) =>
        r.photoUrl ? (
          <Badge tone="accent">set</Badge>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24 text-right',
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={() => setEditing(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setDeleting(r)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Instructors"
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New instructor
          </Button>
        }
      />
      <div className="rounded-lg border border-line bg-surface">
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          empty="No instructors yet."
        />
      </div>

      <InstructorFormDialog open={creating} onOpenChange={setCreating} />
      <InstructorFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(undefined)}
        instructor={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title="Remove instructor?"
        body={`${deleting?.name} will be removed. Classes that reference them keep their copied details.`}
        confirmLabel="Remove"
        destructive
        busy={del.isPending}
        onConfirm={() => deleting && del.mutate(deleting.id)}
      />
    </div>
  );
}
