import type { SiteContent } from '@pilates/api-client';

/**
 * Read one site-content block, falling back to a hard-coded default when the
 * key is absent or the studio has not filled it in yet. Keeps every marketing
 * page renderable before anyone touches the CMS.
 */
export function block<T extends Record<string, unknown>>(
  content: SiteContent | undefined,
  key: string,
  fallback: T,
): T {
  const data = content?.[key];
  if (!data || typeof data !== 'object') return fallback;
  return { ...fallback, ...(data as T) };
}
