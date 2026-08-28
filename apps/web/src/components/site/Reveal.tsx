import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
import { transitions } from '@pilates/ui';

/**
 * Fade + rise a block into view once. Falls back to visible after a short delay
 * if it never enters the viewport (very tall pages, no-scroll captures) so
 * content is never stuck hidden.
 */
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
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const [shown, setShown] = useState(false);
  const MotionTag = motion[as];

  useEffect(() => {
    if (inView) {
      setShown(true);
      return;
    }
    const t = setTimeout(() => setShown(true), 1100);
    return () => clearTimeout(t);
  }, [inView]);

  return (
    <MotionTag
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ ...transitions.editorial, delay: inView ? delay : 0 }}
    >
      {children}
    </MotionTag>
  );
}
