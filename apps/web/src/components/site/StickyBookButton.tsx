import { Link, useLocation } from 'react-router-dom';

/** Fixed "Book a class" CTA on small screens, hidden where it would be noise. */
export function StickyBookButton() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/book') || pathname === '/schedule') return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-40 lg:hidden">
      <Link
        to="/schedule"
        className="block rounded-full bg-primary py-3 text-center text-sm font-medium text-primary-fg shadow-lg shadow-deep/20"
      >
        Book a class
      </Link>
    </div>
  );
}
