import { hooks } from '@/lib/api';
import { block } from '@/lib/content';
import { Seo } from '@/components/site/Seo';
import { Reveal } from '@/components/site/Reveal';
import { SITE, localBusinessLd } from '@/lib/seo';

export function LocationPage() {
  const { data: content } = hooks.useSiteContent();
  const getting = block(content, 'location.gettingHere', {
    heading: 'Getting to MILE',
    body: 'We are on the ground floor in Salcedo Village, Makati.',
    landmarks: [] as string[],
  });

  const { lat, lng } = SITE.geo;
  const d = 0.004;
  const bbox = `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <Seo
        title="Location & hours"
        description={`Find ${SITE.name} in Salcedo Village, Makati. Opening hours, parking and directions.`}
        path="/location"
        jsonLd={localBusinessLd()}
      />

      <Reveal>
        <p className="eyebrow">Visit</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tightpx sm:text-5xl">
          Find us in Salcedo Village
        </h1>
      </Reveal>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <Reveal>
          <div className="overflow-hidden rounded-lg border border-line">
            <iframe
              title="Map to MILE Wellness"
              src={mapSrc}
              className="h-[360px] w-full"
              loading="lazy"
            />
          </div>
          <a
            href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            Open in maps →
          </a>
        </Reveal>

        <Reveal delay={0.08} className="space-y-8">
          <div>
            <p className="eyebrow">Address</p>
            <p className="mt-2 text-lg">
              {SITE.streetAddress}
              <br />
              {SITE.locality}, {SITE.region} {SITE.postalCode}
            </p>
            <p className="mt-2 text-sm text-muted">
              {SITE.phone} · {SITE.email}
            </p>
          </div>

          <div>
            <p className="eyebrow">Hours</p>
            <ul className="mt-2 space-y-1 text-sm">
              {SITE.openingHours.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow">{getting.heading}</p>
            <p className="mt-2 text-sm text-muted">{getting.body}</p>
            {getting.landmarks.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {getting.landmarks.map((l) => (
                  <li key={l}>· {l}</li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
