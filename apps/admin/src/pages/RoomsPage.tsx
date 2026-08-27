import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, LayoutGrid } from 'lucide-react';
import type { Room } from '@pilates/api-client';
import { queryKeys } from '@pilates/api-client';
import { api, hooks } from '@/lib/api';
import { toast, toastError } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RoomFormDialog } from '@/components/RoomFormDialog';
import { SpotMapEditor } from '@/components/SpotMapEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function RoomsPage() {
  const { data, isLoading, error } = hooks.useRooms();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Room | undefined>();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Room | undefined>();
  const [spotRoom, setSpotRoom] = useState<Room | undefined>();

  const del = useMutation({
    mutationFn: (id: string) => api.rooms.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rooms });
      toast.success('Room removed');
      setDeleting(undefined);
    },
    onError: toastError,
  });

  const columns: Column<Room>[] = [
    { key: 'name', header: 'Name', cell: (r) => r.name },
    {
      key: 'notes',
      header: 'Notes',
      cell: (r) => <span className="text-muted">{r.notes ?? '—'}</span>,
    },
    {
      key: 'spots',
      header: 'Spots',
      cell: (r) =>
        r.hasAssignedSpots ? (
          <Badge tone="primary">assigned</Badge>
        ) : (
          <span className="text-muted">headcount only</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-40 text-right',
      cell: (r) => (
        <div className="flex justify-end gap-1">
          {r.hasAssignedSpots && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSpotRoom(r)}
            >
              <LayoutGrid className="h-4 w-4" /> Spots
            </Button>
          )}
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
        title="Rooms"
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New room
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
          empty="No rooms yet."
        />
      </div>

      <RoomFormDialog open={creating} onOpenChange={setCreating} />
      <RoomFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(undefined)}
        room={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title="Remove room?"
        body={`${deleting?.name} and its spot map will be removed.`}
        confirmLabel="Remove"
        destructive
        busy={del.isPending}
        onConfirm={() => deleting && del.mutate(deleting.id)}
      />

      <Dialog
        open={!!spotRoom}
        onOpenChange={(o) => !o && setSpotRoom(undefined)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{spotRoom?.name} — spot map</DialogTitle>
          </DialogHeader>
          {spotRoom && <SpotMapEditor roomId={spotRoom.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
