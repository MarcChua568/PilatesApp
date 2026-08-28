import { useRef, type ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
import { transitions } from '@pilates/ui';

/** Fade + rise a block into view once, editorial easing. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li';
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -12% 0px' });
  const MotionTag = motion[as];

  return (
    <MotionTag
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ ...transitions.editorial, delay }}
    >
      {children}
    </MotionTag>
  );
}
