import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { hooks } from '@/lib/api';
import { toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function WaiverPage() {
  const { user, refetchUser } = useAuth();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const sign = hooks.useSignWaiverMutation();

  if (user?.healthWaiverSignedAt) return <Navigate to="/classes" replace />;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <p className="eyebrow mb-1">One-time step</p>
      <h1 className="mb-4 text-2xl">Health &amp; liability waiver</h1>
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="max-h-64 space-y-3 overflow-y-auto rounded-md border border-line bg-bg/40 p-3 text-sm text-muted">
            <p className="font-medium text-ink">
              Placeholder waiver text — replace with the studio’s reviewed copy.
            </p>
            <p>
              I confirm I am physically able to participate in movement classes and
              have disclosed any conditions that may affect my participation. I
              understand the risks of physical exercise and participate at my own
              risk.
            </p>
            <p>
              I agree to arrive on time, follow instructor guidance, and respect
              the studio’s booking and cancellation policy.
            </p>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5"
            />
            I have read and agree to the waiver above.
          </label>

          <Button
            className="w-full"
            disabled={!agreed || sign.isPending}
            onClick={() =>
              sign.mutate(undefined, {
                onSuccess: async () => {
                  await refetchUser();
                  navigate("/classes", { replace: true });
                },
                onError: toastError,
              })
            }
          >
            {sign.isPending ? 'Saving…' : 'Agree & continue'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
