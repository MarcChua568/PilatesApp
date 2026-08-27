import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireStaff } from '@/auth/RequireStaff';
import { AppShell } from '@/components/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { InstructorsPage } from '@/pages/InstructorsPage';
import { RoomsPage } from '@/pages/RoomsPage';
import { ClassesPage } from '@/pages/ClassesPage';
import { SchedulePage } from '@/pages/SchedulePage';
import { ClassDetailPage } from '@/pages/ClassDetailPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { AnnouncementsPage } from '@/pages/AnnouncementsPage';
import { SettingsPage } from '@/pages/SettingsPage';

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
      { path: 'schedule', element: <SchedulePage /> },
      { path: 'schedule/:id', element: <ClassDetailPage /> },
      { path: 'classes', element: <ClassesPage /> },
      { path: 'instructors', element: <InstructorsPage /> },
      { path: 'rooms', element: <RoomsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'announcements', element: <AnnouncementsPage /> },
      {
        path: 'settings',
        element: (
          <RequireStaff role="admin">
            <SettingsPage />
          </RequireStaff>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
