import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Promotion } from '@pilates/api-client';
import { queryKeys } from '@pilates/api-client';
import { api, hooks } from '@/lib/api';
import { toast, toastError } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PromotionFormDialog } from '@/components/PromotionFormDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function PromotionsPage() {
  const { data, isLoading, error } = hooks.useAdminPromotions();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Promotion | undefined>();
  const [deleting, setDeleting] = useState<Promotion | undefined>();

  const del = useMutation({
    mutationFn: (id: string) => api.promotions.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.promotions });
      qc.invalidateQueries({ queryKey: queryKeys.adminPromotions });
      toast.success('Promotion removed');
      setDeleting(undefined);
    },
    onError: toastError,
  });

  const columns: Column<Promotion>[] = [
    { key: 'headline', header: 'Headline', cell: (r) => r.headline },
    {
      key: 'topbar',
      header: 'Top bar',
      cell: (r) =>
        r.showInTopBar ? <Badge tone="accent">yes</Badge> : <span className="text-muted">—</span>,
    },
    {
      key: 'active',
      header: 'Active',
      cell: (r) => (r.active ? 'Active' : <span className="text-muted">Off</span>),
    },
    { key: 'order', header: 'Order', cell: (r) => r.sortOrder },
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
        title="Promotions"
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New promotion
          </Button>
        }
      />
      <div className="rounded-lg border border-line bg-surface">
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          empty="No promotions yet."
        />
      </div>

      <PromotionFormDialog open={creating} onOpenChange={setCreating} />
      <PromotionFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(undefined)}
        promo={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title="Remove promotion?"
        body={`“${deleting?.headline}” will be removed.`}
        confirmLabel="Remove"
        destructive
        busy={del.isPending}
        onConfirm={() => deleting && del.mutate(deleting.id)}
      />
    </div>
  );
}
