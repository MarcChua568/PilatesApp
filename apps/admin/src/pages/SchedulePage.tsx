import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addWeeks, format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { hooks } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { WeekGrid, weekBounds } from '@/components/WeekGrid';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ALL = '__all__';

export function SchedulePage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const offset = Number(params.get('w') ?? '0');
  const instructorId = params.get('instructor') ?? ALL;
  const roomId = params.get('room') ?? ALL;

  const anchor = useMemo(() => addWeeks(new Date(), offset), [offset]);
  const { start, end } = weekBounds(anchor);

  const { data: instructors } = hooks.useInstructors();
  const { data: rooms } = hooks.useRooms();
  const { data, isLoading, error } = hooks.useClassInstances({
    from: start.toISOString(),
    to: end.toISOString(),
    instructorId: instructorId === ALL ? undefined : instructorId,
    roomId: roomId === ALL ? undefined : roomId,
  });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === ALL || value === '') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const instructorName = (id: string) =>
    instructors?.find((i) => i.id === id)?.name ?? '—';
  const roomName = (id: string) => rooms?.find((r) => r.id === id)?.name ?? '—';

  return (
    <div>
      <PageHeader title="Schedule" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setParam('w', String(offset - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setParam('w', '0')}>
            This week
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setParam('w', String(offset + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted">
          {format(start, 'd MMM')} – {format(addWeeks(start, 1), 'd MMM yyyy')}
        </p>

        <div className="ml-auto flex gap-2">
          <Select
            value={instructorId}
            onValueChange={(v) => setParam('instructor', v)}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All instructors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All instructors</SelectItem>
              {instructors?.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={roomId} onValueChange={(v) => setParam('room', v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All rooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All rooms</SelectItem>
              {rooms?.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <p className="text-muted">Loading schedule…</p>}
      {error != null && (
        <p className="text-danger">Couldn’t load the schedule.</p>
      )}
      {data && (
        <WeekGrid
          weekStart={start}
          instances={data}
          instructorName={instructorName}
          roomName={roomName}
          onSelect={(id) => navigate(`/schedule/${id}`)}
        />
      )}
    </div>
  );
}
