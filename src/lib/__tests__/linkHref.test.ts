import { describe, expect, it } from 'vitest';
import { normalizeLinkHref } from '../linkHref';

describe('normalizeLinkHref', () => {
  it.each([
    ['biuro@a.pl', 'mailto:biuro@a.pl'],
    ['mailto:x@a.pl', 'mailto:x@a.pl'],
    ['tel:+48123456789', 'tel:+48123456789'],
    ['/regulamin', '/regulamin'],
    ['www.a.pl', 'https://www.a.pl'],
    ['HTTP://a.pl/x', 'HTTP://a.pl/x'],
    ['  a.pl  ', 'https://a.pl'],
    ['#trasa', '#trasa'],
    ['a.pl/path?x=1', 'https://a.pl/path?x=1'],
    ['localhost:3000/x', 'https://localhost:3000/x'],
    ['//cdn.a.pl/f.pdf', 'https://cdn.a.pl/f.pdf'],
    ['+48 123 456 789', 'tel:+48123456789'],
    ['httpfoo.pl', 'https://httpfoo.pl'],
  ])('normalizes %s to %s', (input, expected) => {
    const result = normalizeLinkHref(input);
    expect(result).toEqual({ kind: 'ok', href: expected });
  });

  it.each(['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,x', 'vbscript:x', 'ftp://a.pl'])(
    'rejects dangerous/unknown scheme %s',
    (input) => {
      expect(normalizeLinkHref(input)).toEqual({ kind: 'rejected' });
    },
  );

  it.each(['', '   '])('treats blank input %j as empty', (input) => {
    expect(normalizeLinkHref(input)).toEqual({ kind: 'empty' });
  });
});
