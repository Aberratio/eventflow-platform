import type { Response } from '@playwright/test';
import { test, expect, skipCookieBanner } from '../support/fixtures';
import { API, FRONT } from '../support/env';

const MB = 1024 * 1024;
const ALLOWED_HOSTS = new Set([new URL(FRONT).host, new URL(API).host]);
const HASHED = /-[A-Za-z0-9_-]{6,}\.(js|css)(\?|$)/;

interface Asset {
  url: string;
  host: string;
  type: string;
  status: number;
  bytes: number;
  cacheControl: string;
  encoding: string;
}

interface ImageInfo {
  src: string;
  loading: string | null;
  natural: number;
  rendered: number;
  belowFold: boolean;
}

/** Visits one page, records every response and the images on it. Sizes are the wire sizes (content-length). */
async function measure(page: import('@playwright/test').Page, path: string) {
  const responses: Response[] = [];
  page.on('response', (r) => responses.push(r));
  await skipCookieBanner(page);
  await page.goto(path);
  await page.waitForLoadState('networkidle');

  const assets: Asset[] = await Promise.all(
    responses.map(async (r) => {
      const h = r.headers();
      let bytes = Number(h['content-length'] ?? NaN);
      if (Number.isNaN(bytes)) bytes = (await r.body().catch(() => Buffer.alloc(0))).length;
      return {
        url: r.url(),
        host: new URL(r.url()).host,
        type: r.request().resourceType(),
        status: r.status(),
        bytes,
        cacheControl: h['cache-control'] ?? '',
        encoding: h['content-encoding'] ?? '',
      };
    }),
  );

  const images = await page.evaluate<ImageInfo[]>(() =>
    [...document.images].map((img) => {
      const r = img.getBoundingClientRect();
      return {
        src: img.currentSrc || img.src,
        loading: img.getAttribute('loading'),
        natural: img.naturalWidth,
        rendered: r.width,
        belowFold: r.top > window.innerHeight,
      };
    }),
  );

  const sum = (type: string) => assets.filter((a) => a.type === type).reduce((s, a) => s + a.bytes, 0);
  const js = assets.filter((a) => a.type === 'script');
  const largestJs = js.reduce<Asset | undefined>((max, a) => (!max || a.bytes > max.bytes ? a : max), undefined);
  return {
    path,
    requests: assets.length,
    bytes: { js: sum('script'), css: sum('stylesheet'), img: sum('image'), font: sum('font') },
    largestJs: largestJs ? { url: largestJs.url, bytes: largestJs.bytes } : null,
    assets,
    images,
  };
}

test.describe('assets and performance budget @perf', () => {
  const pages: { label: string; path: (seed: { upcoming: { slug: string }[] }) => string | null; budgetJs: boolean }[] = [
    { label: 'home', path: () => '/', budgetJs: true },
    { label: 'events list', path: () => '/events', budgetJs: false },
    { label: 'event detail', path: (s) => (s.upcoming[0] ? `/events/${s.upcoming[0].slug}` : null), budgetJs: false },
    { label: 'shop', path: () => '/shop', budgetJs: false },
  ];

  for (const p of pages) {
    test(`${p.label}: requests, transfer, hosts, image and cache rules`, async ({ page, seed }, testInfo) => {
      const path = p.path(seed);
      test.skip(path === null, 'brak nadchodzącego wydarzenia w API');
      const m = await measure(page, path!);

      await testInfo.attach(`assets-${p.label.replace(/\s+/g, '-')}.json`, {
        body: Buffer.from(JSON.stringify(m, null, 2)),
        contentType: 'application/json',
      });
      testInfo.annotations.push({
        type: 'perf',
        description: `${path}: requests=${m.requests} js=${m.bytes.js}B css=${m.bytes.css}B img=${m.bytes.img}B font=${m.bytes.font}B largestJs=${m.largestJs?.bytes ?? 0}B`,
      });

      // Hard fails: foreign hosts, oversized images, initial JS budget on "/".
      const foreign = m.assets.filter((a) => !ALLOWED_HOSTS.has(a.host)).map((a) => a.url);
      expect(foreign, `${path}: requests to hosts outside front/API/Google Fonts`).toEqual([]);

      const bigImages = m.assets.filter((a) => a.type === 'image' && a.bytes > MB).map((a) => `${a.url} (${a.bytes}B)`);
      expect(bigImages, `${path}: images over 1 MB`).toEqual([]);

      if (p.budgetJs) {
        expect(m.bytes.js, `${path}: initial JS (compressed) must stay under 1 MB`).toBeLessThanOrEqual(MB);
      }

      // Hashed JS/CSS from the front: long-lived cache and compression (tiny files exempt).
      const hashedFront = m.assets.filter((a) => (a.type === 'script' || a.type === 'stylesheet') && a.host === new URL(FRONT).host && HASHED.test(a.url));
      const cacheProblems = hashedFront
        .filter((a) => !(a.cacheControl.includes('immutable') || Number(/max-age=(\d+)/.exec(a.cacheControl)?.[1] ?? 0) >= 31536000))
        .map((a) => `${a.url} Cache-Control="${a.cacheControl}"`);
      expect(cacheProblems, `${path}: hashed assets need max-age >= 1 year or immutable`).toEqual([]);
      const encodingProblems = hashedFront
        .filter((a) => a.bytes >= 1024 && !/br|gzip/.test(a.encoding))
        .map((a) => `${a.url} content-encoding="${a.encoding}"`);
      expect(encodingProblems, `${path}: hashed JS/CSS must be br or gzip compressed`).toEqual([]);

      // Measurement only (annotations, not failures): lazy loading, formats, oversized images.
      const belowFoldEager = m.images.filter((i) => i.belowFold && i.loading !== 'lazy').map((i) => i.src);
      const oversized = m.images.filter((i) => i.rendered > 0 && i.natural > 2 * i.rendered).map((i) => `${i.src} natural=${i.natural} rendered=${Math.round(i.rendered)}`);
      const modern = m.images.filter((i) => /\.(webp|avif)(\?|$)/i.test(i.src)).length;
      const legacy = m.images.filter((i) => /\.(jpe?g|png)(\?|$)/i.test(i.src)).length;
      testInfo.annotations.push({
        type: 'perf-images',
        description: `${path}: images=${m.images.length} webp/avif=${modern} jpg/png=${legacy} belowFoldWithoutLazy=${belowFoldEager.length} oversized(>2x)=${oversized.length}`,
      });
      if (oversized.length) testInfo.annotations.push({ type: 'perf-oversized', description: oversized.join(' | ') });
      if (belowFoldEager.length) testInfo.annotations.push({ type: 'perf-eager', description: belowFoldEager.join(' | ') });
    });
  }
});
