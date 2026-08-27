import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, format, isSameDay } from 'date-fns';
import { cn } from '@pilates/ui';
import { hooks } from '@/lib/api';
import { availabilityFor } from '@/lib/availability';
import { AvailabilityPill } from '@/components/AvailabilityPill';

const DAYS_AHEAD = 14;

export function SchedulePage() {
  const navigate = useNavigate();
  const [day, setDay] = useState(0);
  const days = useMemo(
    () => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(new Date(), i)),
    [],
  );
  // Stable across renders — a fresh Date().toISOString() every render would
  // change the query key on every tick and the query would never settle.
  const range = useMemo(
    () => ({
      from: new Date().toISOString(),
      to: addDays(new Date(), DAYS_AHEAD).toISOString(),
    }),
    [],
  );

  const { data: instances, isLoading, error } = hooks.useClassInstances(range);
  const { data: myBookings } = hooks.useMyBookings();
  const { data: instructors } = hooks.useInstructors();
  const { data: rooms } = hooks.useRooms();

  const selected = days[day];
  const dayClasses = (instances ?? [])
    .filter((c) => isSameDay(new Date(c.startTime), selected))
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  const iName = (id: string) => instructors?.find((i) => i.id === id)?.name ?? '';
  const rName = (id: string) => rooms?.find((r) => r.id === id)?.name ?? '';

  return (
    <div>
      <h1 className="mb-4 text-2xl">Schedule</h1>

      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
        {days.map((d, i) => (
          <button
            key={i}
            onClick={() => setDay(i)}
            className={cn(
              'flex shrink-0 flex-col items-center rounded-md border px-3 py-1.5',
              i === day
                ? 'border-primary bg-primary text-primary-fg'
                : 'border-line text-muted',
            )}
          >
            <span className="text-[11px] uppercase tracking-eyebrow">
              {i === 0 ? 'Today' : format(d, 'EEE')}
            </span>
            <span className="text-sm">{format(d, 'd MMM')}</span>
          </button>
        ))}
      </div>

      {isLoading && <p className="text-muted">Loading classes…</p>}
      {error != null && <p className="text-danger">Couldn’t load the schedule.</p>}
      {instances && dayClasses.length === 0 && (
        <p className="text-muted">No classes on this day.</p>
      )}

      <div className="space-y-2">
        {dayClasses.map((c) => {
          const a = availabilityFor(c, myBookings ?? []);
          return (
            <button
              key={c.id}
              onClick={() => navigate(`/schedule/${c.id}`)}
              className={cn(
                'flex w-full items-center justify-between rounded-md border border-line bg-surface p-3 text-left',
                c.status === 'cancelled' && 'opacity-50',
              )}
            >
              <div className="min-w-0">
                <p className="eyebrow">
                  {format(new Date(c.startTime), 'HH:mm')} · {c.durationMinutes}m
                </p>
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted">
                  {iName(c.instructorId)}
                  {c.substitute ? ' (sub)' : ''} · {rName(c.roomId)}
                </p>
              </div>
              {c.status === 'cancelled' ? (
                <span className="text-xs text-danger">Cancelled</span>
              ) : (
                <AvailabilityPill a={a} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
