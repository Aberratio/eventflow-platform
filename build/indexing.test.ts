import { describe, expect, it } from 'vitest';
import {
  applyIndexingToHtml,
  BLOCK_ALL_ROBOTS_TXT,
  isIndexingAllowed,
  resolveRobotsTxt,
} from './indexing';

const html = '<html><head><title>x</title></head><body></body></html>';

describe('indexing (D-09)', () => {
  it('is blocked unless VITE_ALLOW_INDEXING is exactly "true"', () => {
    expect(isIndexingAllowed(undefined)).toBe(false);
    expect(isIndexingAllowed('')).toBe(false);
    expect(isIndexingAllowed('false')).toBe(false);
    expect(isIndexingAllowed('1')).toBe(false);
    expect(isIndexingAllowed('true')).toBe(true);
  });

  it('adds noindex meta when blocked, once, and leaves html alone when allowed', () => {
    const blocked = applyIndexingToHtml(html, false);
    expect(blocked).toMatch(/<meta name="robots" content="noindex/);
    expect(applyIndexingToHtml(blocked, false)).toBe(blocked);
    expect(applyIndexingToHtml(html, true)).toBe(html);
  });

  it('serves Disallow: / when blocked and the public robots.txt when allowed', () => {
    expect(resolveRobotsTxt(false, 'User-agent: *\nAllow: /\n')).toBe(BLOCK_ALL_ROBOTS_TXT);
    expect(BLOCK_ALL_ROBOTS_TXT).toMatch(/^Disallow:\s*\/$/m);
    expect(resolveRobotsTxt(true, 'User-agent: *\nAllow: /\n')).toBe('User-agent: *\nAllow: /\n');
  });
});
