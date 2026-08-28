import { useMemo } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { addDays } from 'date-fns';
import { hooks } from '@/lib/api';
import { useAuth } from '@/auth/useAuth';
import { shortDate, time } from '@/lib/format';
import { SITE } from '@/lib/seo';
import { Seo } from '@/components/site/Seo';
import { Reveal } from '@/components/site/Reveal';
import { Button } from '@/components/ui/button';

export function InstructorDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: instructors, isLoading } = hooks.useInstructors();
  const { data: templates } = hooks.useClassTemplates();

  const range = useMemo(
    () => ({
      from: new Date().toISOString(),
      to: addDays(new Date(), 21).toISOString(),
    }),
    [],
  );
  const { data: instances } = hooks.useClassInstances(range);

  const instructor = instructors?.find((i) => i.id === id);

  if (isLoading) {
    return <div className="mx-auto max-w-4xl px-5 py-20 text-sm text-muted">Loading…</div>;
  }
  if (!instructor) return <Navigate to="/instructors" replace />;

  const theirTemplates = (templates ?? []).filter(
    (t) => t.instructorId === instructor.id && t.active,
  );
  const theirClasses = (instances ?? [])
    .filter(
      (c) => c.instructorId === instructor.id && c.status === 'scheduled',
    )
    .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))
    .slice(0, 6);

  const openClass = (cid: string) =>
    navigate(
      user ? `/book/class/${cid}` : '/login',
      user ? undefined : { state: { from: { pathname: `/book/class/${cid}` } } },
    );

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: instructor.name,
    jobTitle: 'Movement instructor',
    worksFor: { '@type': 'Organization', name: SITE.name },
    image: instructor.photoUrl ?? undefined,
    description: instructor.bio ?? undefined,
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <Seo
        title={instructor.name}
        description={instructor.bio ?? `${instructor.name} teaches at ${SITE.name}.`}
        path={`/instructors/${instructor.id}`}
        type="profile"
        image={instructor.photoUrl ?? undefined}
        jsonLd={ld}
      />

      <Link to="/instructors" className="text-sm text-primary hover:underline">
        ← All instructors
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-[280px_1fr] md:items-start">
        <Reveal>
          <div className="aspect-[4/5] overflow-hidden rounded-lg border border-line bg-line/40">
            {instructor.photoUrl && (
              <img
                src={instructor.photoUrl}
                alt={instructor.name}
                className="editorial-img h-full w-full object-cover"
              />
            )}
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="font-display text-4xl font-light tracking-tight">
            {instructor.name}
          </h1>
          {instructor.specialties.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {instructor.specialties.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-line bg-surface px-3 py-1 text-xs uppercase tracking-eyebrow text-muted"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
          <p className="mt-5 max-w-prose leading-relaxed text-muted">
            {instructor.bio ?? 'Bio coming soon.'}
          </p>

          {theirTemplates.length > 0 && (
            <p className="mt-5 text-sm text-muted">
              Teaches{' '}
              {theirTemplates.map((t, i) => (
                <span key={t.id}>
                  {i > 0 && ', '}
                  <Link
                    to={`/classes/${t.slug}`}
                    className="text-primary hover:underline"
                  >
                    {t.name}
                  </Link>
                </span>
              ))}
              .
            </p>
          )}
        </Reveal>
      </div>

      <section className="mt-14">
        <p className="eyebrow">Upcoming classes with {instructor.name.split(' ')[0]}</p>
        {theirClasses.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Nothing on the timetable in the next three weeks.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {theirClasses.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span>
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted">
                    {' '}
                    · {shortDate(c.startTime)} · {time(c.startTime)}
                  </span>
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
        <Button asChild variant="outline" className="mt-4">
          <Link to="/schedule">Full timetable</Link>
        </Button>
      </section>
    </div>
  );
}
