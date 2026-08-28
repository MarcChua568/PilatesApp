import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ApiError } from '@pilates/api-client';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dest =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ??
    '/book/bookings';

  if (user) return <Navigate to={dest} replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'Wrong email or password.'
          : 'Something went wrong. Try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-sm place-items-center px-5">
      <div className="w-full">
        <p className="eyebrow mb-1">Welcome back</p>
        <h1 className="mb-6 font-display text-3xl font-light tracking-tightpx">
          Sign in
        </h1>
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={submit} className="space-y-4">
              <Field label="Email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field label="Password" htmlFor="password">
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-sm text-muted">
          No account?{' '}
          <Link
            to="/register"
            state={location.state}
            className="text-primary underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
