import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { transitions } from '@pilates/ui';
import { hooks } from '@/lib/api';
import { Reveal } from '@/components/site/Reveal';
import { Button } from '@/components/ui/button';

export function HomePage() {
  const { data: instructors } = hooks.useInstructors();

  return (
    <div>
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
            MILE Wellness · Salcedo, Makati
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
              <Link to="/classes">Book a class</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-deep-fg/40 text-deep-fg hover:bg-deep-fg/10"
              asChild
            >
              <Link to="/pricing">Explore MILE</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Intro statement */}
      <section className="mx-auto max-w-prose px-5 py-24 text-center">
        <Reveal>
          <p className="eyebrow">What is MILE</p>
          <p className="mt-4 font-display text-2xl font-light leading-relaxed tracking-tightpx sm:text-3xl">
            A boutique wellness and movement studio built around the idea that
            wellness should be part of your everyday life — movement, community
            and mindful experiences in one beautiful space.
          </p>
        </Reveal>
      </section>

      {/* Two-image band */}
      <section className="mx-auto grid max-w-6xl gap-4 px-5 sm:grid-cols-2">
        {[
          { src: '/img/mat.jpg', label: 'Mat Pilates', copy: 'Strength, control, posture and mindful movement.' },
          { src: '/img/barre.jpg', label: 'Barre & Movement', copy: 'Ballet-inspired work, dance and specialty sessions.' },
        ].map((b, i) => (
          <Reveal key={b.label} delay={i * 0.08}>
            <div className="group overflow-hidden rounded-lg border border-line">
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
            </div>
          </Reveal>
        ))}
      </section>

      {/* Instructors preview */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <Reveal className="mb-8 flex items-end justify-between">
          <div>
            <p className="eyebrow">Who you'll train with</p>
            <h2 className="mt-2 font-display text-3xl font-light tracking-tightpx">
              Instructors
            </h2>
          </div>
          <Link to="/instructors" className="text-sm text-primary hover:underline">
            Meet everyone →
          </Link>
        </Reveal>
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
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {ins.bio}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
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
              Not sure where to start?
            </h2>
            <p className="mt-3 text-deep-fg/70">
              Try the intro offer — two weeks of classes to find your rhythm.
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
