import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf-8');

describe('fonts are self-hosted (GDPR)', () => {
  it('no stylesheet or html loads fonts from Google before cookie consent', () => {
    for (const file of ['src/styles/typography.css', 'src/styles/base.css', 'index.html']) {
      expect(read(file), file).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
    }
  });

  it('typography.css declares Inter from local woff2 files that exist', () => {
    const css = read('src/styles/typography.css');
    const urls = [...css.matchAll(/url\(['"]?(\/fonts\/[^'")]+)['"]?\)/g)].map((m) => m[1]);
    expect(urls.length).toBeGreaterThan(0);
    for (const u of urls) {
      expect(existsSync(resolve(root, 'public', u.slice(1))), u).toBe(true);
    }
  });
});
