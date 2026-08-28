import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, pageVariants } from '@pilates/ui';
import { RequireAuth } from '@/auth/RequireAuth';

const TABS = [
  { to: '/classes', label: 'Schedule', end: true },
  { to: '/book/bookings', label: 'My bookings' },
  { to: '/book/news', label: 'News' },
  { to: '/book/account', label: 'Account' },
];

export function BookLayout() {
  const location = useLocation();
  return (
    <RequireAuth>
      <div className="mx-auto max-w-4xl px-5 py-12">
        <nav className="mb-8 flex gap-1 border-b border-line">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  '-mb-px border-b-2 px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'border-primary text-ink'
                    : 'border-transparent text-muted hover:text-ink',
                )
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
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
      </div>
    </RequireAuth>
  );
}
