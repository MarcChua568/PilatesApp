import { NavLink, Outlet, Link } from 'react-router-dom';
import { CalendarDays, Ticket, User, Megaphone } from 'lucide-react';
import { cn } from '@pilates/ui';

const TABS = [
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/bookings', label: 'My bookings', icon: Ticket },
  { to: '/account', label: 'Account', icon: User },
];

export function AppShell() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="eyebrow">Pilates Studio</p>
          <p className="text-base font-light tracking-tightpx">Book a class</p>
        </div>
        <Link to="/announcements" className="text-muted hover:text-ink">
          <Megaphone className="h-5 w-5" />
        </Link>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-lg border-t border-line bg-surface">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs',
                isActive ? 'text-primary' : 'text-muted',
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
