import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ClassTemplate, IntensityLevel } from '@pilates/api-client';
import { hooks } from '@/lib/api';
import { Seo } from '@/components/site/Seo';
import { Reveal } from '@/components/site/Reveal';
import { Button } from '@/components/ui/button';

type Format = 'reformer' | 'mat' | 'barre' | 'restorative';
type Pace = 'gentle' | 'moderate' | 'hard';

const FORMAT_Q = {
  question: "What sounds like you?",
  options: [
    { value: 'reformer' as Format, label: 'The reformer', hint: 'Spring-loaded machine work' },
    { value: 'mat' as Format, label: 'Mat & bodyweight', hint: 'Classical Pilates on the floor' },
    { value: 'barre' as Format, label: 'Barre & music', hint: 'Small movements, big playlist' },
    { value: 'restorative' as Format, label: 'Slow & restorative', hint: 'Recovery, breath, props' },
  ],
};
const PACE_Q = {
  question: 'How hard do you want to work?',
  options: [
    { value: 'gentle' as Pace, label: 'Gentle', hint: 'Ease in' },
    { value: 'moderate' as Pace, label: 'Moderate', hint: 'A proper session' },
    { value: 'hard' as Pace, label: 'Bring it', hint: 'Sweat and shake' },
  ],
};

const paceToIntensity: Record<Pace, IntensityLevel> = {
  gentle: 'beginner',
  moderate: 'intermediate',
  hard: 'advanced',
};

function score(t: ClassTemplate, fmt: Format, pace: Pace): number {
  let s = 0;
  const label = (t.typeLabel ?? t.classType).toLowerCase();
  if (fmt === 'restorative' && (t.classType === 'other' || label.includes('restor')))
    s += 3;
  else if (fmt === t.classType) s += 3;
  else if (fmt === 'reformer' && t.classType === 'reformer') s += 3;

  const want = paceToIntensity[pace];
  if (t.intensityLevel === want) s += 2;
  else if (
    (want === 'intermediate' && t.intensityLevel !== 'advanced') ||
    (want === 'beginner' && t.intensityLevel === 'intermediate')
  )
    s += 1;
  return s;
}

export function StartPage() {
  const { data: templates } = hooks.useClassTemplates();
  const { data: instructors } = hooks.useInstructors();
  const [fmt, setFmt] = useState<Format | null>(null);
  const [pace, setPace] = useState<Pace | null>(null);

  const pick = useMemo(() => {
    if (!fmt || !pace || !templates) return null;
    const ranked = [...templates.filter((t) => t.active)].sort(
      (a, b) => score(b, fmt, pace) - score(a, fmt, pace),
    );
    return ranked[0] ?? null;
  }, [fmt, pace, templates]);

  const instructor = instructors?.find((i) => i.id === pick?.instructorId);
  const step = !fmt ? 1 : !pace ? 2 : 3;

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <Seo
        title="New to MILE?"
        description="Answer two questions and we'll point you at the right first class."
        path="/start"
      />

      <Reveal>
        <p className="eyebrow">New to MILE?</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tight sm:text-5xl">
          Find your first class
        </h1>
        <p className="mt-3 text-muted">
          Two questions. No wrong answers — every class scales.
        </p>
      </Reveal>

      <div className="mt-10 space-y-8">
        {step >= 1 && (
          <QuestionBlock
            n={1}
            active={step === 1}
            question={FORMAT_Q.question}
            answered={fmt ? FORMAT_Q.options.find((o) => o.value === fmt)?.label : undefined}
            onReset={() => {
              setFmt(null);
              setPace(null);
            }}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {FORMAT_Q.options.map((o) => (
                <Choice
                  key={o.value}
                  label={o.label}
                  hint={o.hint}
                  onClick={() => setFmt(o.value)}
                />
              ))}
            </div>
          </QuestionBlock>
        )}

        {step >= 2 && (
          <QuestionBlock
            n={2}
            active={step === 2}
            question={PACE_Q.question}
            answered={pace ? PACE_Q.options.find((o) => o.value === pace)?.label : undefined}
            onReset={() => setPace(null)}
          >
            <div className="grid gap-2 sm:grid-cols-3">
              {PACE_Q.options.map((o) => (
                <Choice
                  key={o.value}
                  label={o.label}
                  hint={o.hint}
                  onClick={() => setPace(o.value)}
                />
              ))}
            </div>
          </QuestionBlock>
        )}

        {step === 3 && pick && (
          <Reveal className="rounded-lg border border-primary/40 bg-primary/[0.04] p-6">
            <p className="eyebrow text-primary">We'd start you with</p>
            <h2 className="mt-1 font-display text-3xl font-light tracking-tight">
              {pick.name}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {pick.whoItsFor ?? pick.description}
            </p>
            <p className="mt-2 text-xs text-muted">
              {pick.durationMinutes} min
              {instructor ? ` · with ${instructor.name}` : ''}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link to={`/classes/${pick.slug}`}>About this class</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/schedule">See when it's on</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted">
              Prefer to browse?{' '}
              <Link to="/classes" className="text-primary underline">
                All classes
              </Link>{' '}
              ·{' '}
              <Link to="/pricing" className="text-primary underline">
                the intro offer
              </Link>
            </p>
          </Reveal>
        )}
      </div>
    </div>
  );
}

function QuestionBlock({
  n,
  active,
  question,
  answered,
  onReset,
  children,
}: {
  n: number;
  active: boolean;
  question: string;
  answered?: string;
  onReset: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={active ? '' : 'opacity-70'}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">
          <span className="text-muted">{n}. </span>
          {question}
        </p>
        {answered && (
          <button
            onClick={onReset}
            className="text-xs text-primary hover:underline"
          >
            {answered} · change
          </button>
        )}
      </div>
      {!answered && children}
    </div>
  );
}

function Choice({
  label,
  hint,
  onClick,
}: {
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-md border border-line bg-surface p-3 text-left transition-colors hover:border-primary/50"
    >
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
    </button>
  );
}
