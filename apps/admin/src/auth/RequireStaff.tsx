import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

export function RequireStaff({
  children,
  role,
}: {
  children: ReactNode;
  role?: 'admin';
}) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-muted">Loading…</div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role === 'member') {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <p className="eyebrow mb-2">Not authorized</p>
          <p className="text-muted">
            This is the studio admin panel. Members should use the member app.
          </p>
        </div>
      </div>
    );
  }

  if (role === 'admin' && user.role !== 'admin') {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <p className="eyebrow mb-2">Admins only</p>
          <p className="text-muted">This section needs an admin account.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
