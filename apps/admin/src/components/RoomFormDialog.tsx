import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Room } from '@pilates/api-client';
import { queryKeys } from '@pilates/api-client';
import { api } from '@/lib/api';
import { toast, toastError } from '@/lib/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function RoomFormDialog({
  open,
  onOpenChange,
  room,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  room?: Room;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [hasAssignedSpots, setHasAssignedSpots] = useState(false);

  useEffect(() => {
    if (open) {
      setName(room?.name ?? '');
      setNotes(room?.notes ?? '');
      setHasAssignedSpots(room?.hasAssignedSpots ?? false);
    }
  }, [open, room]);

  const mutation = useMutation({
    mutationFn: () => {
      const body = { name, notes: notes || undefined, hasAssignedSpots };
      return room ? api.rooms.update(room.id, body) : api.rooms.create(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rooms });
      toast.success(room ? 'Room updated' : 'Room added');
      onOpenChange(false);
    },
    onError: toastError,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{room ? 'Edit room' : 'New room'}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <Field label="Name" htmlFor="r-name">
            <Input
              id="r-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <Field label="Notes" htmlFor="r-notes">
            <Textarea
              id="r-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          <div className="flex items-center justify-between rounded-md border border-line px-3 py-2.5">
            <div>
              <Label>Assigned spots</Label>
              <p className="text-xs text-muted">
                Members pick a specific spot when booking a class here.
              </p>
            </div>
            <Switch
              checked={hasAssignedSpots}
              onCheckedChange={setHasAssignedSpots}
            />
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
