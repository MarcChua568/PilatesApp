import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ClassInstance } from '@pilates/api-client';
import { api, hooks } from '@/lib/api';
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
import { Field, Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function ClassInstanceEditDialog({
  open,
  onOpenChange,
  instance,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  instance: ClassInstance;
}) {
  const qc = useQueryClient();
  const { data: instructors } = hooks.useInstructors();
  const { data: rooms } = hooks.useRooms();

  const [instructorId, setInstructorId] = useState(instance.instructorId);
  const [roomId, setRoomId] = useState(instance.roomId);
  const [capacity, setCapacity] = useState(instance.capacity);
  const [substitute, setSubstitute] = useState(instance.substitute);
  const [bookableFrom, setBookableFrom] = useState(
    toLocalInput(instance.bookableFrom),
  );

  useEffect(() => {
    if (open) {
      setInstructorId(instance.instructorId);
      setRoomId(instance.roomId);
      setCapacity(instance.capacity);
      setSubstitute(instance.substitute);
      setBookableFrom(toLocalInput(instance.bookableFrom));
    }
  }, [open, instance]);

  const mutation = useMutation({
    mutationFn: () =>
      api.classInstances.update(instance.id, {
        instructorId,
        roomId,
        capacity,
        substitute,
        bookableFrom: bookableFrom
          ? new Date(bookableFrom).toISOString()
          : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['class-instances'] });
      toast.success('Class updated');
      onOpenChange(false);
    },
    onError: toastError,
  });

  const belowBooked = capacity < instance.bookedCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit this class</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!belowBooked) mutation.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Instructor">
              <Select value={instructorId} onValueChange={setInstructorId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {instructors?.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Room">
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rooms?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field
            label="Capacity"
            htmlFor="ci-cap"
            hint={`${instance.bookedCount} currently booked`}
          >
            <Input
              id="ci-cap"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            />
          </Field>
          {belowBooked && (
            <p className="text-xs text-danger">
              Capacity can’t go below the current booked count.
            </p>
          )}

          <Field label="Booking opens" htmlFor="ci-from" hint="Leave blank to open immediately">
            <Input
              id="ci-from"
              type="datetime-local"
              value={bookableFrom}
              onChange={(e) => setBookableFrom(e.target.value)}
            />
          </Field>

          <div className="flex items-center justify-between rounded-md border border-line px-3 py-2.5">
            <Label>Substitute instructor</Label>
            <Switch checked={substitute} onCheckedChange={setSubstitute} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={belowBooked || mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
