import { Link, Navigate, useParams } from 'react-router-dom';
import { hooks } from '@/lib/api';
import { Seo } from '@/components/site/Seo';
import { Reveal } from '@/components/site/Reveal';
import { Button } from '@/components/ui/button';

export function PromoLandingPage() {
  const { slug } = useParams();
  const { data: promo, isLoading, isError } = hooks.usePromotion(slug);

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-5 py-20 text-sm text-muted">Loading…</div>;
  }
  if (isError || !promo) return <Navigate to="/" replace />;

  return (
    <div>
      <Seo
        title={promo.headline}
        description={promo.body}
        path={`/promo/${promo.landingSlug}`}
        image={promo.imageUrl ?? undefined}
      />

      <section className="relative flex min-h-[70vh] items-center overflow-hidden">
        {promo.imageUrl && (
          <img
            src={promo.imageUrl}
            alt=""
            className="editorial-img absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-deep/70" />
        <div className="relative mx-auto w-full max-w-3xl px-5 text-center text-deep-fg">
          <Reveal>
            <p className="eyebrow text-deep-fg/60">MILE Wellness</p>
            <h1 className="mt-3 font-display text-4xl font-light leading-[1.1] tracking-tightpx sm:text-6xl">
              {promo.headline}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-deep-fg/85">{promo.body}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link to={promo.ctaHref}>{promo.ctaLabel}</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-deep-fg/40 text-deep-fg hover:bg-deep-fg/10"
                asChild
              >
                <Link to="/schedule">See the timetable</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
