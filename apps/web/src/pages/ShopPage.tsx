import { hooks } from '@/lib/api';
import { Seo } from '@/components/site/Seo';
import { Reveal } from '@/components/site/Reveal';
import { ProductCard } from '@/components/site/ProductCard';

export function ShopPage() {
  const { data: products, isLoading } = hooks.useProducts();

  return (
    <div className="mx-auto max-w-6xl px-5 py-20">
      <Seo
        title="MILE Shop"
        description="MILE Shop — apparel, grip socks and wellness goods, including pieces from our MILI partnership."
        path="/shop"
      />

      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">MILE Shop</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tight sm:text-5xl">
          Made to move with you.
        </h1>
        <p className="mt-4 text-muted">
          Grip socks, apparel and small-batch wellness goods we actually use
          around the studio — plus a curated drop from our partners at{' '}
          <span className="font-medium text-ink">MILI</span>. Most pieces are
          available in-studio; a few link out to shop directly.
        </p>
      </Reveal>

      {isLoading && (
        <p className="mt-16 text-center text-muted">Loading…</p>
      )}

      {!isLoading && !products?.length && (
        <Reveal className="mx-auto mt-16 max-w-md text-center text-muted">
          <p>The shop is being restocked — check back soon.</p>
        </Reveal>
      )}

      {!!products?.length && (
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Reveal key={p.id}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
