import DOMPurify, { type Config } from 'dompurify';
import { RICH_TEXT_URI_REGEXP } from './safeUrl';

// Keep in sync with zmierzymy_czas_server src/Support/HtmlSanitizer.php (HtmlSanitizer::ALLOWED; schemes: safeUrl.ts LINK_SCHEMES).
// Mirrors the TipTap schema in src/components/ui/rich-text-editor.tsx.
export const RICH_TEXT_ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'a',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'hr',
];
export const RICH_TEXT_ALLOWED_ATTR = ['href', 'target', 'rel', 'start'];

const ALLOWED_REL = ['noopener', 'noreferrer', 'nofollow'];

const CONFIG: Config = {
  ALLOWED_TAGS: RICH_TEXT_ALLOWED_TAGS,
  ALLOWED_ATTR: RICH_TEXT_ALLOWED_ATTR,
  ALLOWED_URI_REGEXP: RICH_TEXT_URI_REGEXP,
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
};

type Purifier = ReturnType<typeof DOMPurify>;
let purifier: Purifier | null = null;

// Dedicated instance so the hook never leaks into any other DOMPurify user.
const getPurifier = (): Purifier => {
  if (purifier) return purifier;
  const instance = DOMPurify(window);
  instance.addHook('afterSanitizeAttributes', (node) => {
    if (node.nodeName !== 'A') return;
    const el = node as Element;
    if (el.hasAttribute('target') && el.getAttribute('target') !== '_blank') {
      el.removeAttribute('target');
    }
    const tokens = new Set(
      (el.getAttribute('rel') ?? '')
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => ALLOWED_REL.includes(t)),
    );
    if (el.getAttribute('target') === '_blank') {
      tokens.add('noopener');
      tokens.add('noreferrer');
    }
    if (tokens.size > 0) {
      el.setAttribute('rel', [...tokens].join(' '));
    } else {
      el.removeAttribute('rel');
    }
  });
  purifier = instance;
  return instance;
};

/** Sanitizes organizer/admin rich text (TipTap output) for rendering via dangerouslySetInnerHTML. */
export const sanitizeHtml = (html: string | null | undefined): string => {
  if (!html) return '';
  if (typeof window === 'undefined') return ''; // fail closed outside a DOM
  return getPurifier().sanitize(html, CONFIG) as string;
};

/** Escapes a value for interpolation into an HTML string (text or quoted attribute context). */
export const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
