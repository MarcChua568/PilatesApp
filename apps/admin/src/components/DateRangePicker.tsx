import {
  startOfMonth,
  subDays,
  format,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface Range {
  from: string;
  to: string;
}

const iso = (d: Date) => format(d, 'yyyy-MM-dd');

export function DateRangePicker({
  value,
  onChange,
}: {
  value: Range;
  onChange: (r: Range) => void;
}) {
  const today = new Date();
  const presets: { label: string; range: Range }[] = [
    { label: 'Last 7 days', range: { from: iso(subDays(today, 7)), to: iso(today) } },
    { label: 'Last 30 days', range: { from: iso(subDays(today, 30)), to: iso(today) } },
    { label: 'This month', range: { from: iso(startOfMonth(today)), to: iso(today) } },
  ];

  return (
    <div className="flex flex-wrap items-end gap-2">
      {presets.map((p) => (
        <Button
          key={p.label}
          size="sm"
          variant="outline"
          onClick={() => onChange(p.range)}
        >
          {p.label}
        </Button>
      ))}
      <Input
        type="date"
        className="w-40"
        value={value.from}
        onChange={(e) => onChange({ ...value, from: e.target.value })}
      />
      <span className="pb-2 text-muted">–</span>
      <Input
        type="date"
        className="w-40"
        value={value.to}
        onChange={(e) => onChange({ ...value, to: e.target.value })}
      />
    </div>
  );
}
