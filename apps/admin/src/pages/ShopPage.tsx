import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Product } from '@pilates/api-client';
import { queryKeys } from '@pilates/api-client';
import { api, hooks } from '@/lib/api';
import { toast, toastError } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ProductFormDialog } from '@/components/ProductFormDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`;

export function ShopPage() {
  const { data, isLoading, error } = hooks.useAdminProducts();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>();
  const [deleting, setDeleting] = useState<Product | undefined>();

  const del = useMutation({
    mutationFn: (id: string) => api.products.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products });
      qc.invalidateQueries({ queryKey: queryKeys.adminProducts });
      toast.success('Product removed');
      setDeleting(undefined);
    },
    onError: toastError,
  });

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (r) => (
        <div className="flex items-center gap-2">
          {r.imageUrl && (
            <img
              src={r.imageUrl}
              alt=""
              className="h-8 w-8 rounded object-cover"
            />
          )}
          {r.name}
        </div>
      ),
    },
    { key: 'category', header: 'Category', cell: (r) => r.category },
    {
      key: 'price',
      header: 'Price',
      cell: (r) =>
        r.pricePhp != null ? (
          peso(r.pricePhp)
        ) : (
          <span className="text-muted">in-studio only</span>
        ),
    },
    {
      key: 'flags',
      header: '',
      cell: (r) => (
        <div className="flex gap-1">
          {r.featured && <Badge tone="accent">featured</Badge>}
          {r.videoUrl && <Badge tone="accent">video</Badge>}
          {!r.active && <span className="text-xs text-muted">hidden</span>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24 text-right',
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={() => setEditing(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setDeleting(r)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="MILE Shop"
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New product
          </Button>
        }
      >
        <p className="mt-1 text-sm text-muted">
          Apparel, grip socks and wellness goods — including pieces from our
          MILI partnership. This is a lookbook for now: set a price for
          "available in-studio" items, or an external link for anything sold
          through the MILI storefront. No checkout on our side yet.
        </p>
      </PageHeader>
      <div className="rounded-lg border border-line bg-surface">
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          empty="No products yet."
        />
      </div>

      <ProductFormDialog open={creating} onOpenChange={setCreating} />
      <ProductFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(undefined)}
        product={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title="Remove product?"
        body={`"${deleting?.name}" will be removed from the shop page.`}
        confirmLabel="Remove"
        destructive
        busy={del.isPending}
        onConfirm={() => deleting && del.mutate(deleting.id)}
      />
    </div>
  );
}
