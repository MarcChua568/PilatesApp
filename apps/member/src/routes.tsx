import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from '@/auth/RequireAuth';
import { RequireWaiver } from '@/auth/RequireWaiver';
import { AppShell } from '@/components/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { WaiverPage } from '@/pages/WaiverPage';
import { SchedulePage } from '@/pages/SchedulePage';
import { ClassDetailPage } from '@/pages/ClassDetailPage';
import { BookingConfirmationPage } from '@/pages/BookingConfirmationPage';
import { MyBookingsPage } from '@/pages/MyBookingsPage';
import { AccountPage } from '@/pages/AccountPage';
import { AnnouncementsPage } from '@/pages/AnnouncementsPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/schedule" replace /> },
      { path: 'waiver', element: <WaiverPage /> },
      { path: 'account', element: <AccountPage /> },
      { path: 'announcements', element: <AnnouncementsPage /> },
      {
        path: 'schedule',
        element: (
          <RequireWaiver>
            <SchedulePage />
          </RequireWaiver>
        ),
      },
      {
        path: 'schedule/:id',
        element: (
          <RequireWaiver>
            <ClassDetailPage />
          </RequireWaiver>
        ),
      },
      {
        path: 'booking/:bookingId',
        element: (
          <RequireWaiver>
            <BookingConfirmationPage />
          </RequireWaiver>
        ),
      },
      {
        path: 'bookings',
        element: (
          <RequireWaiver>
            <MyBookingsPage />
          </RequireWaiver>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
