import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { queryKeys } from '@pilates/api-client';
import { api, hooks } from '@/lib/api';
import { toast, toastError } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { CONTENT_SCHEMA, type BlockDef, type FieldDef } from '@/lib/content-schema';

type Data = Record<string, unknown>;

export function SiteContentPage() {
  const { data: content, isLoading } = hooks.useSiteContent();
  const groups = useMemo(() => {
    const g: Record<string, BlockDef[]> = {};
    for (const b of CONTENT_SCHEMA) (g[b.group] ??= []).push(b);
    return g;
  }, []);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Site content">
        <p className="mt-1 text-sm text-muted">
          Editorial copy and images for the marketing pages. Changes are live
          immediately.
        </p>
      </PageHeader>

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <div className="space-y-10">
          {Object.entries(groups).map(([group, blocks]) => (
            <section key={group}>
              <h2 className="mb-3 font-display text-xl font-light tracking-tight">
                {group}
              </h2>
              <div className="space-y-4">
                {blocks.map((block) => (
                  <BlockEditor
                    key={block.key}
                    block={block}
                    initial={(content?.[block.key] as Data) ?? {}}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function BlockEditor({ block, initial }: { block: BlockDef; initial: Data }) {
  const qc = useQueryClient();
  const [data, setData] = useState<Data>(initial);
  useEffect(() => setData(initial), [initial]);

  const save = useMutation({
    mutationFn: () => api.siteContent.update(block.key, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.siteContent });
      toast.success(`${block.label} saved`);
    },
    onError: toastError,
  });

  const setField = (path: string, value: unknown) =>
    setData((d) => ({ ...d, [path]: value }));

  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-medium">{block.label}</p>
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
      <div className="space-y-4">
        {block.fields.map((field) => (
          <FieldEditor
            key={field.path}
            field={field}
            value={data[field.path]}
            onChange={(v) => setField(field.path, v)}
          />
        ))}
      </div>
    </div>
  );
}

function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.type === 'text') {
    return (
      <Field label={field.label} htmlFor={`f-${field.path}`}>
        <Input
          id={`f-${field.path}`}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
    );
  }
  if (field.type === 'textarea') {
    return (
      <Field label={field.label} htmlFor={`f-${field.path}`}>
        <Textarea
          id={`f-${field.path}`}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
    );
  }
  if (field.type === 'image') {
    const url = (value as string) ?? '';
    return (
      <Field label={field.label} htmlFor={`f-${field.path}`}>
        <div className="flex gap-3">
          {url && (
            <img
              src={url}
              alt=""
              className="h-16 w-24 shrink-0 rounded object-cover"
            />
          )}
          <Input
            id={`f-${field.path}`}
            type="url"
            value={url}
            placeholder="https://…"
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </Field>
    );
  }
  if (field.type === 'list') {
    const items = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div>
        <p className="mb-1 text-sm font-medium">{field.label}</p>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <Textarea
                className="min-h-[44px]"
                value={item}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = e.target.value;
                  onChange(next);
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          onClick={() => onChange([...items, ''])}
        >
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    );
  }
  // kv-list
  const [k1, k2] = field.keys ?? ['key', 'value'];
  const items = Array.isArray(value)
    ? (value as Record<string, unknown>[])
    : [];
  return (
    <div>
      <p className="mb-1 text-sm font-medium">{field.label}</p>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 rounded-md border border-line p-2">
            <div className="flex-1 space-y-2">
              <Input
                placeholder={k1}
                value={(item[k1] as string) ?? ''}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], [k1]: e.target.value };
                  onChange(next);
                }}
              />
              <Input
                placeholder={k2}
                value={(item[k2] as string) ?? ''}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], [k2]: e.target.value };
                  onChange(next);
                }}
              />
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="mt-2"
        onClick={() => onChange([...items, { [k1]: '', [k2]: '' }])}
      >
        <Plus className="h-4 w-4" /> Add
      </Button>
    </div>
  );
}
