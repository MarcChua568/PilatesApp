import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Product, ProductCategory } from '@pilates/api-client';
import { queryKeys } from '@pilates/api-client';
import { hooks } from '@/lib/api';
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

const CATEGORIES: ProductCategory[] = [
  'apparel',
  'grip-socks',
  'wellness',
  'merch',
  'other',
];
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product?: Product;
}) {
  const qc = useQueryClient();
  const { create, update } = hooks.useAdminProductMutations();
  const [f, setF] = useState({
    name: '',
    slug: '',
    category: 'other' as ProductCategory,
    description: '',
    pricePhp: '' as number | '',
    imageUrl: '',
    videoUrl: '',
    externalUrl: '',
    featured: false,
    sortOrder: 0,
    active: true,
  });
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSlugTouched(!!product);
    setF({
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      category: product?.category ?? 'other',
      description: product?.description ?? '',
      pricePhp: product?.pricePhp ?? '',
      imageUrl: product?.imageUrl ?? '',
      videoUrl: product?.videoUrl ?? '',
      externalUrl: product?.externalUrl ?? '',
      featured: product?.featured ?? false,
      sortOrder: product?.sortOrder ?? 0,
      active: product?.active ?? true,
    });
  }, [open, product]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((s) => ({ ...s, [k]: v }));

  const mutation = product ? update : create;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      name: f.name,
      slug: f.slug || slugify(f.name),
      category: f.category,
      description: f.description,
      pricePhp: f.pricePhp === '' ? null : Number(f.pricePhp),
      imageUrl: f.imageUrl || null,
      videoUrl: f.videoUrl || null,
      externalUrl: f.externalUrl || null,
      featured: f.featured,
      sortOrder: Number(f.sortOrder) || 0,
      active: f.active,
    };
    const run = product
      ? update.mutateAsync({ id: product.id, body })
      : create.mutateAsync(body);
    run
      .then(() => {
        qc.invalidateQueries({ queryKey: queryKeys.products });
        toast.success(product ? 'Product updated' : 'Product created');
        onOpenChange(false);
      })
      .catch(toastError);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit product' : 'New product'}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <Field label="Name" htmlFor="p-name">
            <Input
              id="p-name"
              value={f.name}
              onChange={(e) => {
                set('name', e.target.value);
                if (!slugTouched) set('slug', slugify(e.target.value));
              }}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slug" htmlFor="p-slug">
              <Input
                id="p-slug"
                value={f.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug', e.target.value);
                }}
                required
              />
            </Field>
            <Field label="Category" htmlFor="p-category">
              <select
                id="p-category"
                value={f.category}
                onChange={(e) =>
                  set('category', e.target.value as ProductCategory)
                }
                className="h-9 w-full rounded-md border border-line bg-surface px-3 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description" htmlFor="p-desc">
            <Textarea
              id="p-desc"
              value={f.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₱, blank = in-studio only)" htmlFor="p-price">
              <Input
                id="p-price"
                type="number"
                min={0}
                value={f.pricePhp}
                placeholder="—"
                onChange={(e) =>
                  set(
                    'pricePhp',
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              />
            </Field>
            <Field label="Sort order" htmlFor="p-sort">
              <Input
                id="p-sort"
                type="number"
                value={f.sortOrder}
                onChange={(e) => set('sortOrder', Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Image URL" htmlFor="p-image">
            <Input
              id="p-image"
              type="url"
              value={f.imageUrl}
              placeholder="https://…"
              onChange={(e) => set('imageUrl', e.target.value)}
            />
          </Field>
          <Field label="Video / B-roll URL" htmlFor="p-video">
            <Input
              id="p-video"
              type="url"
              value={f.videoUrl}
              placeholder="https://…mp4"
              onChange={(e) => set('videoUrl', e.target.value)}
            />
          </Field>
          <Field
            label="External shop link (e.g. the MILI storefront)"
            htmlFor="p-external"
          >
            <Input
              id="p-external"
              type="url"
              value={f.externalUrl}
              placeholder="https://…"
              onChange={(e) => set('externalUrl', e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={f.featured}
              onCheckedChange={(v) => set('featured', v)}
            />
            Featured on the shop page
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
