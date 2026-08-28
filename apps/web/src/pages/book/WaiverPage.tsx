import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { hooks } from '@/lib/api';
import { errorMessage, toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export function WaiverPage() {
  const { user, refetchUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const submit = hooks.useSubmitWaiverMutation();

  const next =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ??
    '/book/bookings';

  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    dateOfBirth: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalNotes: '',
    signature: '',
  });
  const [agreed, setAgreed] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (user?.healthWaiverSignedAt) return <Navigate to={next} replace />;

  const canSubmit =
    agreed &&
    form.fullName &&
    form.dateOfBirth &&
    form.emergencyContactName &&
    form.emergencyContactPhone &&
    form.signature &&
    !submit.isPending;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit.mutate(
      { ...form, medicalNotes: form.medicalNotes || undefined, acceptedTerms: true },
      {
        onSuccess: async () => {
          await refetchUser();
          toast.success('Waiver saved — you can book now.');
          navigate(next, { replace: true });
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <p className="eyebrow mb-1">One-time step</p>
      <h1 className="mb-1 font-display text-2xl font-light tracking-tightpx">
        Waiver &amp; health intake
      </h1>
      <p className="mb-5 text-sm text-muted">
        We ask everyone to complete this once before their first class.
      </p>

      <Card>
        <CardContent className="pt-5">
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Full name" htmlFor="w-name">
              <Input id="w-name" value={form.fullName} onChange={set('fullName')} required />
            </Field>
            <Field label="Date of birth" htmlFor="w-dob">
              <Input
                id="w-dob"
                type="date"
                value={form.dateOfBirth}
                onChange={set('dateOfBirth')}
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Emergency contact" htmlFor="w-ec-name">
                <Input
                  id="w-ec-name"
                  value={form.emergencyContactName}
                  onChange={set('emergencyContactName')}
                  required
                />
              </Field>
              <Field label="Their phone" htmlFor="w-ec-phone">
                <Input
                  id="w-ec-phone"
                  value={form.emergencyContactPhone}
                  onChange={set('emergencyContactPhone')}
                  required
                />
              </Field>
            </div>
            <Field
              label="Injuries or conditions we should know about (optional)"
              htmlFor="w-med"
            >
              <textarea
                id="w-med"
                rows={3}
                value={form.medicalNotes}
                onChange={set('medicalNotes')}
                className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>

            <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-line bg-bg/40 p-3 text-xs text-muted">
              <p className="font-medium text-ink">Liability waiver</p>
              <p>
                I confirm I am physically able to participate in movement classes
                and have disclosed any condition that may affect my
                participation. I understand that physical exercise carries risk
                and I take part at my own risk.
              </p>
              <p>
                I agree to follow instructor guidance and the studio's booking
                and cancellation policy. I consent to first aid being
                administered if needed.
              </p>
              <p className="text-[11px] italic">
                Placeholder copy — replace with the studio's reviewed terms
                before launch.
              </p>
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5"
              />
              I have read and accept the waiver and terms above.
            </label>

            <Field label="Type your full name to sign" htmlFor="w-sig">
              <Input id="w-sig" value={form.signature} onChange={set('signature')} required />
            </Field>

            <Button type="submit" className="w-full" disabled={!canSubmit}>
              {submit.isPending ? 'Saving…' : 'Sign & continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
