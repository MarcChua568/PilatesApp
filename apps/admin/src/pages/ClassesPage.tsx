import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Pencil, Plus, CalendarPlus, Ban, PauseCircle } from 'lucide-react';
import type { ClassInstance, ClassTemplate } from '@pilates/api-client';
import { queryKeys } from '@pilates/api-client';
import { api, hooks } from '@/lib/api';
import { toast, toastError } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ClassTemplateFormDialog } from '@/components/ClassTemplateFormDialog';
import { GenerateInstancesDialog } from '@/components/GenerateInstancesDialog';
import { ClassInstanceEditDialog } from '@/components/ClassInstanceFormDialog';
import { recurrenceSummary } from '@/components/RecurrenceEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function ClassesPage() {
  return (
    <div>
      <PageHeader title="Classes" />
      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="instances">Instances</TabsTrigger>
        </TabsList>
        <TabsContent value="templates" className="pt-5">
          <TemplatesTab />
        </TabsContent>
        <TabsContent value="instances" className="pt-5">
          <InstancesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TemplatesTab() {
  const { data, isLoading, error } = hooks.useClassTemplates();
  const { data: instructors } = hooks.useInstructors();
  const { data: rooms } = hooks.useRooms();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ClassTemplate | undefined>();
  const [deactivating, setDeactivating] = useState<ClassTemplate | undefined>();
  const [generating, setGenerating] = useState<ClassTemplate | undefined>();

  const nameOf = (id: string, list?: { id: string; name: string }[]) =>
    list?.find((x) => x.id === id)?.name ?? '—';

  const deactivate = useMutation({
    mutationFn: (id: string) => api.classTemplates.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.classTemplates });
      toast.success('Template deactivated');
      setDeactivating(undefined);
    },
    onError: toastError,
  });

  const columns: Column<ClassTemplate>[] = [
    { key: 'name', header: 'Name', cell: (r) => r.name },
    { key: 'type', header: 'Type', cell: (r) => r.classType },
    {
      key: 'instructor',
      header: 'Instructor',
      cell: (r) => nameOf(r.instructorId, instructors),
    },
    { key: 'room', header: 'Room', cell: (r) => nameOf(r.roomId, rooms) },
    { key: 'cap', header: 'Cap', cell: (r) => r.capacity },
    {
      key: 'rec',
      header: 'Recurs',
      cell: (r) => (
        <span className="text-muted">{recurrenceSummary(r.recurrenceRule)}</span>
      ),
    },
    {
      key: 'active',
      header: '',
      cell: (r) =>
        r.active ? (
          <Badge tone="accent">active</Badge>
        ) : (
          <Badge tone="muted">inactive</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-56 text-right',
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="outline" onClick={() => setGenerating(r)}>
            <CalendarPlus className="h-4 w-4" /> Generate
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setEditing(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
          {r.active && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setDeactivating(r)}
            >
              <PauseCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New template
        </Button>
      </div>
      <div className="rounded-lg border border-line bg-surface">
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          empty="No templates yet."
        />
      </div>

      <ClassTemplateFormDialog open={creating} onOpenChange={setCreating} />
      <ClassTemplateFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(undefined)}
        template={editing}
      />
      {generating && (
        <GenerateInstancesDialog
          open={!!generating}
          onOpenChange={(o) => !o && setGenerating(undefined)}
          templateId={generating.id}
          templateName={generating.name}
        />
      )}
      <ConfirmDialog
        open={!!deactivating}
        onOpenChange={(o) => !o && setDeactivating(undefined)}
        title="Deactivate template?"
        body="Future generation stops. Already-generated classes are untouched."
        confirmLabel="Deactivate"
        busy={deactivate.isPending}
        onConfirm={() => deactivating && deactivate.mutate(deactivating.id)}
      />
    </div>
  );
}

function InstancesTab() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(
    new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10),
  );
  const filters = useMemo(
    () => ({ from: `${from}T00:00:00`, to: `${to}T23:59:59` }),
    [from, to],
  );
  const { data, isLoading, error } = hooks.useClassInstances(filters);
  const { data: instructors } = hooks.useInstructors();
  const { data: rooms } = hooks.useRooms();
  const [editing, setEditing] = useState<ClassInstance | undefined>();
  const [cancelling, setCancelling] = useState<ClassInstance | undefined>();

  const nameOf = (id: string, list?: { id: string; name: string }[]) =>
    list?.find((x) => x.id === id)?.name ?? '—';

  const cancel = useMutation({
    mutationFn: (id: string) => api.classInstances.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['class-instances'] });
      toast.success('Class cancelled');
      setCancelling(undefined);
    },
    onError: toastError,
  });

  const columns: Column<ClassInstance>[] = [
    {
      key: 'start',
      header: 'When',
      cell: (r) => format(new Date(r.startTime), 'EEE d MMM, HH:mm'),
    },
    { key: 'name', header: 'Class', cell: (r) => r.name },
    {
      key: 'instructor',
      header: 'Instructor',
      cell: (r) => (
        <span>
          {nameOf(r.instructorId, instructors)}
          {r.substitute && (
            <Badge tone="muted" className="ml-1">
              sub
            </Badge>
          )}
        </span>
      ),
    },
    { key: 'room', header: 'Room', cell: (r) => nameOf(r.roomId, rooms) },
    {
      key: 'fill',
      header: 'Booked',
      cell: (r) => `${r.bookedCount}/${r.capacity}`,
    },
    {
      key: 'status',
      header: '',
      cell: (r) =>
        r.status === 'cancelled' ? (
          <Badge tone="danger">cancelled</Badge>
        ) : null,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24 text-right',
      cell: (r) => (
        <div
          className="flex justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="icon" variant="ghost" onClick={() => setEditing(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
          {r.status === 'scheduled' && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setCancelling(r)}
            >
              <Ban className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-3 flex items-end gap-3">
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-eyebrow text-muted">
            From
          </label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-eyebrow text-muted">
            To
          </label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <div className="rounded-lg border border-line bg-surface">
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          empty="No classes in this range."
          onRowClick={(r) => navigate(`/schedule/${r.id}`)}
        />
      </div>

      {editing && (
        <ClassInstanceEditDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(undefined)}
          instance={editing}
        />
      )}
      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(o) => !o && setCancelling(undefined)}
        title="Cancel this class?"
        body="Booked members lose their reservation. This can’t be undone from here."
        confirmLabel="Cancel class"
        destructive
        busy={cancel.isPending}
        onConfirm={() => cancelling && cancel.mutate(cancelling.id)}
      />
    </div>
  );
}
