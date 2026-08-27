import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast, toastError } from '@/lib/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';

export function GenerateInstancesDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  templateId: string;
  templateName: string;
}) {
  const qc = useQueryClient();
  const [through, setThrough] = useState(
    new Date(Date.now() + 28 * 86_400_000).toISOString().slice(0, 10),
  );

  const mutation = useMutation({
    mutationFn: () => api.classInstances.generate(templateId, through),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['class-instances'] });
      toast.success(
        `${created.length} class${created.length === 1 ? '' : 'es'} created`,
      );
      onOpenChange(false);
    },
    onError: toastError,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate classes</DialogTitle>
          <DialogDescription>
            Create concrete class occurrences for “{templateName}” up to a date.
            Re-running is safe — existing occurrences are skipped.
          </DialogDescription>
        </DialogHeader>
        <Field label="Through date" htmlFor="gen-through">
          <Input
            id="gen-through"
            type="date"
            value={through}
            onChange={(e) => setThrough(e.target.value)}
          />
        </Field>
        <DialogFooter>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Generating…' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
