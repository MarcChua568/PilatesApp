import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { hooks } from '@/lib/api';
import { peso } from '@/lib/format';
import { packageUnit, packageValidity } from '@/lib/packages';
import { Seo } from '@/components/site/Seo';
import { Reveal } from '@/components/site/Reveal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function PricingPage() {
  const { data: packages, isLoading } = hooks.usePackages();
  const sorted = [...(packages ?? [])].sort(
    (a, b) => Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder,
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <Seo
        title="Pricing"
        description="MILE pricing — an intro offer, single classes, class packs and monthly unlimited. Simple, no lock-in."
        path="/pricing"
      />

      <Reveal>
        <p className="eyebrow">Pricing</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tight sm:text-5xl">
          Simple, no lock-in
        </h1>
        <p className="mt-3 max-w-lg text-muted">
          Start with the intro offer, then choose what fits. Checkout is a
          preview for now — payment connects before launch.
        </p>
      </Reveal>

      {isLoading ? (
        <p className="mt-12 text-sm text-muted">Loading…</p>
      ) : (
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {sorted.map((p, i) => {
            const validity = packageValidity(p);
            const showPopular = p.featured && sorted.findIndex((x) => x.featured) === i;
            return (
              <Reveal key={p.slug} delay={i * 0.06}>
                <Card
                  className={
                    p.featured
                      ? 'flex h-full flex-col border-primary/50 bg-primary/[0.04]'
                      : 'flex h-full flex-col'
                  }
                >
                  <CardContent className="flex flex-1 flex-col pt-6">
                    {showPopular && (
                      <p className="eyebrow mb-2 text-primary">Most popular</p>
                    )}
                    <p className="font-display text-xl">{p.name}</p>
                    <p className="mt-2 font-display text-4xl font-light tracking-tight">
                      {peso(p.pricePhp)}
                    </p>
                    <p className="text-sm text-muted">{packageUnit(p)}</p>
                    <p className="mt-3 text-sm text-muted">{p.blurb}</p>

                    <ul className="mt-5 space-y-2 text-sm">
                      {p.perks.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div className="flex-1" />
                    {validity && (
                      <p className="mt-4 text-xs text-muted">{validity}</p>
                    )}
                    <Button
                      className="mt-3 w-full"
                      variant={p.featured ? 'default' : 'outline'}
                      asChild
                    >
                      <Link to={`/checkout/${p.slug}`}>Choose {p.name}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </Reveal>
            );
          })}
        </div>
      )}

      <p className="mt-10 text-sm text-muted">
        Prices include 12% VAT. Questions about memberships?{' '}
        <Link to="/contact" className="text-primary underline">
          Get in touch
        </Link>
        .
      </p>
    </div>
  );
}
