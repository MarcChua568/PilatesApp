import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { EventItem } from '@pilates/api-client';
import { queryKeys } from '@pilates/api-client';
import { api, hooks } from '@/lib/api';
import { toast, toastError } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EventFormDialog } from '@/components/EventFormDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function EventsPage() {
  const { data, isLoading, error } = hooks.useAdminEvents();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<EventItem | undefined>();
  const [deleting, setDeleting] = useState<EventItem | undefined>();

  const del = useMutation({
    mutationFn: (id: string) => api.events.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.events });
      qc.invalidateQueries({ queryKey: queryKeys.adminEvents });
      toast.success('Event removed');
      setDeleting(undefined);
    },
    onError: toastError,
  });

  const columns: Column<EventItem>[] = [
    { key: 'title', header: 'Event', cell: (r) => r.title },
    {
      key: 'when',
      header: 'When',
      cell: (r) => format(new Date(r.startsAt), 'd MMM yyyy, HH:mm'),
    },
    {
      key: 'rsvps',
      header: 'RSVPs',
      cell: (r) =>
        r.capacity != null ? `${r.rsvpCount} / ${r.capacity}` : `${r.rsvpCount}`,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) =>
        r.publishedAt ? (
          <Badge tone="accent">Published</Badge>
        ) : (
          <span className="text-muted">Draft</span>
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
        title="Events"
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New event
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
          empty="No events yet."
        />
      </div>

      <EventFormDialog open={creating} onOpenChange={setCreating} />
      <EventFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(undefined)}
        event={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title="Remove event?"
        body={`“${deleting?.title}” and its RSVPs will be removed.`}
        confirmLabel="Remove"
        destructive
        busy={del.isPending}
        onConfirm={() => deleting && del.mutate(deleting.id)}
      />
    </div>
  );
}
