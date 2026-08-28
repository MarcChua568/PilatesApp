import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@pilates/ui';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { AnnouncementBar } from './AnnouncementBar';
import { StickyBookButton } from './StickyBookButton';

/** `bare` pages (home) let the hero sit under a transparent, then solid header. */
export function SiteLayout({ bare = false }: { bare?: boolean }) {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <SiteHeader overHero={bare} />
      <main className={bare ? '-mt-16 flex-1' : 'flex-1'}>
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
      <StickyBookButton />
    </div>
  );
}
