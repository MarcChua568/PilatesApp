import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';

export function SectionHeading({
  eyebrow,
  title,
  lead,
  linkTo,
  linkLabel,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  linkTo?: string;
  linkLabel?: string;
}) {
  return (
    <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-2 font-display text-3xl font-light tracking-tight sm:text-4xl">
          {title}
        </h2>
        {lead && <p className="mt-3 text-muted">{lead}</p>}
      </div>
      {linkTo && linkLabel && (
        <Link
          to={linkTo}
          className="shrink-0 text-sm text-primary hover:underline"
        >
          {linkLabel} →
        </Link>
      )}
    </Reveal>
  );
}
