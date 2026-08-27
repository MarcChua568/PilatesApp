import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import type { Announcement } from '@pilates/api-client';
import { queryKeys } from '@pilates/api-client';
import { api, hooks } from '@/lib/api';
import { toast, toastError } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AnnouncementFormDialog } from '@/components/AnnouncementFormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function AnnouncementsPage() {
  const { data, isLoading, error } = hooks.useAnnouncements();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Announcement | undefined>();

  const del = useMutation({
    mutationFn: (id: string) => api.announcements.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.announcements });
      toast.success('Announcement removed');
      setDeleting(undefined);
    },
    onError: toastError,
  });

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Announcements"
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New announcement
          </Button>
        }
      />

      {isLoading && <p className="text-muted">Loading…</p>}
      {error != null && <p className="text-danger">Couldn’t load announcements.</p>}
      {data?.length === 0 && (
        <p className="text-muted">No announcements yet.</p>
      )}

      <div className="space-y-3">
        {data?.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex items-start justify-between gap-4 pt-5">
              <div>
                <p className="eyebrow">
                  {format(new Date(a.createdAt), 'd MMM yyyy')}
                </p>
                <h3 className="mt-0.5 text-lg font-light">{a.title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                  {a.body}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDeleting(a)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <AnnouncementFormDialog open={creating} onOpenChange={setCreating} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title="Remove announcement?"
        body={`“${deleting?.title}” will be removed.`}
        confirmLabel="Remove"
        destructive
        busy={del.isPending}
        onConfirm={() => deleting && del.mutate(deleting.id)}
      />
    </div>
  );
}
