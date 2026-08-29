import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@pilates/ui';
import {
  CalendarDays,
  CalendarHeart,
  ClipboardCheck,
  Dumbbell,
  DoorOpen,
  FileText,
  LayoutGrid,
  Megaphone,
  BarChart3,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Wallet,
  LogOut,
} from 'lucide-react';
import { cn } from '@pilates/ui';
import { useAuth } from '@/auth/useAuth';

const NAV = [
  { to: '/schedule', label: 'Schedule', icon: CalendarDays, permission: 'schedule' },
  { to: '/classes', label: 'Classes', icon: LayoutGrid, permission: 'classes' },
  { to: '/instructors', label: 'Instructors', icon: Dumbbell, permission: 'instructors' },
  { to: '/rooms', label: 'Rooms', icon: DoorOpen, permission: 'rooms' },
  { to: '/events', label: 'Events', icon: CalendarHeart, permission: 'events' },
  { to: '/promotions', label: 'Promotions', icon: Tag, permission: 'promotions' },
  { to: '/packages', label: 'Pricing', icon: Wallet, permission: 'pricing' },
  { to: '/shop', label: 'Shop', icon: ShoppingBag, permission: 'shop' },
  { to: '/site-content', label: 'Site content', icon: FileText, permission: 'site-content' },
  { to: '/waivers', label: 'Waivers', icon: ClipboardCheck, permission: 'waivers' },
  { to: '/reports', label: 'Reports', icon: BarChart3, permission: 'reports' },
  { to: '/announcements', label: 'Announcements', icon: Megaphone, permission: 'announcements' },
  { to: '/settings', label: 'Settings', icon: Settings, permission: 'settings' },
  { to: '/team', label: 'Team & access', icon: ShieldCheck, superadminOnly: true },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface">
        <div className="px-5 py-6">
          <p className="eyebrow">MILE Wellness</p>
          <p className="font-display text-xl font-light tracking-tight">
            Studio Admin
          </p>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.filter((i) => {
            if (user?.role === 'superadmin') return true;
            if (i.superadminOnly || !i.permission) return false;
            return (user?.permissions ?? []).includes(i.permission);
          }).map(
            ({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-fg'
                      : 'text-muted hover:bg-line/40 hover:text-ink',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ),
          )}
        </nav>
        <div className="border-t border-line p-3">
          <div className="px-2 pb-2 text-sm">
            <p className="truncate font-medium">{user?.fullName}</p>
            <p className="truncate text-xs text-muted">
              {user?.email} · {user?.role}
            </p>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-line/40 hover:text-ink"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden px-8 py-7">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
