import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus } from 'lucide-react';
import type { RoomSpot } from '@pilates/api-client';
import { queryKeys } from '@pilates/api-client';
import { api, hooks } from '@/lib/api';
import { toast, toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function SpotMapEditor({ roomId }: { roomId: string }) {
  const qc = useQueryClient();
  const { data: spots, isLoading } = hooks.useRoomSpots(roomId);
  const [label, setLabel] = useState('');
  const [group, setGroup] = useState('');

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.roomSpots(roomId) });

  const create = useMutation({
    mutationFn: () =>
      api.spots.create(roomId, {
        label,
        positionGroup: group || undefined,
        sortOrder: (spots?.length ?? 0) + 1,
      }),
    onSuccess: () => {
      invalidate();
      setLabel('');
      toast.success('Spot added');
    },
    onError: toastError,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<RoomSpot> }) =>
      api.spots.update(id, patch),
    onSuccess: invalidate,
    onError: toastError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.spots.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Spot removed');
    },
    onError: toastError,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {isLoading && <p className="text-sm text-muted">Loading spots…</p>}
        {spots?.length === 0 && (
          <p className="text-sm text-muted">
            No spots yet — add the room’s reformers / positions below.
          </p>
        )}
        {spots?.map((spot) => (
          <div
            key={spot.id}
            className="flex items-center gap-2 rounded-md border border-line px-3 py-2"
          >
            <Input
              className="w-20"
              defaultValue={spot.label}
              onBlur={(e) =>
                e.target.value !== spot.label &&
                update.mutate({ id: spot.id, patch: { label: e.target.value } })
              }
            />
            <Input
              className="w-32"
              placeholder="group"
              defaultValue={spot.positionGroup ?? ''}
              onBlur={(e) =>
                (e.target.value || null) !== spot.positionGroup &&
                update.mutate({
                  id: spot.id,
                  patch: { positionGroup: e.target.value || undefined },
                })
              }
            />
            <Input
              type="number"
              className="w-16"
              defaultValue={spot.sortOrder}
              onBlur={(e) =>
                Number(e.target.value) !== spot.sortOrder &&
                update.mutate({
                  id: spot.id,
                  patch: { sortOrder: Number(e.target.value) },
                })
              }
            />
            <label className="ml-auto flex items-center gap-2 text-xs text-muted">
              bookable
              <Switch
                checked={spot.bookable}
                onCheckedChange={(v) =>
                  update.mutate({ id: spot.id, patch: { bookable: v } })
                }
              />
            </label>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => remove.mutate(spot.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (label.trim()) create.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="new-spot-label">Label</Label>
          <Input
            id="new-spot-label"
            className="w-24"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. 7"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-spot-group">Group</Label>
          <Input
            id="new-spot-group"
            className="w-32"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="left / right"
          />
        </div>
        <Button type="submit" disabled={create.isPending || !label.trim()}>
          <Plus className="h-4 w-4" /> Add spot
        </Button>
      </form>

      {spots && spots.length > 0 && <SpotPreview spots={spots} />}
    </div>
  );
}

function SpotPreview({ spots }: { spots: RoomSpot[] }) {
  const groups = new Map<string, RoomSpot[]>();
  for (const s of [...spots].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const g = s.positionGroup ?? 'room';
    groups.set(g, [...(groups.get(g) ?? []), s]);
  }
  return (
    <div className="rounded-md border border-line bg-bg/40 p-3">
      <p className="eyebrow mb-2">Preview</p>
      <div className="flex flex-wrap gap-4">
        {[...groups.entries()].map(([g, list]) => (
          <div key={g}>
            <p className="mb-1 text-xs text-muted">{g}</p>
            <div className="flex flex-wrap gap-1">
              {list.map((s) => (
                <span
                  key={s.id}
                  className={
                    'grid h-8 w-8 place-items-center rounded-sm border text-xs ' +
                    (s.bookable && s.active
                      ? 'border-line bg-surface'
                      : 'border-dashed border-muted/50 text-muted')
                  }
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
