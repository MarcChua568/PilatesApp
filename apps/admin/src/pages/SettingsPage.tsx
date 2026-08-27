import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@pilates/api-client';
import { api, hooks } from '@/lib/api';
import { toast, toastError } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';

const FIELDS = [
  {
    key: 'cancellationWindowHours' as const,
    label: 'Cancellation window (hours)',
    hint: 'Cancelling within this many hours of class start is flagged as a late cancellation.',
  },
  {
    key: 'waitlistAutoPromoteCutoffHours' as const,
    label: 'Waitlist auto-promote cutoff (hours)',
    hint: 'Inside this window before class, a freed spot is offered to the next person instead of auto-assigned.',
  },
  {
    key: 'waitlistOfferTtlMinutes' as const,
    label: 'Waitlist offer TTL (minutes)',
    hint: 'How long a promotion offer stays open before passing to the next person.',
  },
  {
    key: 'maxSeatsPerBooking' as const,
    label: 'Max seats per booking',
    hint: '1 disables guest bookings.',
  },
];

export function SettingsPage() {
  const { data, isLoading } = hooks.useSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, number>>({});

  useEffect(() => {
    if (data) {
      setForm({
        cancellationWindowHours: data.cancellationWindowHours,
        waitlistAutoPromoteCutoffHours: data.waitlistAutoPromoteCutoffHours,
        waitlistOfferTtlMinutes: data.waitlistOfferTtlMinutes,
        maxSeatsPerBooking: data.maxSeatsPerBooking,
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => api.settings.update(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings });
      toast.success('Settings saved');
    },
    onError: toastError,
  });

  return (
    <div className="max-w-xl">
      <PageHeader title="Studio settings" />
      {isLoading && <p className="text-muted">Loading…</p>}
      {data && (
        <Card>
          <CardContent className="pt-5">
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
            >
              {FIELDS.map((f) => (
                <Field
                  key={f.key}
                  label={f.label}
                  htmlFor={f.key}
                  hint={f.hint}
                >
                  <Input
                    id={f.key}
                    type="number"
                    min={f.key === 'maxSeatsPerBooking' ? 1 : 0}
                    className="w-32"
                    value={form[f.key] ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [f.key]: Number(e.target.value),
                      }))
                    }
                  />
                </Field>
              ))}
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save settings'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
