import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import type { BookingsPerClassRow } from '@pilates/api-client';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { DateRangePicker, type Range } from '@/components/DateRangePicker';
import { DataTable, type Column } from '@/components/DataTable';

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function ReportsPage() {
  const [range, setRange] = useState<Range>({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });
  const apiRange = useMemo(
    () => ({ from: `${range.from}T00:00:00`, to: `${range.to}T23:59:59` }),
    [range],
  );

  const attendance = useQuery({
    queryKey: ['reports', 'attendance', apiRange],
    queryFn: () => api.reports.attendanceRate(apiRange),
  });
  const noShow = useQuery({
    queryKey: ['reports', 'noshow', apiRange],
    queryFn: () => api.reports.noShowRate(apiRange),
  });
  const perClass = useQuery({
    queryKey: ['reports', 'perclass', apiRange],
    queryFn: () => api.reports.bookingsPerClass(apiRange),
  });

  const columns: Column<BookingsPerClassRow>[] = [
    {
      key: 'when',
      header: 'When',
      cell: (r) => format(new Date(r.startTime), 'd MMM, HH:mm'),
    },
    { key: 'name', header: 'Class', cell: (r) => r.className },
    {
      key: 'fill',
      header: 'Booked',
      cell: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line/60">
            <div
              className="h-full bg-accent"
              style={{
                width: `${Math.min(100, (r.bookedCount / r.capacity) * 100)}%`,
              }}
            />
          </div>
          <span className="text-xs text-muted">
            {r.bookedCount}/{r.capacity}
          </span>
        </div>
      ),
    },
    { key: 'wait', header: 'Waitlist', cell: (r) => r.waitlistCount },
    { key: 'att', header: 'Attended', cell: (r) => r.attendedCount },
    { key: 'ns', header: 'No-show', cell: (r) => r.noShowCount },
  ];

  return (
    <div>
      <PageHeader title="Reports" />
      <div className="mb-6">
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard
          label="Attendance rate"
          value={attendance.data ? pct(attendance.data.rate) : '—'}
          sublabel={
            attendance.data
              ? `${attendance.data.attended} of ${attendance.data.totalResolved} resolved`
              : undefined
          }
        />
        <StatCard
          label="No-show rate"
          value={noShow.data ? pct(noShow.data.rate) : '—'}
          sublabel={
            noShow.data
              ? `${noShow.data.noShow} of ${noShow.data.totalResolved} resolved`
              : undefined
          }
        />
        <StatCard
          label="Resolved bookings"
          value={
            attendance.data ? String(attendance.data.totalResolved) : '—'
          }
          sublabel="attended + no-show in range"
        />
      </div>

      <div className="rounded-lg border border-line bg-surface">
        <DataTable
          columns={columns}
          rows={perClass.data}
          rowKey={(r) => r.classInstanceId}
          isLoading={perClass.isLoading}
          error={perClass.error}
          empty="No classes in this range."
        />
      </div>
    </div>
  );
}
