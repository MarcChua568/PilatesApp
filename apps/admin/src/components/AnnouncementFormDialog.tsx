import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

export function AnnouncementFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (open) {
      setTitle('');
      setBody('');
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () => api.announcements.create({ title, body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.announcements });
      toast.success('Announcement posted');
      onOpenChange(false);
    },
    onError: toastError,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New announcement</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim() && body.trim()) mutation.mutate();
          }}
        >
          <Field label="Title" htmlFor="a-title">
            <Input
              id="a-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Field>
          <Field label="Body" htmlFor="a-body">
            <Textarea
              id="a-body"
              className="min-h-[120px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </Field>
          <DialogFooter>
            <Button
              type="submit"
              disabled={mutation.isPending || !title.trim() || !body.trim()}
            >
              {mutation.isPending ? 'Posting…' : 'Post'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
