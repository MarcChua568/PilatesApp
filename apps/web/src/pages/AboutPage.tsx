import { Link } from 'react-router-dom';
import { hooks } from '@/lib/api';
import { block } from '@/lib/content';
import { Seo } from '@/components/site/Seo';
import { Reveal } from '@/components/site/Reveal';
import { SectionHeading } from '@/components/site/SectionHeading';
import { Button } from '@/components/ui/button';

export function AboutPage() {
  const { data: content } = hooks.useSiteContent();

  const heroBlk = block(content, 'about.hero', {
    eyebrow: 'About MILE',
    heading: 'A little further every day.',
    body: 'MILE is a boutique movement and wellness studio in Salcedo Village, Makati.',
    imageUrl: '/img/studio.jpg',
  });
  const philosophy = block(content, 'about.philosophy', {
    heading: 'Move. Inspire. Live. Evolve.',
    paragraphs: [] as string[],
  });
  const values = block(content, 'about.values', {
    items: [] as { title: string; body: string }[],
  });

  return (
    <div>
      <Seo
        title="About"
        description={heroBlk.body}
        path="/about"
        image={heroBlk.imageUrl}
      />

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 md:items-center">
        <Reveal>
          <p className="eyebrow">{heroBlk.eyebrow}</p>
          <h1 className="mt-2 font-display text-4xl font-light leading-[1.1] tracking-tightpx sm:text-5xl">
            {heroBlk.heading}
          </h1>
          <p className="mt-4 text-muted">{heroBlk.body}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="aspect-[4/3] overflow-hidden rounded-lg border border-line">
            <img
              src={heroBlk.imageUrl}
              alt=""
              className="editorial-img h-full w-full object-cover"
            />
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <Reveal>
          <p className="eyebrow">Our philosophy</p>
          <h2 className="mt-2 font-display text-3xl font-light tracking-tightpx">
            {philosophy.heading}
          </h2>
          <div className="mt-5 space-y-4 text-muted">
            {philosophy.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Reveal>
      </section>

      {values.items.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-16">
          <SectionHeading eyebrow="What we hold to" title="How MILE works" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.items.map((v, i) => (
              <Reveal key={v.title} delay={(i % 4) * 0.05}>
                <div className="h-full rounded-lg border border-line bg-surface p-5">
                  <p className="font-display text-lg">{v.title}</p>
                  <p className="mt-2 text-sm text-muted">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <Reveal>
          <h2 className="font-display text-3xl font-light tracking-tightpx">
            Come see for yourself
          </h2>
          <p className="mt-3 text-muted">
            The intro offer is three classes in your first month.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/pricing">See pricing</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/schedule">Browse the timetable</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
