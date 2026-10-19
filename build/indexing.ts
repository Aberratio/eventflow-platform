/**
 * D-09 / PP.28 / QA-SEO-02: only the production build may be indexed. Every other
 * environment (dev, staging, previews, a local build) is blocked by default, so a new
 * environment can never leak into search results by forgetting a setting.
 *
 * Build-time switch: `VITE_ALLOW_INDEXING=true` (set only for the production build).
 */
export function isIndexingAllowed(value: string | undefined): boolean {
  return (value ?? '').trim().toLowerCase() === 'true';
}

/** robots.txt for a non-indexable environment. */
export const BLOCK_ALL_ROBOTS_TXT = 'User-agent: *\nDisallow: /\n';

export const NOINDEX_META = '<meta name="robots" content="noindex, nofollow" />';

/** Adds the noindex meta before </head> (idempotent); returns html unchanged when indexing is allowed. */
export function applyIndexingToHtml(html: string, allowIndexing: boolean): string {
  if (allowIndexing || /<meta[^>]+name=["']robots["']/i.test(html)) return html;
  return html.replace(/<\/head>/i, `    ${NOINDEX_META}\n  </head>`);
}

/** robots.txt body: the checked-in public/robots.txt in production, block-all everywhere else. */
export function resolveRobotsTxt(allowIndexing: boolean, publicRobotsTxt: string): string {
  return allowIndexing ? publicRobotsTxt : BLOCK_ALL_ROBOTS_TXT;
}
