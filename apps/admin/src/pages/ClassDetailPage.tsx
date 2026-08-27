import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Pencil, UserPlus } from 'lucide-react';
import { hooks } from '@/lib/api';
import { toast, errorMessage } from '@/lib/toast';
import { RosterTable } from '@/components/RosterTable';
import { AddBookingDialog } from '@/components/AddBookingDialog';
import { ClassInstanceEditDialog } from '@/components/ClassInstanceFormDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function ClassDetailPage() {
  const { id = '' } = useParams();
  const { data: instance, isLoading } = hooks.useClassInstance(id);
  const { data: roster, isLoading: rosterLoading } = hooks.useBookingsForClass(id);
  const { data: rooms } = hooks.useRooms();
  const { data: instructors } = hooks.useInstructors();
  const room = rooms?.find((r) => r.id === instance?.roomId);
  const instructor = instructors?.find((i) => i.id === instance?.instructorId);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);

  const cancelMut = hooks.useCancelBookingMutation(id);
  const attendanceMut = hooks.useAttendanceMutation(id);
  const isMutating = cancelMut.isPending || attendanceMut.isPending;

  if (isLoading || !instance) {
    return <p className="text-muted">Loading class…</p>;
  }

  const waitlistCount = roster?.filter((b) => b.status === 'waitlisted').length ?? 0;

  return (
    <div className="max-w-4xl">
      <Link
        to="/schedule"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Schedule
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">
            {format(new Date(instance.startTime), 'EEEE d MMMM · HH:mm')}
          </p>
          <h1 className="text-2xl">{instance.name}</h1>
          <p className="mt-1 text-muted">
            {instructor?.name ?? '—'}
            {instance.substitute && (
              <Badge tone="muted" className="ml-2">
                sub
              </Badge>
            )}{' '}
            · {room?.name ?? '—'} · {instance.durationMinutes} min
          </p>
          {instance.status === 'cancelled' && (
            <Badge tone="danger" className="mt-2">
              class cancelled
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button
            onClick={() => setAdding(true)}
            disabled={instance.status === 'cancelled'}
          >
            <UserPlus className="h-4 w-4" /> Add booking
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-5">
            <p className="eyebrow">Booked</p>
            <p className="text-2xl font-light">
              {instance.bookedCount}
              <span className="text-base text-muted">/{instance.capacity}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="eyebrow">Waitlist</p>
            <p className="text-2xl font-light">{waitlistCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="eyebrow">Spots</p>
            <p className="text-2xl font-light">
              {room?.hasAssignedSpots ? 'assigned' : 'headcount'}
            </p>
          </CardContent>
        </Card>
      </div>

      {rosterLoading && <p className="text-muted">Loading roster…</p>}
      {roster && (
        <RosterTable
          bookings={roster}
          room={room}
          isMutating={isMutating}
          onCheckIn={(bookingId) =>
            attendanceMut.mutate(
              { bookingId, kind: 'checkIn' },
              {
                onSuccess: () => toast.success('Checked in'),
                onError: (e) => toast.error(errorMessage(e)),
              },
            )
          }
          onNoShow={(bookingId) =>
            attendanceMut.mutate(
              { bookingId, kind: 'noShow' },
              {
                onSuccess: () => toast.success('Marked no-show'),
                onError: (e) => toast.error(errorMessage(e)),
              },
            )
          }
          onCancel={(bookingId) =>
            cancelMut.mutate(bookingId, {
              onSuccess: (res) =>
                toast.success(
                  res.wasLateCancellation
                    ? 'Cancelled (inside the cancellation window)'
                    : 'Booking cancelled',
                ),
              onError: (e) => toast.error(errorMessage(e)),
            })
          }
        />
      )}

      <AddBookingDialog
        open={adding}
        onOpenChange={setAdding}
        instance={instance}
        room={room}
      />
      <ClassInstanceEditDialog
        open={editing}
        onOpenChange={setEditing}
        instance={instance}
      />
    </div>
  );
}
