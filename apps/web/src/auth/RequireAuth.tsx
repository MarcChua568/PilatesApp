import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

/** Gate for the booking area. Sends guests to /login, remembering where they were headed. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-muted">
        Loading…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

export function RequireWaiver({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user && !user.healthWaiverSignedAt) {
    return <Navigate to="/book/waiver" replace />;
  }
  return <>{children}</>;
}
