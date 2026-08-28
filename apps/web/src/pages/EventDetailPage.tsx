import { Link, Navigate, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { hooks } from '@/lib/api';
import { useAuth } from '@/auth/useAuth';
import { errorMessage, toast } from '@/lib/toast';
import { peso, longDateTime } from '@/lib/format';
import { SITE } from '@/lib/seo';
import { Seo } from '@/components/site/Seo';
import { Reveal } from '@/components/site/Reveal';
import { Button } from '@/components/ui/button';

export function EventDetailPage() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const { data: event, isLoading, isError } = hooks.useEvent(slug);
  const { data: instructors } = hooks.useInstructors();
  const rsvp = hooks.useRsvpMutation(slug);

  if (isLoading) {
    return <div className="mx-auto max-w-4xl px-5 py-20 text-sm text-muted">Loading…</div>;
  }
  if (isError || !event) return <Navigate to="/events" replace />;

  const host = instructors?.find((i) => i.id === event.hostInstructorId);
  const spotsLeft =
    event.capacity != null ? event.capacity - event.rsvpCount : null;
  const full = spotsLeft != null && spotsLeft <= 0;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.summary,
    startDate: event.startsAt,
    endDate: event.endsAt ?? undefined,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: SITE.name,
      address: `${SITE.streetAddress}, ${SITE.locality}`,
    },
    offers: {
      '@type': 'Offer',
      price: event.pricePhp,
      priceCurrency: 'PHP',
    },
  };

  const doRsvp = () => {
    rsvp.mutate(
      { id: event.id },
      {
        onSuccess: () => toast.success("You're going — see you there."),
        onError: (e) => toast.error(errorMessage(e)),
      },
    );
  };

  return (
    <div>
      <Seo
        title={event.title}
        description={event.summary}
        path={`/events/${event.slug}`}
        type="article"
        image={event.coverImageUrl ?? undefined}
        jsonLd={ld}
      />

      <section className="relative flex min-h-[56vh] items-end overflow-hidden">
        {event.coverImageUrl && (
          <img
            src={event.coverImageUrl}
            alt=""
            className="editorial-img absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-deep/85 to-deep/20" />
        <div className="relative mx-auto w-full max-w-4xl px-5 pb-12 text-deep-fg">
          <Reveal>
            <Link
              to="/events"
              className="text-sm text-deep-fg/70 hover:text-deep-fg"
            >
              ← All events
            </Link>
            <h1 className="mt-3 font-display text-4xl font-light tracking-tightpx sm:text-6xl">
              {event.title}
            </h1>
            <p className="mt-3 text-deep-fg/85">{longDateTime(event.startsAt)}</p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto grid max-w-4xl gap-12 px-5 py-14 md:grid-cols-[1.6fr_1fr]">
        <Reveal>
          <p className="whitespace-pre-line text-lg leading-relaxed text-ink/90">
            {event.body}
          </p>
          {host && (
            <div className="mt-8 flex gap-4 border-t border-line pt-6">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-line/50">
                {host.photoUrl && (
                  <img
                    src={host.photoUrl}
                    alt={host.name}
                    className="editorial-img h-full w-full object-cover"
                  />
                )}
              </div>
              <div>
                <p className="eyebrow">Hosted by</p>
                <p className="font-display text-lg">{host.name}</p>
              </div>
            </div>
          )}
        </Reveal>

        <Reveal delay={0.1}>
          <div className="sticky top-24 rounded-lg border border-line bg-surface p-6">
            <p className="font-display text-2xl">
              {event.pricePhp === 0 ? 'Free' : peso(event.pricePhp)}
            </p>
            <p className="mt-1 text-sm text-muted">
              {full
                ? 'Fully booked'
                : spotsLeft != null
                  ? `${spotsLeft} place${spotsLeft === 1 ? '' : 's'} left`
                  : 'Open to all'}
            </p>

            <div className="mt-5">
              {!user ? (
                <Button asChild className="w-full">
                  <Link
                    to="/login"
                    state={{ from: { pathname: `/events/${event.slug}` } }}
                  >
                    Sign in to RSVP
                  </Link>
                </Button>
              ) : rsvp.isSuccess ? (
                <div className="flex items-center justify-center gap-2 rounded-md bg-accent/15 py-2.5 text-sm text-accent">
                  <Check className="h-4 w-4" /> You're going
                </div>
              ) : (
                <Button
                  className="w-full"
                  disabled={full || rsvp.isPending}
                  onClick={doRsvp}
                >
                  {full ? 'Fully booked' : rsvp.isPending ? 'Saving…' : 'RSVP'}
                </Button>
              )}
            </div>
            <p className="mt-3 text-xs text-muted">
              {event.pricePhp === 0
                ? 'No payment needed.'
                : 'Payment is settled at the studio — checkout isn\'t connected yet.'}
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
