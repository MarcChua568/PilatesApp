import { cn } from '@pilates/ui';
import type { SpotMapEntry } from '@pilates/api-client';

export function SpotPicker({
  spots,
  value,
  onChange,
}: {
  spots: SpotMapEntry[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  const groups = new Map<string, SpotMapEntry[]>();
  for (const s of [...spots].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const g = s.positionGroup ?? 'Room';
    groups.set(g, [...(groups.get(g) ?? []), s]);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {[...groups.entries()].map(([g, list]) => (
          <div key={g}>
            <p className="mb-1.5 text-xs uppercase tracking-eyebrow text-muted">
              {g}
            </p>
            <div className="flex flex-wrap gap-2">
              {list.map((s) => {
                const disabled = s.state === 'taken' || s.state === 'blocked';
                const isSelected = value === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={disabled}
                    aria-pressed={isSelected}
                    onClick={() => onChange(s.id)}
                    className={cn(
                      'grid h-11 w-11 place-items-center rounded-md border text-sm transition-colors',
                      disabled && 'cursor-not-allowed border-dashed border-muted/40 text-muted/50',
                      s.state === 'mine' && 'border-accent bg-accent/15 text-accent',
                      s.state === 'open' && !isSelected && 'border-line bg-surface hover:border-primary/50',
                      isSelected && 'border-primary bg-primary text-primary-fg',
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted">
        <Legend className="border-line bg-surface" label="Available" />
        <Legend className="border-dashed border-muted/40" label="Taken" />
        <Legend className="border-accent bg-accent/15" label="Yours" />
        <Legend className="border-primary bg-primary" label="Selected" />
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('h-4 w-4 rounded-sm border', className)} />
      {label}
    </span>
  );
}
