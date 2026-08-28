/**
 * Shared framer-motion variants + transitions. Kept as plain objects so this
 * package doesn't need framer-motion as a dependency — the apps pass them to
 * `motion.*` components.
 */

const EASE = [0.22, 0.61, 0.36, 1] as const;

export const transitions = {
  editorial: { duration: 0.5, ease: EASE },
  quick: { duration: 0.28, ease: EASE },
  spring: { type: 'spring', stiffness: 320, damping: 30 },
} as const;

/** Page/route cross-fade + slide-up. */
export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: transitions.editorial },
  exit: { opacity: 0, y: -8, transition: transitions.quick },
};

/** Parent for a staggered list. */
export const listVariants = {
  animate: { transition: { staggerChildren: 0.045 } },
};

/** Child row within a staggered list. */
export const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: transitions.editorial },
};

/** Dialog / sheet content. */
export const dialogVariants = {
  initial: { opacity: 0, scale: 0.97, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: transitions.spring },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: transitions.quick },
};

/** Subtle press feedback for interactive cards/buttons. */
export const pressable = {
  whileHover: { y: -2 },
  whileTap: { y: 0, scale: 0.99 },
  transition: transitions.quick,
};
