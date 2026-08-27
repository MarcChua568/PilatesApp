import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export function RequireWaiver({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user && !user.healthWaiverSignedAt) {
    return <Navigate to="/waiver" replace />;
  }
  return <>{children}</>;
}
