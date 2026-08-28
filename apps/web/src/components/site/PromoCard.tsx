import { Link } from 'react-router-dom';
import type { Promotion } from '@pilates/api-client';
import { Button } from '@/components/ui/button';

export function PromoCard({ promo }: { promo: Promotion }) {
  const href = promo.landingSlug ? `/promo/${promo.landingSlug}` : promo.ctaHref;
  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface md:flex-row">
      {promo.imageUrl && (
        <div className="aspect-[16/10] overflow-hidden bg-line/40 md:aspect-auto md:w-2/5">
          <img
            src={promo.imageUrl}
            alt=""
            className="editorial-img h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col justify-center p-6">
        <p className="font-display text-2xl leading-snug tracking-tight">
          {promo.headline}
        </p>
        <p className="mt-2 text-sm text-muted">{promo.body}</p>
        <div className="mt-5">
          <Button asChild variant="outline" size="sm">
            <Link to={href}>{promo.ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
