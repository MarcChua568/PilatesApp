import { createBrowserRouter, Navigate } from 'react-router-dom';
import { SiteLayout } from '@/components/site/SiteLayout';
import { BookLayout } from '@/components/site/BookLayout';
import { RequireWaiver } from '@/auth/RequireAuth';
import { HomePage } from '@/pages/HomePage';
import { ClassTypesPage } from '@/pages/ClassTypesPage';
import { ClassInfoPage } from '@/pages/ClassInfoPage';
import { ClassesPage } from '@/pages/ClassesPage';
import { InstructorsPage } from '@/pages/InstructorsPage';
import { InstructorDetailPage } from '@/pages/InstructorDetailPage';
import { StartPage } from '@/pages/StartPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PricingPage } from '@/pages/PricingPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { AboutPage } from '@/pages/AboutPage';
import { TheSpacePage } from '@/pages/TheSpacePage';
import { LocationPage } from '@/pages/LocationPage';
import { ContactPage } from '@/pages/ContactPage';
import { ShopPage } from '@/pages/ShopPage';
import { EventsPage } from '@/pages/EventsPage';
import { EventDetailPage } from '@/pages/EventDetailPage';
import { PromoLandingPage } from '@/pages/PromoLandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { WaiverPage } from '@/pages/book/WaiverPage';
import { ClassDetailPage } from '@/pages/book/ClassDetailPage';
import { BookingConfirmationPage } from '@/pages/book/BookingConfirmationPage';
import { MyBookingsPage } from '@/pages/book/MyBookingsPage';
import { AccountPage } from '@/pages/book/AccountPage';
import { AnnouncementsPage } from '@/pages/book/AnnouncementsPage';
import { NotificationsPage } from '@/pages/book/NotificationsPage';

export const router = createBrowserRouter([
  {
    element: <SiteLayout bare />,
    children: [{ index: true, element: <HomePage /> }],
  },
  {
    element: <SiteLayout />,
    children: [
      { path: 'start', element: <StartPage /> },
      { path: 'classes', element: <ClassTypesPage /> },
      { path: 'classes/:slug', element: <ClassInfoPage /> },
      { path: 'schedule', element: <ClassesPage /> },
      { path: 'instructors', element: <InstructorsPage /> },
      { path: 'instructors/:id', element: <InstructorDetailPage /> },
      { path: 'pricing', element: <PricingPage /> },
      { path: 'checkout/:slug', element: <CheckoutPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'the-space', element: <TheSpacePage /> },
      { path: 'location', element: <LocationPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'shop', element: <ShopPage /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'events/:slug', element: <EventDetailPage /> },
      { path: 'promo/:slug', element: <PromoLandingPage /> },
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
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'news', element: <AnnouncementsPage /> },
          { path: 'account', element: <AccountPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
