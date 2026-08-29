import { useRef } from 'react';
import type { Product } from '@pilates/api-client';
import { peso } from '@/lib/format';

const CATEGORY_LABELS: Record<Product['category'], string> = {
  apparel: 'Apparel',
  'grip-socks': 'Grip socks',
  wellness: 'Wellness',
  merch: 'Merch',
  other: 'Shop',
};

/** Editorial product tile — plays its B-roll on hover, falls back to a
 * static image. No cart: a single CTA per item, matching the "reserve, don't
 * check out" pattern the rest of the site uses. */
export function ProductCard({ product }: { product: Product }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors hover:border-primary/40">
      <div
        className="relative aspect-[4/5] overflow-hidden bg-line/40"
        onMouseEnter={() => videoRef.current?.play()}
        onMouseLeave={() => {
          const v = videoRef.current;
          if (v) {
            v.pause();
            v.currentTime = 0;
          }
        }}
      >
        {product.videoUrl && (
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="metadata"
            poster={product.imageUrl ?? undefined}
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={product.videoUrl} type="video/mp4" />
          </video>
        )}
        {!product.videoUrl && product.imageUrl && (
          <img
            src={product.imageUrl}
            alt=""
            className="editorial-img h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
          />
        )}
        {product.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-1 text-xs uppercase tracking-eyebrow text-accent">
            Featured
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow text-accent">{CATEGORY_LABELS[product.category]}</p>
        <p className="mt-1 font-display text-xl leading-snug">{product.name}</p>
        {product.description && (
          <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">
            {product.description}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-medium">
            {product.pricePhp != null ? peso(product.pricePhp) : 'In-studio only'}
          </span>
          {product.externalUrl ? (
            <a
              href={product.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Shop now
            </a>
          ) : (
            <span className="text-muted">Ask at the front desk</span>
          )}
        </div>
      </div>
    </div>
  );
}
