import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EventItem } from '@pilates/api-client';
import { queryKeys } from '@pilates/api-client';
import { api, hooks } from '@/lib/api';
import { toast, toastError } from '@/lib/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** datetime-local wants "YYYY-MM-DDTHH:mm" in local time. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function EventFormDialog({
  open,
  onOpenChange,
  event,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  event?: EventItem;
}) {
  const qc = useQueryClient();
  const { data: instructors } = hooks.useInstructors();
  const [f, setF] = useState({
    title: '',
    slug: '',
    summary: '',
    body: '',
    coverImageUrl: '',
    startsAt: '',
    endsAt: '',
    hostInstructorId: '',
    pricePhp: 0,
    capacity: '' as number | '',
    published: false,
  });
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSlugTouched(!!event);
    setF({
      title: event?.title ?? '',
      slug: event?.slug ?? '',
      summary: event?.summary ?? '',
      body: event?.body ?? '',
      coverImageUrl: event?.coverImageUrl ?? '',
      startsAt: toLocalInput(event?.startsAt ?? null),
      endsAt: toLocalInput(event?.endsAt ?? null),
      hostInstructorId: event?.hostInstructorId ?? '',
      pricePhp: event?.pricePhp ?? 0,
      capacity: event?.capacity ?? '',
      published: !!event?.publishedAt,
    });
  }, [open, event]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((s) => ({ ...s, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        title: f.title,
        slug: f.slug || slugify(f.title),
        summary: f.summary,
        body: f.body,
        coverImageUrl: f.coverImageUrl || undefined,
        startsAt: new Date(f.startsAt).toISOString(),
        endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : null,
        hostInstructorId: f.hostInstructorId || null,
        pricePhp: Number(f.pricePhp) || 0,
        capacity: f.capacity === '' ? null : Number(f.capacity),
        publishedAt: f.published
          ? (event?.publishedAt ?? new Date().toISOString())
          : null,
      };
      return event
        ? api.events.update(event.id, body)
        : api.events.create(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.events });
      qc.invalidateQueries({ queryKey: queryKeys.adminEvents });
      toast.success(event ? 'Event updated' : 'Event created');
      onOpenChange(false);
    },
    onError: toastError,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit event' : 'New event'}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <Field label="Title" htmlFor="e-title">
            <Input
              id="e-title"
              value={f.title}
              onChange={(e) => {
                set('title', e.target.value);
                if (!slugTouched) set('slug', slugify(e.target.value));
              }}
              required
            />
          </Field>
          <Field label="Slug" htmlFor="e-slug">
            <Input
              id="e-slug"
              value={f.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', e.target.value);
              }}
              required
            />
          </Field>
          <Field label="Summary (one line)" htmlFor="e-summary">
            <Textarea
              id="e-summary"
              value={f.summary}
              onChange={(e) => set('summary', e.target.value)}
              required
            />
          </Field>
          <Field label="Description" htmlFor="e-body">
            <Textarea
              id="e-body"
              className="min-h-[120px]"
              value={f.body}
              onChange={(e) => set('body', e.target.value)}
              required
            />
          </Field>
          <Field label="Cover image URL" htmlFor="e-cover">
            <Input
              id="e-cover"
              type="url"
              value={f.coverImageUrl}
              onChange={(e) => set('coverImageUrl', e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts" htmlFor="e-starts">
              <Input
                id="e-starts"
                type="datetime-local"
                value={f.startsAt}
                onChange={(e) => set('startsAt', e.target.value)}
                required
              />
            </Field>
            <Field label="Ends (optional)" htmlFor="e-ends">
              <Input
                id="e-ends"
                type="datetime-local"
                value={f.endsAt}
                onChange={(e) => set('endsAt', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Host instructor" htmlFor="e-host">
            <select
              id="e-host"
              value={f.hostInstructorId}
              onChange={(e) => set('hostInstructorId', e.target.value)}
              className="h-9 w-full rounded-md border border-line bg-surface px-3 text-sm"
            >
              <option value="">— none —</option>
              {(instructors ?? []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₱, 0 = free)" htmlFor="e-price">
              <Input
                id="e-price"
                type="number"
                min={0}
                value={f.pricePhp}
                onChange={(e) => set('pricePhp', Number(e.target.value))}
              />
            </Field>
            <Field label="Capacity (blank = uncapped)" htmlFor="e-cap">
              <Input
                id="e-cap"
                type="number"
                min={1}
                value={f.capacity}
                onChange={(e) =>
                  set(
                    'capacity',
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              />
            </Field>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={f.published}
              onCheckedChange={(v) => set('published', v)}
            />
            Published (visible on the site)
          </label>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
