import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ApiError } from '@pilates/api-client';
import { useAuth } from '@/auth/useAuth';
import { Seo } from '@/components/site/Seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export function RegisterPage() {
  const { user, register } = useAuth();
  const location = useLocation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/book/waiver" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(email, password, fullName);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? 'That email is already registered — try signing in.'
          : err instanceof ApiError && err.status === 400
            ? 'Password must be at least 8 characters.'
            : 'Something went wrong. Try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-sm place-items-center px-5">
      <Seo title="Create your account" path="/register" noindex />
      <div className="w-full">
        <p className="eyebrow mb-1">New here</p>
        <h1 className="mb-6 font-display text-3xl font-light tracking-tight">
          Create your account
        </h1>
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={submit} className="space-y-4">
              <Field label="Full name" htmlFor="name">
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Field>
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
              <Field
                label="Password"
                htmlFor="password"
                hint="At least 8 characters"
              >
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </Field>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Creating…' : 'Create account'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-sm text-muted">
          Already have one?{' '}
          <Link
            to="/login"
            state={location.state}
            className="text-primary underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
