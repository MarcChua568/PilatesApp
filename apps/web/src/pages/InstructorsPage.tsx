import { hooks } from '@/lib/api';
import { Reveal } from '@/components/site/Reveal';

export function InstructorsPage() {
  const { data: instructors, isLoading } = hooks.useInstructors();

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <Reveal>
        <p className="eyebrow">The team</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tightpx">
          Instructors
        </h1>
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
              <div className="aspect-[4/5] w-full shrink-0 overflow-hidden rounded-lg border border-line bg-line/40 sm:w-64">
                {ins.photoUrl && (
                  <img
                    src={ins.photoUrl}
                    alt={ins.name}
                    className="editorial-img h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 self-center">
                <h2 className="font-display text-2xl font-light tracking-tightpx">
                  {ins.name}
                </h2>
                <p className="mt-3 max-w-prose leading-relaxed text-muted">
                  {ins.bio ?? 'Bio coming soon.'}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
