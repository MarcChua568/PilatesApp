import { format, isSameDay, startOfWeek, addDays } from 'date-fns';
import { cn } from '@pilates/ui';
import type { ClassInstance } from '@pilates/api-client';

export function WeekGrid({
  weekStart,
  instances,
  instructorName,
  roomName,
  onSelect,
}: {
  weekStart: Date;
  instances: ClassInstance[];
  instructorName: (id: string) => string;
  roomName: (id: string) => string;
  onSelect: (id: string) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
      {days.map((day) => {
        const dayClasses = instances
          .filter((c) => isSameDay(new Date(c.startTime), day))
          .sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
          );
        return (
          <div key={day.toISOString()} className="min-w-0">
            <div className="mb-2 border-b border-line pb-1">
              <p className="eyebrow">{format(day, 'EEE')}</p>
              <p className="text-sm">{format(day, 'd MMM')}</p>
            </div>
            <div className="space-y-2">
              {dayClasses.length === 0 && (
                <p className="text-xs text-muted">—</p>
              )}
              {dayClasses.map((c) => {
                const full = c.bookedCount >= c.capacity;
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelect(c.id)}
                    className={cn(
                      'w-full rounded-md border p-2 text-left transition-colors',
                      c.status === 'cancelled'
                        ? 'border-danger/40 bg-danger/5'
                        : 'border-line bg-surface hover:border-primary/40',
                    )}
                  >
                    <p className="eyebrow">{format(new Date(c.startTime), 'HH:mm')}</p>
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted">
                      {instructorName(c.instructorId)} · {roomName(c.roomId)}
                    </p>
                    <div className="mt-1.5">
                      <div className="h-1 overflow-hidden rounded-full bg-line/60">
                        <div
                          className={cn(
                            'h-full',
                            full ? 'bg-danger' : 'bg-accent',
                          )}
                          style={{
                            width: `${Math.min(100, (c.bookedCount / c.capacity) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {c.bookedCount}/{c.capacity}
                        {c.status === 'cancelled' && ' · cancelled'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function weekBounds(anchor: Date) {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  const end = addDays(start, 7);
  return { start, end };
}
