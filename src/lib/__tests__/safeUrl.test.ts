import { describe, expect, it } from 'vitest';
import { normalizeLinkHref } from '../linkHref';
import { RICH_TEXT_URI_REGEXP, safeUrl } from '../safeUrl';

// Shared corpus: keep identical to zmierzymy_czas_server tests/Unit/Support/UrlPolicyTest.php.
// [input, link result, frame result] (undefined = rejected)
type Row = [string, string | undefined, string | undefined];
const CORPUS: Row[] = [
  ['https://example.com/x', 'https://example.com/x', 'https://example.com/x'],
  ['http://example.com', 'http://example.com', 'http://example.com'],
  ['HTTPS://EXAMPLE.COM', 'HTTPS://EXAMPLE.COM', 'HTTPS://EXAMPLE.COM'],
  ['  https://example.com  ', 'https://example.com', 'https://example.com'],
  ['www.example.pl', 'https://www.example.pl', 'https://www.example.pl'],
  ['example.pl/zapisy?x=1', 'https://example.pl/zapisy?x=1', 'https://example.pl/zapisy?x=1'],
  ['/uploads/event-docs/a.pdf', '/uploads/event-docs/a.pdf', undefined],
  ['#sekcja', '#sekcja', undefined],
  ['?q=1', '?q=1', undefined],
  ['//evil.com/x', undefined, undefined],
  [`/${String.fromCharCode(92)}evil.com`, undefined, undefined],
  ['mailto:biuro@example.pl', 'mailto:biuro@example.pl', undefined],
  ['tel:+48123456789', 'tel:+48123456789', undefined],
  ['javascript:alert(1)', undefined, undefined],
  ['JaVaScRiPt:alert(1)', undefined, undefined],
  [' javascript:alert(1)', undefined, undefined],
  ['java\tscript:alert(1)', undefined, undefined],
  ['java\nscript:alert(1)', undefined, undefined],
  ['\u0000javascript:alert(1)', undefined, undefined],
  ['javascript://example.com/%0Aalert(1)', undefined, undefined],
  ['data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==', undefined, undefined],
  ['vbscript:msgbox(1)', undefined, undefined],
  ['https:evil.com', undefined, undefined],
  ['https://', undefined, undefined],
  ['ftp://example.com', undefined, undefined],
  ['brak', undefined, undefined],
  ['localhost:3000', undefined, undefined],
];

describe('safeUrl shared corpus', () => {
  it.each(CORPUS)('%j', (input, link, frame) => {
    expect(safeUrl(input)).toBe(link);
    expect(safeUrl(input, 'link')).toBe(link);
    expect(safeUrl(input, 'frame')).toBe(frame);
  });

  it.each([[''], [null], [undefined], [['javascript:x']], [42], [{}], [true]])(
    'rejects non-string or empty value %j',
    (input) => {
      expect(safeUrl(input)).toBeUndefined();
      expect(safeUrl(input, 'frame')).toBeUndefined();
    },
  );
});

describe('RICH_TEXT_URI_REGEXP', () => {
  it.each(['https://x', 'mailto:a@b.pl', 'tel:1', '/a'])('accepts %s', (v) => {
    expect(RICH_TEXT_URI_REGEXP.test(v)).toBe(true);
  });
  it.each(['javascript:x', 'data:x', 'vbscript:x'])('rejects %s', (v) => {
    expect(RICH_TEXT_URI_REGEXP.test(v)).toBe(false);
  });
});

describe('cross-consistency with the editor link normaliser (linkHref)', () => {
  // Rows with control characters are excluded: normalizeLinkHref trims them away or treats them differently.
  const attacks = [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    ' javascript:alert(1)',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    'vbscript:msgbox(1)',
    'ftp://example.com',
  ];
  it.each(attacks)('both reject %s', (v) => {
    expect(normalizeLinkHref(v).kind).toBe('rejected');
    expect(safeUrl(v)).toBeUndefined();
  });

  it.each([
    'https://example.com',
    'mailto:a@b.pl',
    'tel:+48123456789',
    '/regulamin.pdf',
    '#a',
    'www.example.pl',
  ])('whatever the editor accepts, safeUrl accepts: %s', (v) => {
    const result = normalizeLinkHref(v);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') expect(safeUrl(result.href)).toBeDefined();
  });
});
