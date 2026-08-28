import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { StudioPackage, PackageKind } from '@pilates/api-client';
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

const KINDS: PackageKind[] = [
  'intro',
  'single',
  'pack',
  'membership',
  'workshop',
];
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function PackageFormDialog({
  open,
  onOpenChange,
  pkg,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pkg?: StudioPackage;
}) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    name: '',
    slug: '',
    kind: 'pack' as PackageKind,
    pricePhp: 0,
    credits: '' as number | '',
    validityDays: '' as number | '',
    blurb: '',
    perks: '',
    featured: false,
    sortOrder: 0,
    active: true,
  });
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSlugTouched(!!pkg);
    setF({
      name: pkg?.name ?? '',
      slug: pkg?.slug ?? '',
      kind: pkg?.kind ?? 'pack',
      pricePhp: pkg?.pricePhp ?? 0,
      credits: pkg?.credits ?? '',
      validityDays: pkg?.validityDays ?? '',
      blurb: pkg?.blurb ?? '',
      perks: (pkg?.perks ?? []).join('\n'),
      featured: pkg?.featured ?? false,
      sortOrder: pkg?.sortOrder ?? 0,
      active: pkg?.active ?? true,
    });
  }, [open, pkg]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((s) => ({ ...s, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        name: f.name,
        slug: f.slug || slugify(f.name),
        kind: f.kind,
        pricePhp: Number(f.pricePhp) || 0,
        credits: f.credits === '' ? null : Number(f.credits),
        validityDays: f.validityDays === '' ? null : Number(f.validityDays),
        blurb: f.blurb,
        perks: f.perks
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        featured: f.featured,
        sortOrder: Number(f.sortOrder) || 0,
        active: f.active,
      };
      return pkg
        ? api.packages.update(pkg.id, body)
        : api.packages.create(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.packages });
      qc.invalidateQueries({ queryKey: queryKeys.adminPackages });
      toast.success(pkg ? 'Package updated' : 'Package created');
      onOpenChange(false);
    },
    onError: toastError,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pkg ? 'Edit package' : 'New package'}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <Field label="Name" htmlFor="k-name">
            <Input
              id="k-name"
              value={f.name}
              onChange={(e) => {
                set('name', e.target.value);
                if (!slugTouched) set('slug', slugify(e.target.value));
              }}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slug" htmlFor="k-slug">
              <Input
                id="k-slug"
                value={f.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug', e.target.value);
                }}
                required
              />
            </Field>
            <Field label="Kind" htmlFor="k-kind">
              <select
                id="k-kind"
                value={f.kind}
                onChange={(e) => set('kind', e.target.value as PackageKind)}
                className="h-9 w-full rounded-md border border-line bg-surface px-3 text-sm"
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Price (₱)" htmlFor="k-price">
              <Input
                id="k-price"
                type="number"
                min={0}
                value={f.pricePhp}
                onChange={(e) => set('pricePhp', Number(e.target.value))}
              />
            </Field>
            <Field label="Credits" htmlFor="k-credits">
              <Input
                id="k-credits"
                type="number"
                min={1}
                value={f.credits}
                placeholder="—"
                onChange={(e) =>
                  set(
                    'credits',
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              />
            </Field>
            <Field label="Valid (days)" htmlFor="k-validity">
              <Input
                id="k-validity"
                type="number"
                min={1}
                value={f.validityDays}
                placeholder="—"
                onChange={(e) =>
                  set(
                    'validityDays',
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              />
            </Field>
          </div>
          <Field label="Blurb" htmlFor="k-blurb">
            <Textarea
              id="k-blurb"
              value={f.blurb}
              onChange={(e) => set('blurb', e.target.value)}
            />
          </Field>
          <Field label="Perks (one per line)" htmlFor="k-perks">
            <Textarea
              id="k-perks"
              className="min-h-[100px]"
              value={f.perks}
              onChange={(e) => set('perks', e.target.value)}
            />
          </Field>
          <Field label="Sort order" htmlFor="k-sort">
            <Input
              id="k-sort"
              type="number"
              value={f.sortOrder}
              onChange={(e) => set('sortOrder', Number(e.target.value))}
            />
          </Field>
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={f.featured}
              onCheckedChange={(v) => set('featured', v)}
            />
            Featured on the pricing page
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={f.active}
              onCheckedChange={(v) => set('active', v)}
            />
            Active (shown on the site)
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
