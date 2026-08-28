import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Instructor } from '@pilates/api-client';
import { api } from '@/lib/api';
import { queryKeys } from '@pilates/api-client';
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

export function InstructorFormDialog({
  open,
  onOpenChange,
  instructor,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  instructor?: Instructor;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [specialties, setSpecialties] = useState('');

  useEffect(() => {
    if (open) {
      setName(instructor?.name ?? '');
      setBio(instructor?.bio ?? '');
      setPhotoUrl(instructor?.photoUrl ?? '');
      setSpecialties((instructor?.specialties ?? []).join(', '));
    }
  }, [open, instructor]);

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        name,
        bio: bio || undefined,
        photoUrl: photoUrl || undefined,
        specialties: specialties
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      return instructor
        ? api.instructors.update(instructor.id, body)
        : api.instructors.create(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.instructors });
      toast.success(instructor ? 'Instructor updated' : 'Instructor added');
      onOpenChange(false);
    },
    onError: toastError,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {instructor ? 'Edit instructor' : 'New instructor'}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <Field label="Name" htmlFor="i-name">
            <Input
              id="i-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <Field label="Bio" htmlFor="i-bio">
            <Textarea
              id="i-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </Field>
          <Field label="Photo URL" htmlFor="i-photo">
            <Input
              id="i-photo"
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Specialties (comma-separated)" htmlFor="i-spec">
            <Input
              id="i-spec"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              placeholder="Reformer, Prenatal, Rehab"
            />
          </Field>
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
