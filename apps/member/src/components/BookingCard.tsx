import { format } from 'date-fns';
import type { Booking, ClassInstance } from '@pilates/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TONE = {
  booked: 'accent',
  waitlisted: 'muted',
  attended: 'neutral',
  no_show: 'danger',
  cancelled: 'muted',
} as const;

export function BookingCard({
  booking,
  instance,
  onCancel,
  onAccept,
  busy,
}: {
  booking: Booking;
  instance?: ClassInstance;
  onCancel: (id: string) => void;
  onAccept: (id: string) => void;
  busy: boolean;
}) {
  const offered = booking.status === 'waitlisted' && booking.promotionOfferedAt;
  const past =
    instance && new Date(instance.startTime).getTime() < Date.now();

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-light">
              {instance?.name ?? 'Class'}
            </p>
            {instance && (
              <p className="text-xs text-muted">
                {format(new Date(instance.startTime), 'EEE d MMM · HH:mm')}
              </p>
            )}
            {booking.spot?.label && (
              <p className="text-xs text-muted">Spot {booking.spot.label}</p>
            )}
          </div>
          <Badge tone={TONE[booking.status]}>
            {booking.status === 'waitlisted' && booking.waitlistPosition
              ? `waitlist #${booking.waitlistPosition}`
              : booking.status.replace('_', ' ')}
          </Badge>
        </div>

        {offered && (
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              disabled={busy}
              onClick={() => onAccept(booking.id)}
            >
              Accept spot
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => onCancel(booking.id)}
            >
              Decline
            </Button>
          </div>
        )}

        {!offered && !past && booking.status === 'booked' && (
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            disabled={busy}
            onClick={() => onCancel(booking.id)}
          >
            Cancel
          </Button>
        )}
        {!offered && !past && booking.status === 'waitlisted' && (
          <Button
            size="sm"
            variant="ghost"
            className="mt-3"
            disabled={busy}
            onClick={() => onCancel(booking.id)}
          >
            Leave waitlist
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
