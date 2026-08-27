import { cn } from '@pilates/ui';
import type { RecurrenceRule } from '@pilates/api-client';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type RecurrenceValue = RecurrenceRule;

export function RecurrenceEditor({
  value,
  onChange,
}: {
  value: RecurrenceValue;
  onChange: (v: RecurrenceValue) => void;
}) {
  const toggleDay = (d: number) => {
    const set = new Set(value.daysOfWeek);
    if (set.has(d)) set.delete(d);
    else set.add(d);
    onChange({ ...value, daysOfWeek: [...set].sort((a, b) => a - b) });
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-eyebrow text-muted">
          Weekdays
        </p>
        <div className="flex gap-1">
          {DAYS.map((label, d) => (
            <button
              key={d}
              type="button"
              aria-pressed={value.daysOfWeek.includes(d)}
              onClick={() => toggleDay(d)}
              className={cn(
                'h-9 w-11 rounded-md border text-xs transition-colors',
                value.daysOfWeek.includes(d)
                  ? 'border-primary bg-primary text-primary-fg'
                  : 'border-line text-muted hover:bg-line/40',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {value.daysOfWeek.length === 0 && (
          <p className="mt-1 text-xs text-danger">Pick at least one weekday.</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Time" htmlFor="rec-time">
          <Input
            id="rec-time"
            type="time"
            value={value.startTime}
            onChange={(e) => onChange({ ...value, startTime: e.target.value })}
          />
        </Field>
        <Field label="Start date" htmlFor="rec-start">
          <Input
            id="rec-start"
            type="date"
            value={value.startDate}
            onChange={(e) => onChange({ ...value, startDate: e.target.value })}
          />
        </Field>
        <Field label="End date" htmlFor="rec-end">
          <Input
            id="rec-end"
            type="date"
            value={value.endDate}
            onChange={(e) => onChange({ ...value, endDate: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}

export function recurrenceSummary(raw: string): string {
  try {
    const r = JSON.parse(raw) as RecurrenceValue;
    const days = r.daysOfWeek.map((d) => DAYS[d]).join('/');
    return `${days} ${r.startTime}`;
  } catch {
    return '—';
  }
}
