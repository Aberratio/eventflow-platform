/**
 * Normalizes user-entered link URLs from the rich text editor's link dialog.
 *
 * Kept in sync with SAFE_URI in src/lib/sanitizeHtml.ts (http(s)/mailto/tel/relative):
 * whatever this function accepts is exactly what RichTextDisplay keeps after sanitization.
 */
export type LinkHrefResult =
  | { kind: 'empty' }
  | { kind: 'ok'; href: string }
  | { kind: 'rejected' };

const ALLOWED_SCHEME = /^(?:https?:\/\/|mailto:|tel:)/i;
// "localhost:3000" is host:port, not a scheme (a scheme is never followed by a digit).
const EXPLICIT_SCHEME = /^[a-z][a-z0-9+-]*:(?!\d)/i;
const RELATIVE = /^[/#?]/;
const EMAIL = /^[^\s@/:]+@[^\s@/:]+\.[^\s@/:]+$/;
const PHONE = /^\+?[\d\s()-]{6,}$/;

export function normalizeLinkHref(input: string): LinkHrefResult {
  const value = input.trim();
  if (value === '') return { kind: 'empty' };
  if (ALLOWED_SCHEME.test(value)) return { kind: 'ok', href: value };
  if (RELATIVE.test(value) && !value.startsWith('//')) return { kind: 'ok', href: value };
  if (EXPLICIT_SCHEME.test(value)) return { kind: 'rejected' }; // javascript:, data:, vbscript:, ftp:, …
  if (EMAIL.test(value)) return { kind: 'ok', href: `mailto:${value}` };
  if (PHONE.test(value)) return { kind: 'ok', href: `tel:${value.replace(/[\s()-]/g, '')}` };
  return { kind: 'ok', href: `https://${value.replace(/^\/\//, '')}` };
}
