import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '@pilates/ui';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';

const LINKS = [
  { to: '/classes', label: 'Classes' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/instructors', label: 'Instructors' },
  { to: '/events', label: 'Events' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
];

const MORE = [
  { to: '/the-space', label: 'The Space' },
  { to: '/location', label: 'Location' },
  { to: '/contact', label: 'Contact' },
  { to: '/shop', label: 'Shop' },
];

export function SiteHeader({ overHero = false }: { overHero?: boolean }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const solid = scrolled || !overHero || open;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-colors duration-300 ease-editorial',
        solid
          ? 'border-b border-line bg-bg/92 backdrop-blur'
          : 'bg-gradient-to-b from-deep/50 to-transparent text-deep-fg [text-shadow:0_1px_8px_rgba(0,0,0,0.25)]',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="font-display text-xl tracking-tightpx">
          MILE<span className="text-primary">.</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  'text-sm transition-colors',
                  isActive ? 'text-primary' : 'hover:text-primary',
                  !solid && !isActive && 'text-deep-fg/90 hover:text-deep-fg',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/book/bookings" className="text-sm hover:text-primary">
                My bookings
              </Link>
              <Button
                size="sm"
                variant={solid ? 'outline' : 'default'}
                onClick={logout}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm hover:text-primary">
                Sign in
              </Link>
              <Button size="sm" asChild>
                <Link to="/schedule">Book a class</Link>
              </Button>
            </div>
          )}
        </nav>

        <button
          className="lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-bg px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {[...LINKS, ...MORE].map((l) => (
              <Link key={l.to} to={l.to} className="text-sm">
                {l.label}
              </Link>
            ))}
            <div className="my-1 h-px bg-line" />
            {user ? (
              <>
                <Link to="/book/bookings" className="text-sm">
                  My bookings
                </Link>
                <button
                  onClick={logout}
                  className="text-left text-sm text-muted"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm">
                  Sign in
                </Link>
                <Button asChild className="mt-1 w-full">
                  <Link to="/schedule">Book a class</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
