/**
 * Render-side guard for user-supplied URLs in href/src/window.open.
 * Mirrors zmierzymy_czas_server src/Support/UrlPolicy.php — keep the two in sync
 * (same LINK_SCHEMES, same HOST_LIKE, same shared test corpus).
 */
export const LINK_SCHEMES = ['http', 'https', 'mailto', 'tel'] as const;
const FRAME_SCHEMES = ['http', 'https'] as const;

/** DOMPurify ALLOWED_URI_REGEXP for rich text: LINK_SCHEMES or scheme-less (relative) URLs. */
export const RICH_TEXT_URI_REGEXP = new RegExp(
  `^(?:(?:${LINK_SCHEMES.join('|')}):|[^a-z]|[a-z+.-]+(?:[^a-z+.\\-:]|$))`,
  'i',
);

/** Bare host typed without a scheme, e.g. "www.example.pl/zapisy" → normalised to https://. */
export const HOST_LIKE =
  /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?::\d{1,5})?(?:[/?#]\S*)?$/i;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const SAME_ORIGIN_RELATIVE = /^(?:\/(?![/\\])|[#?])/;
const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

export type SafeUrlContext = 'link' | 'frame';

/**
 * Returns a URL that is safe to put in href / window.open ('link') or iframe src ('frame'),
 * or undefined when the value must not be rendered as a link at all.
 * link:  http(s) absolute, mailto:, tel:, same-origin relative (/path, #hash, ?query), bare host → https://
 * frame: http(s) absolute only, bare host → https://
 */
export function safeUrl(value: unknown, context: SafeUrlContext = 'link'): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  if (v === '' || CONTROL_CHARS.test(v)) return undefined;
  if (context === 'link' && SAME_ORIGIN_RELATIVE.test(v)) return v;
  if (HOST_LIKE.test(v)) return `https://${v}`;
  const scheme = SCHEME.exec(v)?.[1].toLowerCase();
  const allowed: readonly string[] = context === 'frame' ? FRAME_SCHEMES : LINK_SCHEMES;
  if (!scheme || !allowed.includes(scheme)) return undefined;
  if (scheme === 'http' || scheme === 'https') {
    if (!/^https?:\/\//i.test(v)) return undefined;
    try {
      if (!new URL(v).hostname) return undefined;
    } catch {
      return undefined;
    }
  }
  return v;
}
