/**
 * Studio constants used for page metadata and JSON-LD structured data.
 * TODO: swap the address, geo and socials for the real MILE details before launch.
 */
export const SITE = {
  name: 'MILE Wellness',
  shortName: 'MILE',
  url: 'https://milewellness.ph',
  description:
    'MILE is a boutique Pilates, barre and movement studio in Salcedo Village, Makati. Small-group reformer, mat and barre classes, taught well.',
  tagline: 'Move. Inspire. Live. Evolve.',
  streetAddress: 'Ground Floor, Salcedo Village',
  locality: 'Makati',
  region: 'Metro Manila',
  postalCode: '1227',
  country: 'PH',
  geo: { lat: 14.5586, lng: 121.0231 },
  phone: '+63 2 8555 6453',
  email: 'hello@milewellness.ph',
  openingHours: [
    'Mon–Fri 6:30am – 8:30pm',
    'Sat 7:00am – 2:00pm',
    'Sun 8:00am – 1:00pm',
  ],
  sameAs: [
    'https://www.instagram.com/milewellness',
    'https://www.tiktok.com/@milewellness',
    'https://www.facebook.com/milewellness',
  ],
} as const;

export const socialLinks = [
  { label: 'Instagram', href: SITE.sameAs[0] },
  { label: 'TikTok', href: SITE.sameAs[1] },
  { label: 'Facebook', href: SITE.sameAs[2] },
];

/** LocalBusiness JSON-LD, reused on the home and location pages. */
export function localBusinessLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    telephone: SITE.phone,
    email: SITE.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.streetAddress,
      addressLocality: SITE.locality,
      addressRegion: SITE.region,
      postalCode: SITE.postalCode,
      addressCountry: SITE.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE.geo.lat,
      longitude: SITE.geo.lng,
    },
    openingHours: SITE.openingHours,
    sameAs: SITE.sameAs,
  };
}
