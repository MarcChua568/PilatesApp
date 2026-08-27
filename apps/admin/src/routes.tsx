import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireStaff } from '@/auth/RequireStaff';
import { AppShell } from '@/components/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireStaff>
        <AppShell />
      </RequireStaff>
    ),
    children: [
      { index: true, element: <Navigate to="/schedule" replace /> },
      { path: 'schedule', element: <PlaceholderPage title="Schedule" /> },
      { path: 'classes', element: <PlaceholderPage title="Classes" /> },
      { path: 'instructors', element: <PlaceholderPage title="Instructors" /> },
      { path: 'rooms', element: <PlaceholderPage title="Rooms" /> },
      { path: 'reports', element: <PlaceholderPage title="Reports" /> },
      {
        path: 'announcements',
        element: <PlaceholderPage title="Announcements" />,
      },
      {
        path: 'settings',
        element: (
          <RequireStaff role="admin">
            <PlaceholderPage title="Settings" />
          </RequireStaff>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
