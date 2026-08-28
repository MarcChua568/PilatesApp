import { useState } from 'react';
import { format } from 'date-fns';
import type { WaiverSubmission } from '@pilates/api-client';
import { hooks } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function WaiversPage() {
  const { data, isLoading, error } = hooks.useWaivers();
  const [viewing, setViewing] = useState<WaiverSubmission | undefined>();

  const columns: Column<WaiverSubmission>[] = [
    {
      key: 'name',
      header: 'Member',
      cell: (r) => r.user?.fullName ?? r.fullName,
    },
    {
      key: 'ec',
      header: 'Emergency contact',
      cell: (r) => `${r.emergencyContactName} · ${r.emergencyContactPhone}`,
    },
    {
      key: 'medical',
      header: 'Medical notes',
      cell: (r) =>
        r.medicalNotes ? (
          <span className="line-clamp-1 text-muted">{r.medicalNotes}</span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      cell: (r) => format(new Date(r.submittedAt), 'd MMM yyyy'),
    },
  ];

  return (
    <div>
      <PageHeader title="Waivers & intake">
        <p className="mt-1 text-sm text-muted">
          Every member completes this once before their first class.
        </p>
      </PageHeader>
      <div className="rounded-lg border border-line bg-surface">
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          empty="No waiver submissions yet."
          onRowClick={(r) => setViewing(r)}
        />
      </div>

      <Dialog
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {viewing?.user?.fullName ?? viewing?.fullName}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <dl className="space-y-3 text-sm">
              <Row label="Full name" value={viewing.fullName} />
              <Row label="Date of birth" value={viewing.dateOfBirth} />
              <Row
                label="Emergency contact"
                value={`${viewing.emergencyContactName} · ${viewing.emergencyContactPhone}`}
              />
              <Row
                label="Medical notes"
                value={viewing.medicalNotes ?? '—'}
              />
              <Row
                label="Accepted terms"
                value={viewing.acceptedTerms ? 'Yes' : 'No'}
              />
              <Row label="Signature" value={viewing.signature} />
              <Row
                label="Submitted"
                value={format(new Date(viewing.submittedAt), 'PPpp')}
              />
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
