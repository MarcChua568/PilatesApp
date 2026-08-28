import { Badge } from '@/components/ui/badge';
import type { Availability } from '@/lib/availability';

export function AvailabilityPill({ a }: { a: Availability }) {
  switch (a.state) {
    case 'booked':
      return <Badge tone="accent">Booked</Badge>;
    case 'offered':
      return <Badge tone="primary">Spot offered!</Badge>;
    case 'waitlisted':
      return (
        <Badge tone="muted">
          Waitlist{a.waitlistPosition ? ` #${a.waitlistPosition}` : ''}
        </Badge>
      );
    case 'full':
      return <Badge tone="muted">Full · join waitlist</Badge>;
    default:
      return (
        <Badge tone="neutral">
          {a.spotsLeft} spot{a.spotsLeft === 1 ? '' : 's'}
        </Badge>
      );
  }
}
