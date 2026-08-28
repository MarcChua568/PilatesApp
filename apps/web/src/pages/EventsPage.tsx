import { hooks } from '@/lib/api';
import { SITE } from '@/lib/seo';
import { Seo } from '@/components/site/Seo';
import { Reveal } from '@/components/site/Reveal';
import { SectionHeading } from '@/components/site/SectionHeading';
import { EventCard } from '@/components/site/EventCard';

export function EventsPage() {
  const { data: events, isLoading } = hooks.useEvents();
  const now = Date.now();
  const upcoming = (events ?? [])
    .filter((e) => new Date(e.startsAt).getTime() >= now)
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const past = (events ?? [])
    .filter((e) => new Date(e.startsAt).getTime() < now)
    .sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt));

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: upcoming.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE.url}/events/${e.slug}`,
      name: e.title,
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <Seo
        title="Events & workshops"
        description="Workshops, community classes and special events at MILE Wellness in Makati."
        path="/events"
        jsonLd={ld}
      />

      <Reveal>
        <p className="eyebrow">What's on</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tightpx sm:text-5xl">
          Events &amp; workshops
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Deeper dives, guest teachers, community classes and the occasional
          brunch. Members get first pick.
        </p>
      </Reveal>

      {isLoading ? (
        <p className="mt-12 text-sm text-muted">Loading…</p>
      ) : (
        <>
          <div className="mt-10">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted">
                Nothing on the calendar right now — check back soon.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((e) => (
                  <Reveal key={e.id}>
                    <EventCard event={e} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>

          {past.length > 0 && (
            <div className="mt-20">
              <SectionHeading eyebrow="Recently at MILE" title="Past events" />
              <div className="grid gap-5 opacity-80 sm:grid-cols-2 lg:grid-cols-3">
                {past.slice(0, 3).map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
