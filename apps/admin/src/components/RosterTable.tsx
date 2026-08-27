import type { Booking, Room } from '@pilates/api-client';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STATUS_TONE = {
  booked: 'primary',
  waitlisted: 'muted',
  attended: 'accent',
  no_show: 'danger',
  cancelled: 'muted',
} as const;

function attendeeName(b: Booking): string {
  if (b.member) return b.member.fullName;
  if (b.guestName) return b.guestName;
  return 'Member';
}

export function RosterTable({
  bookings,
  room,
  onCheckIn,
  onNoShow,
  onCancel,
  isMutating,
}: {
  bookings: Booking[];
  room?: Room;
  onCheckIn: (bookingId: string) => void;
  onNoShow: (bookingId: string) => void;
  onCancel: (bookingId: string) => void;
  isMutating: boolean;
}) {
  const booked = bookings.filter((b) => b.status === 'booked');
  const waitlisted = bookings
    .filter((b) => b.status === 'waitlisted')
    .sort((a, b) => (a.waitlistPosition ?? 0) - (b.waitlistPosition ?? 0));
  const resolved = bookings.filter((b) =>
    ['attended', 'no_show', 'cancelled'].includes(b.status),
  );

  const Row = ({ b, actions }: { b: Booking; actions?: boolean }) => (
    <TR>
      <TD>
        {attendeeName(b)}
        {!b.member && (
          <Badge tone="muted" className="ml-1">
            guest
          </Badge>
        )}
      </TD>
      {room?.hasAssignedSpots && (
        <TD className="text-muted">
          {b.spot?.label ? `Spot ${b.spot.label}` : '—'}
        </TD>
      )}
      <TD>
        <Badge tone={STATUS_TONE[b.status]}>
          {b.status === 'waitlisted' && b.waitlistPosition
            ? `waitlist #${b.waitlistPosition}`
            : b.status.replace('_', ' ')}
        </Badge>
      </TD>
      <TD className="text-right">
        {actions && (
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={isMutating}
              onClick={() => onCheckIn(b.id)}
            >
              Check in
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isMutating}
              onClick={() => onNoShow(b.id)}
            >
              No-show
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isMutating}
              onClick={() => onCancel(b.id)}
            >
              Cancel
            </Button>
          </div>
        )}
        {b.status === 'waitlisted' && (
          <Button
            size="sm"
            variant="ghost"
            disabled={isMutating}
            onClick={() => onCancel(b.id)}
          >
            Remove
          </Button>
        )}
      </TD>
    </TR>
  );

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow mb-2">Booked · {booked.length}</p>
        <Table>
          <THead>
            <TR>
              <TH>Attendee</TH>
              {room?.hasAssignedSpots && <TH>Spot</TH>}
              <TH>Status</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {booked.length === 0 && (
              <TR>
                <TD colSpan={4} className="py-4 text-muted">
                  No one booked yet.
                </TD>
              </TR>
            )}
            {booked.map((b) => (
              <Row key={b.id} b={b} actions />
            ))}
          </TBody>
        </Table>
      </section>

      {waitlisted.length > 0 && (
        <section>
          <p className="eyebrow mb-2">Waitlist · {waitlisted.length}</p>
          <Table>
            <TBody>
              {waitlisted.map((b) => (
                <Row key={b.id} b={b} />
              ))}
            </TBody>
          </Table>
        </section>
      )}

      {resolved.length > 0 && (
        <section>
          <p className="eyebrow mb-2">Resolved · {resolved.length}</p>
          <Table>
            <TBody>
              {resolved.map((b) => (
                <Row key={b.id} b={b} />
              ))}
            </TBody>
          </Table>
        </section>
      )}
    </div>
  );
}
