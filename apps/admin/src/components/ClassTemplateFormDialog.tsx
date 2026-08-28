import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ClassTemplate,
  ClassType,
  IntensityLevel,
} from '@pilates/api-client';
import { queryKeys } from '@pilates/api-client';
import { api, hooks } from '@/lib/api';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RecurrenceEditor, type RecurrenceValue } from './RecurrenceEditor';

const CLASS_TYPES: ClassType[] = ['reformer', 'mat', 'barre', 'other'];
const INTENSITIES: IntensityLevel[] = ['beginner', 'intermediate', 'advanced'];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) =>
  new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

export function ClassTemplateFormDialog({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  template?: ClassTemplate;
}) {
  const qc = useQueryClient();
  const { data: instructors } = hooks.useInstructors();
  const { data: rooms } = hooks.useRooms();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [typeLabel, setTypeLabel] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [whatToBring, setWhatToBring] = useState('');
  const [whoItsFor, setWhoItsFor] = useState('');
  const [classType, setClassType] = useState<ClassType>('reformer');
  const [instructorId, setInstructorId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [durationMinutes, setDuration] = useState(50);
  const [intensityLevel, setIntensity] = useState<IntensityLevel>('intermediate');
  const [capacity, setCapacity] = useState(10);
  const [recurrence, setRecurrence] = useState<RecurrenceValue>({
    daysOfWeek: [],
    startTime: '18:00',
    startDate: today(),
    endDate: plusDays(60),
  });

  useEffect(() => {
    if (!open) return;
    setName(template?.name ?? '');
    setSlug(template?.slug ?? '');
    setSlugTouched(!!template);
    setTypeLabel(template?.typeLabel ?? '');
    setHeroImageUrl(template?.heroImageUrl ?? '');
    setLongDescription(template?.longDescription ?? '');
    setWhatToBring((template?.whatToBring ?? []).join('\n'));
    setWhoItsFor(template?.whoItsFor ?? '');
    setClassType(template?.classType ?? 'reformer');
    setInstructorId(template?.instructorId ?? '');
    setRoomId(template?.roomId ?? '');
    setDuration(template?.durationMinutes ?? 50);
    setIntensity(template?.intensityLevel ?? 'intermediate');
    setCapacity(template?.capacity ?? 10);
    setRecurrence(
      template
        ? (JSON.parse(template.recurrenceRule) as RecurrenceValue)
        : {
            daysOfWeek: [],
            startTime: '18:00',
            startDate: today(),
            endDate: plusDays(60),
          },
    );
  }, [open, template]);

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        name,
        slug: slug || slugify(name),
        typeLabel: typeLabel || undefined,
        heroImageUrl: heroImageUrl || undefined,
        longDescription: longDescription || undefined,
        whatToBring: whatToBring
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        whoItsFor: whoItsFor || undefined,
        classType,
        instructorId,
        roomId,
        durationMinutes,
        intensityLevel,
        capacity,
        recurrenceRule: recurrence,
      };
      return template
        ? api.classTemplates.update(template.id, body)
        : api.classTemplates.create(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.classTemplates });
      toast.success(template ? 'Template updated' : 'Template created');
      onOpenChange(false);
    },
    onError: toastError,
  });

  const valid =
    name &&
    (slug || name) &&
    instructorId &&
    roomId &&
    recurrence.daysOfWeek.length > 0 &&
    recurrence.startTime;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit class template' : 'New class template'}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) mutation.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" htmlFor="t-name">
              <Input
                id="t-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                required
              />
            </Field>
            <Field label="Slug (URL)" htmlFor="t-slug">
              <Input
                id="t-slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select
                value={classType}
                onValueChange={(v) => setClassType(v as ClassType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Intensity">
              <Select
                value={intensityLevel}
                onValueChange={(v) => setIntensity(v as IntensityLevel)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTENSITIES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Instructor">
              <Select value={instructorId} onValueChange={setInstructorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  {instructors?.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Room">
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  {rooms?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Duration (min)" htmlFor="t-dur">
              <Input
                id="t-dur"
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </Field>
            <Field label="Capacity" htmlFor="t-cap">
              <Input
                id="t-cap"
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </Field>
          </div>

          <div className="rounded-md border border-line p-3">
            <p className="mb-3 text-sm font-medium">Public class page</p>
            <div className="space-y-3">
              <Field label="Type label (overrides the type on the site)" htmlFor="t-typelabel">
                <Input
                  id="t-typelabel"
                  value={typeLabel}
                  onChange={(e) => setTypeLabel(e.target.value)}
                  placeholder="e.g. Athletic Reformer"
                />
              </Field>
              <Field label="Hero image URL" htmlFor="t-hero">
                <Input
                  id="t-hero"
                  type="url"
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Long description" htmlFor="t-long">
                <Textarea
                  id="t-long"
                  className="min-h-[100px]"
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                />
              </Field>
              <Field label="What to bring (one per line)" htmlFor="t-bring">
                <Textarea
                  id="t-bring"
                  value={whatToBring}
                  onChange={(e) => setWhatToBring(e.target.value)}
                  placeholder={'Grip socks\nWater'}
                />
              </Field>
              <Field label="Who it's for" htmlFor="t-who">
                <Textarea
                  id="t-who"
                  value={whoItsFor}
                  onChange={(e) => setWhoItsFor(e.target.value)}
                />
              </Field>
            </div>
          </div>

          <RecurrenceEditor value={recurrence} onChange={setRecurrence} />

          <DialogFooter>
            <Button type="submit" disabled={!valid || mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
