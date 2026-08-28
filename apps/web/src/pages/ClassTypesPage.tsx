import { Link } from 'react-router-dom';
import { hooks } from '@/lib/api';
import { Seo } from '@/components/site/Seo';
import { Reveal } from '@/components/site/Reveal';

export function ClassTypesPage() {
  const { data: templates, isLoading } = hooks.useClassTemplates();
  const { data: instructors } = hooks.useInstructors();
  const active = (templates ?? []).filter((t) => t.active);
  const ins = (id: string) => instructors?.find((i) => i.id === id);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <Seo
        title="Classes"
        description="Reformer, mat and barre at MILE — what each class is, who it's for, and what to bring."
        path="/classes"
      />

      <Reveal>
        <p className="eyebrow">Classes</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tightpx sm:text-5xl">
          Reformer, mat &amp; barre
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Every class is capped small and taught by an instructor who watches
          you. New to MILE? Start with a beginner track or the intro offer.
        </p>
        <Link
          to="/schedule"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          See this week's timetable →
        </Link>
      </Reveal>

      {isLoading ? (
        <p className="mt-12 text-sm text-muted">Loading…</p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {active.map((t, i) => (
            <Reveal key={t.id} delay={(i % 2) * 0.05}>
              <Link
                to={`/classes/${t.slug}`}
                className="group flex overflow-hidden rounded-lg border border-line bg-surface transition-colors hover:border-primary/40"
              >
                <div className="aspect-square w-2/5 shrink-0 overflow-hidden bg-line/40">
                  {t.heroImageUrl && (
                    <img
                      src={t.heroImageUrl}
                      alt=""
                      className="editorial-img h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="eyebrow text-accent">
                    {t.typeLabel ?? t.classType} · {t.intensityLevel}
                  </p>
                  <p className="mt-1 font-display text-xl">{t.name}</p>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">
                    {t.description}
                  </p>
                  <p className="mt-3 text-xs text-muted">
                    {t.durationMinutes} min · with {ins(t.instructorId)?.name ?? 'the MILE team'}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
