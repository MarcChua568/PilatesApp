import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { CheckCircle2, Clock } from 'lucide-react';
import { hooks } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function BookingConfirmationPage() {
  const { bookingId = '' } = useParams();
  const { data: myBookings, isLoading } = hooks.useMyBookings();
  const { data: instances } = hooks.useClassInstances({});

  const booking = myBookings?.find((b) => b.id === bookingId);
  const instance = instances?.find(
    (c) => c.id === booking?.classInstanceId,
  );

  if (isLoading) return <p className="text-muted">Loading…</p>;
  if (!booking) {
    return (
      <div>
        <p className="text-muted">We couldn’t find that booking.</p>
        <Link to="/bookings" className="text-primary underline">
          My bookings
        </Link>
      </div>
    );
  }

  const waitlisted = booking.status === 'waitlisted';

  return (
    <div className="py-6 text-center">
      {waitlisted ? (
        <Clock className="mx-auto h-10 w-10 text-muted" />
      ) : (
        <CheckCircle2 className="mx-auto h-10 w-10 text-accent" />
      )}
      <h1 className="mt-3 text-2xl">
        {waitlisted ? 'You’re on the waitlist' : 'You’re booked'}
      </h1>

      <Card className="mt-6 text-left">
        <CardContent className="space-y-1 pt-5">
          <p className="text-lg font-light">{instance?.name}</p>
          {instance && (
            <p className="text-sm text-muted">
              {format(new Date(instance.startTime), 'EEEE d MMMM · HH:mm')}
            </p>
          )}
          {booking.spot?.label && (
            <p className="text-sm text-muted">Spot {booking.spot.label}</p>
          )}
          {waitlisted && booking.waitlistPosition && (
            <p className="text-sm text-muted">
              Position {booking.waitlistPosition}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-2">
        <Button asChild variant="outline" className="flex-1">
          <Link to="/schedule">Back to schedule</Link>
        </Button>
        <Button asChild className="flex-1">
          <Link to="/bookings">My bookings</Link>
        </Button>
      </div>
    </div>
  );
}
