import { Card, CardContent } from '@/components/ui/card';

export function StatCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="eyebrow">{label}</p>
        <p className="mt-1 text-3xl font-light tracking-tightpx">{value}</p>
        {sublabel && <p className="mt-1 text-xs text-muted">{sublabel}</p>}
      </CardContent>
    </Card>
  );
}
