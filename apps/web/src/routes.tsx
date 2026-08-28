import { createBrowserRouter, Navigate } from 'react-router-dom';
import { SiteLayout } from '@/components/site/SiteLayout';
import { BookLayout } from '@/components/site/BookLayout';
import { RequireWaiver } from '@/auth/RequireAuth';
import { HomePage } from '@/pages/HomePage';
import { ClassesPage } from '@/pages/ClassesPage';
import { InstructorsPage } from '@/pages/InstructorsPage';
import { PricingPage } from '@/pages/PricingPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { WaiverPage } from '@/pages/book/WaiverPage';
import { ClassDetailPage } from '@/pages/book/ClassDetailPage';
import { BookingConfirmationPage } from '@/pages/book/BookingConfirmationPage';
import { MyBookingsPage } from '@/pages/book/MyBookingsPage';
import { AccountPage } from '@/pages/book/AccountPage';
import { AnnouncementsPage } from '@/pages/book/AnnouncementsPage';

export const router = createBrowserRouter([
  {
    element: <SiteLayout bare />,
    children: [{ index: true, element: <HomePage /> }],
  },
  {
    element: <SiteLayout />,
    children: [
      { path: 'classes', element: <ClassesPage /> },
      { path: 'instructors', element: <InstructorsPage /> },
      { path: 'pricing', element: <PricingPage /> },
      { path: 'checkout/:slug', element: <CheckoutPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        path: 'book',
        element: <BookLayout />,
        children: [
          { index: true, element: <Navigate to="/book/bookings" replace /> },
          { path: 'waiver', element: <WaiverPage /> },
          {
            path: 'class/:id',
            element: (
              <RequireWaiver>
                <ClassDetailPage />
              </RequireWaiver>
            ),
          },
          {
            path: 'confirmation/:bookingId',
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
          { path: 'news', element: <AnnouncementsPage /> },
          { path: 'account', element: <AccountPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
