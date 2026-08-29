import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { hooks } from '@/lib/api';
import { errorMessage } from '@/lib/toast';
import { Seo } from '@/components/site/Seo';
import { Button } from '@/components/ui/button';

export function GiftClaimPage() {
  const { token } = useParams<{ token: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const claim = hooks.useClaimGiftMutation();
  const [result, setResult] = useState<'idle' | 'claimed' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token || result !== 'idle' || claim.isPending) return;
    claim.mutate(token, {
      onSuccess: () => setResult('claimed'),
      onError: (err) => {
        setError(errorMessage(err));
        setResult('error');
      },
    });
    // Only fire once per token, once we know who's logged in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  return (
    <div className="mx-auto max-w-md px-5 py-24 text-center">
      <Seo title="Claim your credits" path={`/gift/${token ?? ''}`} noindex />
      <p className="eyebrow">MILE Credits</p>

      {authLoading || claim.isPending ? (
        <p className="mt-4 text-muted">Checking your gift…</p>
      ) : !user ? (
        <>
          <h1 className="mt-2 font-display text-3xl font-light tracking-tight">
            Someone sent you credits
          </h1>
          <p className="mt-4 text-muted">
            Sign in or create a MILE account to claim them.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link to="/register" state={{ from: `/gift/${token}` }}>
                Create account
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/login" state={{ from: `/gift/${token}` }}>
                Sign in
              </Link>
            </Button>
          </div>
        </>
      ) : result === 'claimed' ? (
        <>
          <h1 className="mt-2 font-display text-3xl font-light tracking-tight">
            Credits added
          </h1>
          <p className="mt-4 text-muted">
            They're in your account now — see your balance on the Account
            page.
          </p>
          <Button asChild className="mt-6">
            <Link to="/book/account">Go to my account</Link>
          </Button>
        </>
      ) : result === 'error' ? (
        <>
          <h1 className="mt-2 font-display text-3xl font-light tracking-tight">
            Couldn't claim this gift
          </h1>
          <p className="mt-4 text-muted">{error}</p>
        </>
      ) : null}
    </div>
  );
}
