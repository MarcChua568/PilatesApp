import { Link } from 'react-router-dom';
import type { EventItem } from '@pilates/api-client';
import { peso, shortDate } from '@/lib/format';

export function EventCard({ event }: { event: EventItem }) {
  const spotsLeft =
    event.capacity != null ? event.capacity - event.rsvpCount : null;
  const full = spotsLeft != null && spotsLeft <= 0;

  return (
    <Link
      to={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors hover:border-primary/40"
    >
      <div className="aspect-[3/2] overflow-hidden bg-line/40">
        {event.coverImageUrl && (
          <img
            src={event.coverImageUrl}
            alt=""
            className="editorial-img h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow text-accent">{shortDate(event.startsAt)}</p>
        <p className="mt-1 font-display text-xl leading-snug">{event.title}</p>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">
          {event.summary}
        </p>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-medium">
            {event.pricePhp === 0 ? 'Free' : peso(event.pricePhp)}
          </span>
          <span className="text-muted">
            {full
              ? 'Fully booked'
              : spotsLeft != null
                ? `${spotsLeft} place${spotsLeft === 1 ? '' : 's'} left`
                : 'Open'}
          </span>
        </div>
      </div>
    </Link>
  );
}
