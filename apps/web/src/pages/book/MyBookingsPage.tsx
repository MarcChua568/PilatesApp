import { Link } from 'react-router-dom';
import { hooks } from '@/lib/api';
import { errorMessage, toast } from '@/lib/toast';
import { BookingCard } from '@/components/BookingCard';

export function MyBookingsPage() {
  const { data: bookings, isLoading, error } = hooks.useMyBookings();
  const { data: instances } = hooks.useClassInstances({});
  const cancel = hooks.useCancelMyBookingMutation();
  const accept = hooks.useAcceptOfferMutation();
  const busy = cancel.isPending || accept.isPending;

  const instanceFor = (id: string) => instances?.find((c) => c.id === id);
  const startOf = (id: string) => {
    const ci = instanceFor(id);
    return ci ? new Date(ci.startTime).getTime() : 0;
  };

  const active = (bookings ?? [])
    .filter((b) => b.status === 'booked' || b.status === 'waitlisted')
    .filter((b) => startOf(b.classInstanceId) >= Date.now())
    .sort((a, b) => startOf(a.classInstanceId) - startOf(b.classInstanceId));
  const past = (bookings ?? [])
    .filter(
      (b) =>
        ['attended', 'no_show', 'cancelled'].includes(b.status) ||
        startOf(b.classInstanceId) < Date.now(),
    )
    .sort((a, b) => startOf(b.classInstanceId) - startOf(a.classInstanceId));

  const onCancel = (id: string) =>
    cancel.mutate(id, {
      onSuccess: (res) =>
        toast.success(
          res.wasLateCancellation ? 'Cancelled (late)' : 'Cancelled',
        ),
      onError: (e) => toast.error(errorMessage(e)),
    });
  const onAccept = (id: string) =>
    accept.mutate(id, {
      onSuccess: () => toast.success('Spot confirmed'),
      onError: (e) => toast.error(errorMessage(e)),
    });

  return (
    <div>
      <h1 className="mb-4 text-2xl">My bookings</h1>

      {isLoading && <p className="text-muted">Loading…</p>}
      {error != null && <p className="text-danger">Couldn’t load your bookings.</p>}

      {bookings && active.length === 0 && past.length === 0 && (
        <p className="text-muted">
          Nothing booked yet.{' '}
          <Link to="/classes" className="text-primary underline">
            Browse the schedule
          </Link>
          .
        </p>
      )}

      {active.length > 0 && (
        <section className="mb-6">
          <p className="eyebrow mb-2">Upcoming</p>
          <div className="space-y-2">
            {active.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                instance={instanceFor(b.classInstanceId)}
                onCancel={onCancel}
                onAccept={onAccept}
                busy={busy}
              />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <p className="eyebrow mb-2">Past</p>
          <div className="space-y-2">
            {past.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                instance={instanceFor(b.classInstanceId)}
                onCancel={onCancel}
                onAccept={onAccept}
                busy={busy}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
