import { useMemo } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { addDays } from 'date-fns';
import { Check } from 'lucide-react';
import { hooks } from '@/lib/api';
import { useAuth } from '@/auth/useAuth';
import { shortDate, time } from '@/lib/format';
import { SITE } from '@/lib/seo';
import { Seo } from '@/components/site/Seo';
import { Reveal } from '@/components/site/Reveal';
import { Button } from '@/components/ui/button';

export function ClassInfoPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: template, isLoading, isError } = hooks.useClassTemplateBySlug(slug);
  const { data: instructors } = hooks.useInstructors();
  const { data: rooms } = hooks.useRooms();

  const range = useMemo(
    () => ({
      from: new Date().toISOString(),
      to: addDays(new Date(), 21).toISOString(),
    }),
    [],
  );
  const { data: instances } = hooks.useClassInstances(range);

  if (isLoading) {
    return <div className="mx-auto max-w-5xl px-5 py-20 text-sm text-muted">Loading…</div>;
  }
  if (isError || !template) return <Navigate to="/classes" replace />;

  const instructor = instructors?.find((i) => i.id === template.instructorId);
  const room = rooms?.find((r) => r.id === template.roomId);
  const upcoming = (instances ?? [])
    .filter((c) => c.templateId === template.id && c.status === 'scheduled')
    .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))
    .slice(0, 5);

  const openClass = (id: string) => {
    navigate(
      user ? `/book/class/${id}` : '/login',
      user ? undefined : { state: { from: { pathname: `/book/class/${id}` } } },
    );
  };

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: template.name,
    description: template.longDescription ?? template.description ?? '',
    provider: { '@type': 'Organization', name: SITE.name, sameAs: SITE.url },
  };

  return (
    <div>
      <Seo
        title={template.name}
        description={template.description ?? undefined}
        path={`/classes/${template.slug}`}
        image={template.heroImageUrl ?? undefined}
        jsonLd={ld}
      />

      <section className="relative flex min-h-[56vh] items-end overflow-hidden">
        {template.heroImageUrl && (
          <img
            src={template.heroImageUrl}
            alt=""
            className="editorial-img absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-deep/85 to-deep/20" />
        <div className="relative mx-auto w-full max-w-5xl px-5 pb-12 text-deep-fg">
          <Reveal>
            <p className="eyebrow text-deep-fg/70">
              {template.typeLabel ?? template.classType} · {template.intensityLevel}
            </p>
            <h1 className="mt-2 font-display text-4xl font-light tracking-tight sm:text-6xl">
              {template.name}
            </h1>
            <p className="mt-3 text-deep-fg/80">
              {template.durationMinutes} min
              {room ? ` · ${room.name}` : ''}
              {instructor ? ` · with ${instructor.name}` : ''}
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-12 px-5 py-14 md:grid-cols-[1.6fr_1fr]">
        <div className="space-y-10">
          <Reveal>
            <p className="whitespace-pre-line text-lg leading-relaxed text-ink/90">
              {template.longDescription ?? template.description}
            </p>
          </Reveal>

          {template.whoItsFor && (
            <Reveal>
              <p className="eyebrow">Who it's for</p>
              <p className="mt-2 text-muted">{template.whoItsFor}</p>
            </Reveal>
          )}

          {template.whatToBring.length > 0 && (
            <Reveal>
              <p className="eyebrow">What to bring</p>
              <ul className="mt-3 space-y-2 text-sm">
                {template.whatToBring.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          {instructor && (
            <Reveal>
              <p className="eyebrow">Your instructor</p>
              <div className="mt-3 flex gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-line/50">
                  {instructor.photoUrl && (
                    <img
                      src={instructor.photoUrl}
                      alt={instructor.name}
                      className="editorial-img h-full w-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <Link
                    to={`/instructors/${instructor.id}`}
                    className="font-display text-lg hover:text-primary"
                  >
                    {instructor.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted">{instructor.bio}</p>
                  <Link
                    to={`/instructors/${instructor.id}`}
                    className="mt-1 inline-block text-sm text-primary hover:underline"
                  >
                    See their classes →
                  </Link>
                </div>
              </div>
            </Reveal>
          )}
        </div>

        <Reveal delay={0.1}>
          <div className="sticky top-24 rounded-lg border border-line bg-surface p-5">
            <p className="eyebrow">Next classes</p>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Nothing scheduled in the next three weeks.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {upcoming.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <span>
                      {shortDate(c.startTime)}
                      <span className="text-muted"> · {time(c.startTime)}</span>
                    </span>
                    <button
                      onClick={() => openClass(c.id)}
                      className="text-primary hover:underline"
                    >
                      Book
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to="/schedule">Full timetable</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
