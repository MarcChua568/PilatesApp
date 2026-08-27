import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UserPublic } from '@pilates/api-client';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';

export function MemberSearchCombobox({
  onSelect,
  selected,
}: {
  onSelect: (member: UserPublic | null) => void;
  selected: UserPublic | null;
}) {
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 250);
    return () => clearTimeout(t);
  }, [term]);

  const { data } = useQuery({
    queryKey: ['users', 'search', debounced],
    queryFn: () => api.users.list({ role: 'member', q: debounced, pageSize: 8 }),
    enabled: debounced.length >= 2 && !selected,
  });

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2 text-sm">
        <span>
          {selected.fullName}{' '}
          <span className="text-muted">{selected.email}</span>
        </span>
        <button
          type="button"
          className="text-xs text-primary underline"
          onClick={() => {
            onSelect(null);
            setTerm('');
          }}
        >
          change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        placeholder="Search members by name or email…"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      {data && data.data.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface">
          {data.data.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-line/40"
                onClick={() => onSelect(m)}
              >
                <span>{m.fullName}</span>
                <span className="text-xs text-muted">
                  {m.email}
                  {!m.healthWaiverSignedAt && ' · no waiver'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {data && debounced.length >= 2 && data.data.length === 0 && (
        <p className="mt-1 text-xs text-muted">No members match “{debounced}”.</p>
      )}
    </div>
  );
}
