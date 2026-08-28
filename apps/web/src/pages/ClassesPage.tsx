import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, format, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@pilates/ui';
import { listVariants, itemVariants } from '@pilates/ui';
import { hooks } from '@/lib/api';
import { useAuth } from '@/auth/useAuth';
import { availabilityFor } from '@/lib/availability';
import { AvailabilityPill } from '@/components/AvailabilityPill';
import { Reveal } from '@/components/site/Reveal';
import { Seo } from '@/components/site/Seo';

const DAYS_AHEAD = 14;

export function ClassesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [day, setDay] = useState(0);

  const days = useMemo(
    () => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(new Date(), i)),
    [],
  );
  const range = useMemo(
    () => ({
      from: new Date().toISOString(),
      to: addDays(new Date(), DAYS_AHEAD).toISOString(),
    }),
    [],
  );

  const { data: instances, isLoading } = hooks.useClassInstances(range);
  const { data: instructors } = hooks.useInstructors();
  const { data: rooms } = hooks.useRooms();
  const { data: myBookings } = hooks.useMyBookings();

  const selected = days[day];
  const dayClasses = (instances ?? [])
    .filter((c) => isSameDay(new Date(c.startTime), selected) && c.status === 'scheduled')
    .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));

  const ins = (id: string) => instructors?.find((i) => i.id === id);
  const rName = (id: string) => rooms?.find((r) => r.id === id)?.name ?? '';

  const openClass = (id: string) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/book/class/${id}` } } });
    } else {
      navigate(`/book/class/${id}`);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <Seo
        title="Timetable"
        description="This week's MILE class timetable — reformer, mat and barre in Salcedo Village, Makati. Book online."
        path="/schedule"
      />
      <Reveal>
        <p className="eyebrow">Schedule</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tight">
          Find a class
        </h1>
        <p className="mt-2 text-sm text-muted">
          All times shown in the studio's timezone. Booking needs an account —
          it's free to make one.
        </p>
      </Reveal>

      <div className="-mx-5 mt-8 flex gap-2 overflow-x-auto px-5 pb-2">
        {days.map((d, i) => (
          <button
            key={i}
            onClick={() => setDay(i)}
            className={cn(
              'flex shrink-0 flex-col items-center rounded-md border px-4 py-2 transition-colors',
              i === day
                ? 'border-primary bg-primary text-primary-fg'
                : 'border-line text-muted hover:border-primary/40',
            )}
          >
            <span className="text-[11px] uppercase tracking-eyebrow">
              {i === 0 ? 'Today' : format(d, 'EEE')}
            </span>
            <span className="text-sm">{format(d, 'd MMM')}</span>
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-8 text-muted">Loading classes…</p>}
      {instances && dayClasses.length === 0 && (
        <p className="mt-8 text-muted">No classes scheduled on this day.</p>
      )}

      <motion.ul
        className="mt-6 divide-y divide-line border-y border-line"
        variants={listVariants}
        initial="initial"
        animate="animate"
      >
        {dayClasses.map((c) => {
          const a = availabilityFor(c, myBookings ?? []);
          const teacher = ins(c.instructorId);
          return (
            <motion.li key={c.id} variants={itemVariants}>
              <button
                onClick={() => openClass(c.id)}
                className="group flex w-full items-center gap-4 py-4 text-left"
              >
                <div className="w-16 shrink-0">
                  <p className="font-display text-lg">
                    {format(new Date(c.startTime), 'HH:mm')}
                  </p>
                  <p className="text-xs text-muted">{c.durationMinutes} min</p>
                </div>

                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-line/50">
                  {teacher?.photoUrl && (
                    <img
                      src={teacher.photoUrl}
                      alt={teacher.name}
                      className="editorial-img h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="truncate text-sm text-muted">
                    {teacher?.name}
                    {c.substitute ? ' (sub)' : ''} · {rName(c.roomId)}
                  </p>
                </div>

                <div className="shrink-0">
                  <AvailabilityPill a={a} />
                </div>
              </button>
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}
