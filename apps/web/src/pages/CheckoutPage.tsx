import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Lock } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { hooks } from '@/lib/api';
import { peso } from '@/lib/format';
import { packageUnit } from '@/lib/packages';
import { Seo } from '@/components/site/Seo';
import { Reveal } from '@/components/site/Reveal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export function CheckoutPage() {
  const { slug } = useParams();
  const { data: plan, isLoading, isError } = hooks.usePackage(slug);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (isLoading) {
    return <div className="mx-auto max-w-4xl px-5 py-20 text-sm text-muted">Loading…</div>;
  }
  if (isError || !plan) return <Navigate to="/pricing" replace />;

  const vat = Math.round(plan.pricePhp * 0.12);
  const subtotal = plan.pricePhp - vat;

  function pay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setDone(true);
    }, 900);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <Seo title="Checkout" path={`/checkout/${plan.slug}`} noindex />
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent/15 text-accent">
          <Check className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-3xl font-light tracking-tightpx">
          You're all set
        </h1>
        <p className="mt-2 text-sm text-muted">
          This is a preview checkout — no card was charged and no plan was
          activated. Payment will be connected before launch.
        </p>
        <div className="mt-8 flex justify-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/pricing">Back to pricing</Link>
          </Button>
          <Button asChild>
            <Link to="/schedule">Browse classes</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <Seo title={`Checkout · ${plan.name}`} path={`/checkout/${plan.slug}`} noindex />
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <Reveal>
        <p className="eyebrow">Checkout</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tightpx">
          {plan.name}
        </h1>
      </Reveal>

      <div className="mt-4 rounded-md border border-primary/30 bg-primary/[0.05] px-4 py-3 text-sm text-primary">
        Preview only — payment isn't connected yet. Nothing you enter is sent
        anywhere and no card will be charged.
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[1.4fr_1fr]">
        <form onSubmit={pay} className="space-y-5">
          <Field label="Email" htmlFor="co-email">
            <Input
              id="co-email"
              type="email"
              defaultValue={user?.email ?? ''}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Name on card" htmlFor="co-name">
            <Input id="co-name" defaultValue={user?.fullName ?? ''} />
          </Field>
          <Field label="Card number" htmlFor="co-card">
            <Input
              id="co-card"
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Expiry" htmlFor="co-exp">
              <Input id="co-exp" placeholder="MM / YY" />
            </Field>
            <Field label="CVC" htmlFor="co-cvc">
              <Input id="co-cvc" inputMode="numeric" placeholder="123" />
            </Field>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            <Lock className="h-4 w-4" />
            {busy ? 'Processing…' : `Pay ${peso(plan.pricePhp)}`}
          </Button>
          <p className="text-center text-xs text-muted">
            By continuing you agree to the studio's terms and cancellation
            policy.
          </p>
        </form>

        <div>
          <Card>
            <CardContent className="pt-5">
              <p className="eyebrow mb-3">Order summary</p>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-xs text-muted">{packageUnit(plan)}</p>
                </div>
                <p className="font-display text-lg">{peso(plan.pricePhp)}</p>
              </div>
              <p className="mt-2 text-sm text-muted">{plan.blurb}</p>

              <div className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
                <Row label="Subtotal" value={peso(subtotal)} />
                <Row label="VAT (12%)" value={peso(vat)} />
                <div className="flex justify-between border-t border-line pt-2 font-medium">
                  <span>Total</span>
                  <span>{peso(plan.pricePhp)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {!user && (
            <p className="mt-3 text-xs text-muted">
              Have an account?{' '}
              <Link
                to="/login"
                state={{ from: { pathname: `/checkout/${plan.slug}` } }}
                className="text-primary underline"
              >
                Sign in
              </Link>{' '}
              to attach this to your profile.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
