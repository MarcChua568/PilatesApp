/**
 * Regenerates public/sitemap.xml from the API before a build.
 * Non-fatal: if the API is unreachable, the committed static sitemap is kept.
 */
import { writeFile } from 'node:fs/promises';

const SITE = 'https://milewellness.ph';
const API = process.env.VITE_API_URL ?? 'http://localhost:3000';

const STATIC = [
  ['/', '1.0'],
  ['/classes', '0.9'],
  ['/schedule', '0.8'],
  ['/instructors', '0.7'],
  ['/events', '0.8'],
  ['/pricing', '0.9'],
  ['/start', '0.7'],
  ['/about', '0.7'],
  ['/the-space', '0.6'],
  ['/location', '0.7'],
  ['/contact', '0.6'],
  ['/shop', '0.4'],
];

async function tryJson(path) {
  try {
    const res = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

const [templates, events, instructors, promos] = await Promise.all([
  tryJson('/class-templates'),
  tryJson('/events'),
  tryJson('/instructors'),
  tryJson('/promotions'),
]);

if (!templates.length && !events.length && !instructors.length) {
  console.log('gen-sitemap: API unreachable, keeping the static sitemap.');
  process.exit(0);
}

const urls = [
  ...STATIC.map(([loc, p]) => ({ loc, priority: p })),
  ...templates
    .filter((t) => t.active)
    .map((t) => ({ loc: `/classes/${t.slug}`, priority: '0.6' })),
  ...events.map((e) => ({ loc: `/events/${e.slug}`, priority: '0.6' })),
  ...instructors.map((i) => ({ loc: `/instructors/${i.id}`, priority: '0.5' })),
  ...promos
    .filter((p) => p.landingSlug)
    .map((p) => ({ loc: `/promo/${p.landingSlug}`, priority: '0.4' })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${SITE}${u.loc}</loc><priority>${u.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>
`;

await writeFile(new URL('../public/sitemap.xml', import.meta.url), xml);
console.log(`gen-sitemap: wrote ${urls.length} URLs.`);
