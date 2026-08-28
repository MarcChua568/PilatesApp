import { hooks } from '@/lib/api';
import { block } from '@/lib/content';
import { Seo } from '@/components/site/Seo';
import { Reveal } from '@/components/site/Reveal';
import { SectionHeading } from '@/components/site/SectionHeading';
import { Gallery, type GalleryImage } from '@/components/site/Gallery';

export function TheSpacePage() {
  const { data: content } = hooks.useSiteContent();

  const hero = block(content, 'space.hero', {
    heading: 'The MILE space',
    body: 'Two studios, a café and a lounge in Salcedo Village, Makati.',
    imageUrl: '/img/studio.jpg',
  });
  const stats = block(content, 'space.stats', {
    items: [] as { label: string; value: string }[],
  });
  const gallery = block(content, 'space.gallery', {
    images: [] as GalleryImage[],
  });
  const cafe = block(content, 'cafe.block', {
    heading: 'Come for the movement. Stay for the matcha.',
    body: 'The MILE café does specialty coffee, matcha and a short, good menu.',
    imageUrl: '/img/breathe.jpg',
  });

  return (
    <div>
      <Seo
        title="The Space"
        description={hero.body}
        path="/the-space"
        image={hero.imageUrl}
      />

      <section className="relative flex min-h-[70vh] items-end overflow-hidden">
        <img
          src={hero.imageUrl}
          alt=""
          className="editorial-img absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep/80 to-deep/10" />
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-14 text-deep-fg">
          <Reveal>
            <p className="eyebrow text-deep-fg/70">The space</p>
            <h1 className="mt-2 max-w-2xl font-display text-4xl font-light tracking-tightpx sm:text-6xl">
              {hero.heading}
            </h1>
            <p className="mt-4 max-w-xl text-deep-fg/80">{hero.body}</p>
          </Reveal>
        </div>
      </section>

      {stats.items.length > 0 && (
        <section className="border-b border-line bg-surface">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-10 sm:grid-cols-4">
            {stats.items.map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl font-light tracking-tightpx">
                  {s.value}
                </p>
                <p className="mt-1 text-xs uppercase tracking-eyebrow text-muted">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {gallery.images.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-16">
          <SectionHeading
            eyebrow="A look around"
            title="Designed to be somewhere you want to be"
          />
          <Gallery images={gallery.images} />
        </section>
      )}

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 md:items-center">
        <Reveal>
          <div className="aspect-[4/3] overflow-hidden rounded-lg border border-line">
            <img
              src={cafe.imageUrl}
              alt=""
              className="editorial-img h-full w-full object-cover"
            />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="eyebrow">The MILE café</p>
          <h2 className="mt-2 font-display text-3xl font-light tracking-tightpx">
            {cafe.heading}
          </h2>
          <p className="mt-4 text-muted">{cafe.body}</p>
        </Reveal>
      </section>
    </div>
  );
}
