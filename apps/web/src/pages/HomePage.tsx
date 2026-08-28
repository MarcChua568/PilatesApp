import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { transitions } from '@pilates/ui';
import { hooks } from '@/lib/api';
import { block } from '@/lib/content';
import { SITE, localBusinessLd } from '@/lib/seo';
import { Seo } from '@/components/site/Seo';
import { Reveal } from '@/components/site/Reveal';
import { SectionHeading } from '@/components/site/SectionHeading';
import { EventCard } from '@/components/site/EventCard';
import { PromoCard } from '@/components/site/PromoCard';
import { Gallery, type GalleryImage } from '@/components/site/Gallery';
import { TestimonialRow, type Testimonial } from '@/components/site/TestimonialRow';
import { Button } from '@/components/ui/button';

export function HomePage() {
  const { data: instructors } = hooks.useInstructors();
  const { data: events } = hooks.useEvents();
  const { data: promos } = hooks.usePromotions();
  const { data: content } = hooks.useSiteContent();

  const upcoming = (events ?? [])
    .filter((e) => new Date(e.startsAt).getTime() >= Date.now())
    .slice(0, 3);
  const promoCards = (promos ?? []).filter((p) => !p.showInTopBar).slice(0, 2);

  const testimonials = block(content, 'home.testimonials', {
    items: [] as Testimonial[],
  }).items;
  const gallery = block(content, 'home.gallery', {
    images: [] as GalleryImage[],
  }).images;

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
  };

  return (
    <div>
      <Seo path="/" jsonLd={[localBusinessLd(), websiteLd]} />

      {/* Hero */}
      <section className="relative flex min-h-[92vh] items-end overflow-hidden">
        <img
          src="/img/hero.jpg"
          alt=""
          className="editorial-img absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep/85 via-deep/30 to-deep/40" />
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 text-deep-fg">
          <motion.p
            className="eyebrow text-deep-fg/70"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.editorial}
          >
            MILE Wellness · Salcedo Village, Makati
          </motion.p>
          <motion.h1
            className="mt-3 max-w-3xl font-display text-5xl font-light leading-[1.05] tracking-tightpx sm:text-6xl md:text-7xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.editorial, delay: 0.08 }}
          >
            A little further every day.
          </motion.h1>
          <motion.div
            className="mt-8 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.editorial, delay: 0.16 }}
          >
            <Button size="lg" asChild>
              <Link to="/schedule">Book a class</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-deep-fg/40 text-deep-fg hover:bg-deep-fg/10"
              asChild
            >
              <Link to="/about">Explore MILE</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Intro statement */}
      <section className="mx-auto max-w-prose px-5 py-20 text-center">
        <Reveal>
          <p className="eyebrow">Move. Inspire. Live. Evolve.</p>
          <p className="mt-4 font-display text-2xl font-light leading-relaxed tracking-tightpx sm:text-3xl">
            A boutique Pilates, barre and movement studio built around small
            groups, precise teaching and a space you want to be in.
          </p>
        </Reveal>
      </section>

      {/* Two-image band */}
      <section className="mx-auto grid max-w-6xl gap-4 px-5 sm:grid-cols-2">
        {[
          { src: '/img/mat.jpg', label: 'Reformer & Mat', copy: 'Strength, control and posture — the method at its core.', to: '/classes' },
          { src: '/img/barre.jpg', label: 'Barre & Movement', copy: 'Ballet-inspired conditioning and specialty sessions.', to: '/classes' },
        ].map((b, i) => (
          <Reveal key={b.label} delay={i * 0.08}>
            <Link
              to={b.to}
              className="group block overflow-hidden rounded-lg border border-line"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={b.src}
                  alt={b.label}
                  className="editorial-img h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
                />
              </div>
              <div className="bg-surface p-5">
                <p className="font-display text-xl">{b.label}</p>
                <p className="mt-1 text-sm text-muted">{b.copy}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>

      {/* Events strip */}
      {upcoming.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeading
            eyebrow="What's happening at MILE"
            title="Events & workshops"
            linkTo="/events"
            linkLabel="All events"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e) => (
              <Reveal key={e.id}>
                <EventCard event={e} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Instructors preview */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <SectionHeading
          eyebrow="Who you'll train with"
          title="Instructors"
          linkTo="/instructors"
          linkLabel="Meet everyone"
        />
        <div className="grid gap-5 sm:grid-cols-3">
          {(instructors ?? []).slice(0, 3).map((ins, i) => (
            <Reveal key={ins.id} delay={i * 0.06}>
              <div className="overflow-hidden rounded-lg border border-line bg-surface">
                <div className="aspect-square overflow-hidden bg-line/40">
                  {ins.photoUrl && (
                    <img
                      src={ins.photoUrl}
                      alt={ins.name}
                      className="editorial-img h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <p className="font-display text-lg">{ins.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{ins.bio}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Promo cards */}
      {promoCards.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="grid gap-5">
            {promoCards.map((p) => (
              <Reveal key={p.id}>
                <PromoCard promo={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <SectionHeading eyebrow="In their words" title="Why members stay" />
            <TestimonialRow items={testimonials} />
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeading
            eyebrow="Around the studio"
            title="A look at MILE"
            linkTo="/the-space"
            linkLabel="See the space"
          />
          <Gallery images={gallery} />
        </section>
      )}

      {/* Location teaser */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <Reveal className="flex flex-col items-start justify-between gap-4 rounded-lg border border-line bg-surface p-8 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow">Find us</p>
            <p className="mt-1 font-display text-2xl tracking-tightpx">
              {SITE.streetAddress}, {SITE.locality}
            </p>
            <p className="mt-1 text-sm text-muted">{SITE.openingHours[0]}</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/location">Directions & hours</Link>
          </Button>
        </Reveal>
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden">
        <img
          src="/img/community.jpg"
          alt=""
          className="editorial-img absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-deep/80" />
        <div className="relative mx-auto max-w-3xl px-5 py-24 text-center text-deep-fg">
          <Reveal>
            <p className="eyebrow text-deep-fg/60">New to MILE?</p>
            <h2 className="mt-3 font-display text-4xl font-light tracking-tightpx">
              Start with three classes for ₱1,800
            </h2>
            <p className="mt-3 text-deep-fg/70">
              The intro offer — enough to find your rhythm.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link to="/pricing">See the intro offer</Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
