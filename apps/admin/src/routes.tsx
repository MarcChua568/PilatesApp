import type { ReactNode } from 'react';
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
import { EventsPage } from '@/pages/EventsPage';
import { PromotionsPage } from '@/pages/PromotionsPage';
import { PackagesPage } from '@/pages/PackagesPage';
import { ShopPage } from '@/pages/ShopPage';
import { SiteContentPage } from '@/pages/SiteContentPage';
import { WaiversPage } from '@/pages/WaiversPage';
import { TeamPage } from '@/pages/TeamPage';

function gated(permission: string, element: ReactNode) {
  return <RequireStaff permission={permission}>{element}</RequireStaff>;
}

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
      { path: 'schedule', element: gated('schedule', <SchedulePage />) },
      { path: 'schedule/:id', element: gated('schedule', <ClassDetailPage />) },
      { path: 'classes', element: gated('classes', <ClassesPage />) },
      { path: 'instructors', element: gated('instructors', <InstructorsPage />) },
      { path: 'rooms', element: gated('rooms', <RoomsPage />) },
      { path: 'events', element: gated('events', <EventsPage />) },
      { path: 'promotions', element: gated('promotions', <PromotionsPage />) },
      { path: 'packages', element: gated('pricing', <PackagesPage />) },
      { path: 'shop', element: gated('shop', <ShopPage />) },
      { path: 'site-content', element: gated('site-content', <SiteContentPage />) },
      { path: 'waivers', element: gated('waivers', <WaiversPage />) },
      { path: 'reports', element: gated('reports', <ReportsPage />) },
      { path: 'announcements', element: gated('announcements', <AnnouncementsPage />) },
      { path: 'settings', element: gated('settings', <SettingsPage />) },
      {
        path: 'team',
        element: (
          <RequireStaff role="superadmin">
            <TeamPage />
          </RequireStaff>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
