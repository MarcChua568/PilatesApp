import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Promotion } from '@pilates/api-client';
import { queryKeys } from '@pilates/api-client';
import { api } from '@/lib/api';
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

const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function PromotionFormDialog({
  open,
  onOpenChange,
  promo,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  promo?: Promotion;
}) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    headline: '',
    body: '',
    imageUrl: '',
    ctaLabel: 'Learn more',
    ctaHref: '/pricing',
    landingSlug: '',
    showInTopBar: false,
    startsAt: '',
    endsAt: '',
    sortOrder: 0,
    active: true,
  });

  useEffect(() => {
    if (!open) return;
    setF({
      headline: promo?.headline ?? '',
      body: promo?.body ?? '',
      imageUrl: promo?.imageUrl ?? '',
      ctaLabel: promo?.ctaLabel ?? 'Learn more',
      ctaHref: promo?.ctaHref ?? '/pricing',
      landingSlug: promo?.landingSlug ?? '',
      showInTopBar: promo?.showInTopBar ?? false,
      startsAt: toLocalInput(promo?.startsAt ?? null),
      endsAt: toLocalInput(promo?.endsAt ?? null),
      sortOrder: promo?.sortOrder ?? 0,
      active: promo?.active ?? true,
    });
  }, [open, promo]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((s) => ({ ...s, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        headline: f.headline,
        body: f.body,
        imageUrl: f.imageUrl || undefined,
        ctaLabel: f.ctaLabel,
        ctaHref: f.ctaHref,
        landingSlug: f.landingSlug || null,
        showInTopBar: f.showInTopBar,
        startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null,
        endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : null,
        sortOrder: Number(f.sortOrder) || 0,
        active: f.active,
      };
      return promo
        ? api.promotions.update(promo.id, body)
        : api.promotions.create(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.promotions });
      qc.invalidateQueries({ queryKey: queryKeys.adminPromotions });
      toast.success(promo ? 'Promotion updated' : 'Promotion created');
      onOpenChange(false);
    },
    onError: toastError,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{promo ? 'Edit promotion' : 'New promotion'}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <Field label="Headline" htmlFor="p-headline">
            <Input
              id="p-headline"
              value={f.headline}
              onChange={(e) => set('headline', e.target.value)}
              required
            />
          </Field>
          <Field label="Body" htmlFor="p-body">
            <Textarea
              id="p-body"
              value={f.body}
              onChange={(e) => set('body', e.target.value)}
              required
            />
          </Field>
          <Field label="Image URL" htmlFor="p-image">
            <Input
              id="p-image"
              type="url"
              value={f.imageUrl}
              onChange={(e) => set('imageUrl', e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CTA label" htmlFor="p-cta-label">
              <Input
                id="p-cta-label"
                value={f.ctaLabel}
                onChange={(e) => set('ctaLabel', e.target.value)}
              />
            </Field>
            <Field label="CTA link" htmlFor="p-cta-href">
              <Input
                id="p-cta-href"
                value={f.ctaHref}
                onChange={(e) => set('ctaHref', e.target.value)}
                placeholder="/pricing"
              />
            </Field>
          </div>
          <Field
            label="Landing page slug (optional — creates /promo/<slug>)"
            htmlFor="p-slug"
          >
            <Input
              id="p-slug"
              value={f.landingSlug}
              onChange={(e) => set('landingSlug', e.target.value)}
              placeholder="intro-offer"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts (optional)" htmlFor="p-starts">
              <Input
                id="p-starts"
                type="datetime-local"
                value={f.startsAt}
                onChange={(e) => set('startsAt', e.target.value)}
              />
            </Field>
            <Field label="Ends (optional)" htmlFor="p-ends">
              <Input
                id="p-ends"
                type="datetime-local"
                value={f.endsAt}
                onChange={(e) => set('endsAt', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Sort order" htmlFor="p-sort">
            <Input
              id="p-sort"
              type="number"
              value={f.sortOrder}
              onChange={(e) => set('sortOrder', Number(e.target.value))}
            />
          </Field>
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={f.showInTopBar}
              onCheckedChange={(v) => set('showInTopBar', v)}
            />
            Show in the site-wide top bar
          </label>
          <p className="-mt-2 text-xs text-muted">
            Only the first active top-bar promotion is shown on the site.
          </p>
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={f.active}
              onCheckedChange={(v) => set('active', v)}
            />
            Active
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
