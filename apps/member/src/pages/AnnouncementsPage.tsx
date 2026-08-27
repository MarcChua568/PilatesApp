import { format } from 'date-fns';
import { hooks } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';

export function AnnouncementsPage() {
  const { data, isLoading, error } = hooks.useAnnouncements();

  return (
    <div>
      <h1 className="mb-4 text-2xl">Announcements</h1>
      {isLoading && <p className="text-muted">Loading…</p>}
      {error != null && <p className="text-danger">Couldn’t load announcements.</p>}
      {data?.length === 0 && <p className="text-muted">Nothing new right now.</p>}
      <div className="space-y-3">
        {data?.map((a) => (
          <Card key={a.id}>
            <CardContent className="pt-5">
              <p className="eyebrow">
                {format(new Date(a.createdAt), 'd MMM yyyy')}
              </p>
              <h2 className="mt-0.5 text-lg font-light">{a.title}</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                {a.body}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
