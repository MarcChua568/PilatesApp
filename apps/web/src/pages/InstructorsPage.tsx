import { Link } from 'react-router-dom';
import { hooks } from '@/lib/api';
import { Seo } from '@/components/site/Seo';
import { Reveal } from '@/components/site/Reveal';

export function InstructorsPage() {
  const { data: instructors, isLoading } = hooks.useInstructors();

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <Seo
        title="Instructors"
        description="Meet the MILE teaching team — reformer, mat and barre specialists in Salcedo Village, Makati."
        path="/instructors"
      />

      <Reveal>
        <p className="eyebrow">The team</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tight sm:text-5xl">
          Instructors
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Small classes mean your instructor actually sees you. Here's who
          you'll train with.
        </p>
      </Reveal>

      {isLoading && <p className="mt-8 text-muted">Loading…</p>}

      <div className="mt-10 space-y-14">
        {(instructors ?? []).map((ins, i) => (
          <Reveal key={ins.id} delay={(i % 2) * 0.06}>
            <div
              className={`flex flex-col gap-6 sm:flex-row sm:gap-10 ${
                i % 2 ? 'sm:flex-row-reverse' : ''
              }`}
            >
              <Link
                to={`/instructors/${ins.id}`}
                className="group aspect-[4/5] w-full shrink-0 overflow-hidden rounded-lg border border-line bg-line/40 sm:w-64"
              >
                {ins.photoUrl && (
                  <img
                    src={ins.photoUrl}
                    alt={ins.name}
                    className="editorial-img h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
                  />
                )}
              </Link>
              <div className="flex-1 self-center">
                <h2 className="font-display text-2xl font-light tracking-tight">
                  <Link
                    to={`/instructors/${ins.id}`}
                    className="hover:text-primary"
                  >
                    {ins.name}
                  </Link>
                </h2>
                {ins.specialties.length > 0 && (
                  <p className="mt-1 text-xs uppercase tracking-eyebrow text-accent">
                    {ins.specialties.join(' · ')}
                  </p>
                )}
                <p className="mt-3 max-w-prose leading-relaxed text-muted">
                  {ins.bio ?? 'Bio coming soon.'}
                </p>
                <Link
                  to={`/instructors/${ins.id}`}
                  className="mt-3 inline-block text-sm text-primary hover:underline"
                >
                  Profile &amp; classes →
                </Link>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
