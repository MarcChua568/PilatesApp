import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@pilates/ui';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

/** `bare` pages (home) render their own hero-flush header; others get top padding. */
export function SiteLayout({ bare = false }: { bare?: boolean }) {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader overHero={bare} />
      <main className={bare ? '' : 'flex-1 pt-16'}>
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
      <SiteFooter />
    </div>
  );
}
