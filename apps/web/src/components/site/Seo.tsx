import { Helmet } from 'react-helmet-async';
import { SITE } from '@/lib/seo';

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  jsonLd?: object | object[];
}

/**
 * Per-route <head> tags: title, description, OpenGraph/Twitter, canonical, and
 * optional JSON-LD. Client-rendered — enough for sharing previews and for
 * crawlers that execute JS; full SSR is a later step.
 */
export function Seo({
  title,
  description = SITE.description,
  image,
  path = '',
  type = 'website',
  noindex = false,
  jsonLd,
}: SeoProps) {
  const fullTitle = title ? `${title} · ${SITE.name}` : `${SITE.name} — Pilates, Barre & Movement in Makati`;
  const canonical = `${SITE.url}${path}`;
  const ogImage = image ?? `${SITE.url}/img/hero.jpg`;
  const blocks = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex" />}
      <link rel="canonical" href={canonical} />

      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
}
