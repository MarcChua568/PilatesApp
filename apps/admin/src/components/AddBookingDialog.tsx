import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ClassInstance, Room, UserPublic } from '@pilates/api-client';
import { invalidateBookingScope } from '@pilates/api-client';
import { api, hooks } from '@/lib/api';
import { errorMessage, toast } from '@/lib/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MemberSearchCombobox } from './MemberSearchCombobox';

export function AddBookingDialog({
  open,
  onOpenChange,
  instance,
  room,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  instance: ClassInstance;
  room?: Room;
}) {
  const qc = useQueryClient();
  const [member, setMember] = useState<UserPublic | null>(null);
  const [spotId, setSpotId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: spotMap } = hooks.useRoomSpots(
    room?.hasAssignedSpots ? room.id : undefined,
  );
  const { data: roster } = hooks.useBookingsForClass(open ? instance.id : undefined);
  const takenSpotIds = new Set(
    (roster ?? [])
      .filter((b) => b.status === 'booked' && b.spotId)
      .map((b) => b.spotId as string),
  );

  const mutation = useMutation({
    mutationFn: () =>
      api.bookings.book({
        classInstanceId: instance.id,
        spotId: room?.hasAssignedSpots ? spotId : undefined,
        memberId: member?.id,
      }),
    onSuccess: (rows) => {
      invalidateBookingScope(qc, instance.id);
      toast.success(
        rows[0].status === 'waitlisted'
          ? 'Class was full — added to the waitlist'
          : 'Booking added',
      );
      onOpenChange(false);
      setMember(null);
      setSpotId('');
    },
    onError: (e) => setError(errorMessage(e)),
  });

  const canSubmit =
    !!member && (!room?.hasAssignedSpots || !!spotId) && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a booking</DialogTitle>
          <DialogDescription>
            {instance.name} · books through the same rules members get (capacity,
            waiver, spot availability).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Member">
            <MemberSearchCombobox selected={member} onSelect={setMember} />
          </Field>
          {member && !member.healthWaiverSignedAt && (
            <p className="text-xs text-danger">
              This member hasn’t signed the health waiver — the booking will be
              rejected until they do.
            </p>
          )}

          {room?.hasAssignedSpots && (
            <Field label="Spot">
              <Select value={spotId} onValueChange={setSpotId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a spot" />
                </SelectTrigger>
                <SelectContent>
                  {spotMap
                    ?.filter((s) => s.bookable && s.active)
                    .map((s) => (
                      <SelectItem
                        key={s.id}
                        value={s.id}
                        disabled={takenSpotIds.has(s.id)}
                      >
                        Spot {s.label}
                        {takenSpotIds.has(s.id) ? ' · taken' : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              setError(null);
              mutation.mutate();
            }}
            disabled={!canSubmit}
          >
            {mutation.isPending ? 'Booking…' : 'Add booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
