import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { StudioPackage } from '@pilates/api-client';
import { queryKeys } from '@pilates/api-client';
import { api, hooks } from '@/lib/api';
import { toast, toastError } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PackageFormDialog } from '@/components/PackageFormDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`;

export function PackagesPage() {
  const { data, isLoading, error } = hooks.useAdminPackages();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<StudioPackage | undefined>();
  const [deleting, setDeleting] = useState<StudioPackage | undefined>();

  const del = useMutation({
    mutationFn: (id: string) => api.packages.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.packages });
      qc.invalidateQueries({ queryKey: queryKeys.adminPackages });
      toast.success('Package removed');
      setDeleting(undefined);
    },
    onError: toastError,
  });

  const columns: Column<StudioPackage>[] = [
    { key: 'name', header: 'Name', cell: (r) => r.name },
    { key: 'kind', header: 'Kind', cell: (r) => r.kind },
    { key: 'price', header: 'Price', cell: (r) => peso(r.pricePhp) },
    {
      key: 'credits',
      header: 'Credits',
      cell: (r) => r.credits ?? <span className="text-muted">unlimited</span>,
    },
    {
      key: 'flags',
      header: '',
      cell: (r) => (
        <div className="flex gap-1">
          {r.featured && <Badge tone="accent">featured</Badge>}
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
        title="Pricing & packages"
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New package
          </Button>
        }
      >
        <p className="mt-1 text-sm text-muted">
          These appear on the public pricing page. Checkout is a preview — no
          payment is taken yet.
        </p>
      </PageHeader>
      <div className="rounded-lg border border-line bg-surface">
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          empty="No packages yet."
        />
      </div>

      <PackageFormDialog open={creating} onOpenChange={setCreating} />
      <PackageFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(undefined)}
        pkg={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title="Remove package?"
        body={`“${deleting?.name}” will be removed from the pricing page.`}
        confirmLabel="Remove"
        destructive
        busy={del.isPending}
        onConfirm={() => deleting && del.mutate(deleting.id)}
      />
    </div>
  );
}
