import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { differenceInHours, format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { hooks } from '@/lib/api';
import { errorMessage, toast } from '@/lib/toast';
import { availabilityFor } from '@/lib/availability';
import { SpotPicker } from '@/components/SpotPicker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function ClassDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: instance, isLoading } = hooks.useClassInstance(id);
  const { data: rooms } = hooks.useRooms();
  const { data: instructors } = hooks.useInstructors();
  const { data: myBookings } = hooks.useMyBookings();
  const { data: settings } = hooks.useSettings();
  const room = rooms?.find((r) => r.id === instance?.roomId);
  const { data: spotMap } = hooks.useSpotMap(
    room?.hasAssignedSpots ? id : undefined,
  );

  const [spotId, setSpotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const book = hooks.useBookMutation();
  const cancel = hooks.useCancelMyBookingMutation();
  const acceptOffer = hooks.useAcceptOfferMutation();

  if (isLoading || !instance) {
    return <p className="text-muted">Loading…</p>;
  }

  const instructor = instructors?.find((i) => i.id === instance.instructorId);
  const a = availabilityFor(instance, myBookings ?? []);
  const hoursUntil = differenceInHours(new Date(instance.startTime), new Date());
  const withinWindow =
    settings && hoursUntil < settings.cancellationWindowHours;

  const doBook = () => {
    setError(null);
    book.mutate(
      {
        classInstanceId: instance.id,
        spotId: room?.hasAssignedSpots ? spotId ?? undefined : undefined,
      },
      {
        onSuccess: (rows) => navigate(`/book/confirmation/${rows[0].id}`),
        onError: (e) => setError(errorMessage(e)),
      },
    );
  };

  return (
    <div>
      <Link
        to="/classes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted"
      >
        <ArrowLeft className="h-4 w-4" /> Schedule
      </Link>

      <p className="eyebrow mb-1">
        {format(new Date(instance.startTime), 'EEEE d MMMM · HH:mm')}
      </p>
      <h1 className="text-2xl">{instance.name}</h1>
      <p className="mt-1 text-muted">
        {instructor?.name}
        {instance.substitute && ' (sub)'} · {room?.name} ·{' '}
        {instance.durationMinutes} min
      </p>

      {instance.status === 'cancelled' && (
        <Badge tone="danger" className="mt-3">
          This class was cancelled
        </Badge>
      )}

      <div className="mt-6">
        {a.state === 'booked' && (
          <Card>
            <CardContent className="space-y-3 pt-5">
              <p className="text-sm">
                <Badge tone="accent">You’re booked</Badge>
              </p>
              {withinWindow && (
                <p className="text-xs text-danger">
                  Cancelling now is within the {settings?.cancellationWindowHours}
                  h window and counts as a late cancellation.
                </p>
              )}
              <Button
                variant="outline"
                className="w-full"
                disabled={cancel.isPending}
                onClick={() =>
                  a.bookingId &&
                  cancel.mutate(a.bookingId, {
                    onSuccess: (res) =>
                      toast.success(
                        res.wasLateCancellation
                          ? 'Cancelled (late)'
                          : 'Booking cancelled',
                      ),
                    onError: (e) => toast.error(errorMessage(e)),
                  })
                }
              >
                Cancel booking
              </Button>
            </CardContent>
          </Card>
        )}

        {a.state === 'offered' && (
          <Card>
            <CardContent className="space-y-3 pt-5">
              <p className="text-sm">
                <Badge tone="primary">A spot opened up for you</Badge>
              </p>
              <Button
                className="w-full"
                disabled={acceptOffer.isPending}
                onClick={() =>
                  a.bookingId &&
                  acceptOffer.mutate(a.bookingId, {
                    onSuccess: () => {
                      toast.success('Spot confirmed');
                      navigate("/book/bookings");
                    },
                    onError: (e) => toast.error(errorMessage(e)),
                  })
                }
              >
                Accept spot
              </Button>
            </CardContent>
          </Card>
        )}

        {a.state === 'waitlisted' && (
          <p className="text-sm text-muted">
            You’re on the waitlist
            {a.waitlistPosition ? ` (position ${a.waitlistPosition})` : ''}. We’ll
            offer you a spot if one frees up.
          </p>
        )}

        {(a.state === 'open' || a.state === 'full') &&
          instance.status === 'scheduled' && (
            <div className="space-y-4">
              {room?.hasAssignedSpots && a.state === 'open' && spotMap && (
                <SpotPicker
                  spots={spotMap}
                  value={spotId}
                  onChange={setSpotId}
                />
              )}
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button
                className="w-full"
                disabled={
                  book.isPending ||
                  (room?.hasAssignedSpots && a.state === 'open' && !spotId)
                }
                onClick={doBook}
              >
                {a.state === 'full'
                  ? 'Join the waitlist'
                  : book.isPending
                    ? 'Booking…'
                    : 'Book this class'}
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
