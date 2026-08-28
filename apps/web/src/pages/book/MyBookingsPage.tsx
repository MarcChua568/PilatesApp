import { Link } from 'react-router-dom';
import { hooks } from '@/lib/api';
import { errorMessage, toast } from '@/lib/toast';
import { shortDate } from '@/lib/format';
import { BookingCard } from '@/components/BookingCard';
import { Button } from '@/components/ui/button';

export function MyBookingsPage() {
  const { data: bookings, isLoading, error } = hooks.useMyBookings();
  const { data: instances } = hooks.useClassInstances({});
  const { data: eventRsvps } = hooks.useMyEventRsvps();
  const cancel = hooks.useCancelMyBookingMutation();
  const accept = hooks.useAcceptOfferMutation();
  const cancelRsvp = hooks.useCancelRsvpMutation();
  const busy = cancel.isPending || accept.isPending;

  const upcomingRsvps = (eventRsvps ?? [])
    .filter((r) => r.event && new Date(r.event.startsAt).getTime() >= Date.now())
    .sort(
      (a, b) =>
        +new Date(a.event!.startsAt) - +new Date(b.event!.startsAt),
    );

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
      <h1 className="mb-4 font-display text-2xl font-light tracking-tight">
        My bookings
      </h1>

      {upcomingRsvps.length > 0 && (
        <section className="mb-8">
          <p className="eyebrow mb-2">Events you're going to</p>
          <div className="space-y-2">
            {upcomingRsvps.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border border-line bg-surface px-4 py-3 text-sm"
              >
                <div>
                  <Link
                    to={`/events/${r.event!.slug}`}
                    className="font-medium hover:text-primary"
                  >
                    {r.event!.title}
                  </Link>
                  <p className="text-muted">
                    {shortDate(r.event!.startsAt)}
                    {r.guests > 0 && ` · +${r.guests} guest${r.guests > 1 ? 's' : ''}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={cancelRsvp.isPending}
                  onClick={() =>
                    cancelRsvp.mutate(r.eventId, {
                      onSuccess: () => toast.success('RSVP cancelled'),
                      onError: (e) => toast.error(errorMessage(e)),
                    })
                  }
                >
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

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
