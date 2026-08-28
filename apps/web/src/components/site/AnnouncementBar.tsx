import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { hooks } from '@/lib/api';

const KEY = 'mile.promoDismissed';

function readDismissed(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/**
 * Site-wide bar driven by the first active promotion flagged showInTopBar.
 * Dismissible per browser; reappears if the studio publishes a different promo.
 */
export function AnnouncementBar() {
  const { data: promos } = hooks.usePromotions();
  const [dismissed, setDismissed] = useState<string | null>(readDismissed);

  const promo = (promos ?? []).find((p) => p.showInTopBar);
  if (!promo || dismissed === promo.id) return null;

  const href = promo.landingSlug ? `/promo/${promo.landingSlug}` : promo.ctaHref;

  function dismiss() {
    try {
      localStorage.setItem(KEY, promo!.id);
    } catch {
      /* ignore */
    }
    setDismissed(promo!.id);
  }

  return (
    <div className="relative z-50 bg-primary text-primary-fg">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-10 py-2 text-center text-sm">
        <Link to={href} className="hover:underline">
          <span className="font-medium">{promo.headline}</span>
          <span className="hidden sm:inline"> — {promo.ctaLabel} →</span>
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
