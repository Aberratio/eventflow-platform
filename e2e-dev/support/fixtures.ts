import { test as base, expect, type Page } from '@playwright/test';
import { getData } from './api';
import { API, today } from './env';

export interface EventSummary {
  id: string;
  slug: string;
  name: string;
  date: string;
  city?: string;
  discipline?: string;
  publicationStatus?: string;
  registrationStatus?: string;
  visibility?: string;
  isPrivate?: boolean;
  isVirtual?: boolean;
  seriesId?: string | null;
  [key: string]: unknown;
}

export interface Slugged {
  id: string;
  slug: string;
  name?: string;
  [key: string]: unknown;
}

/** Public catalogue read once per worker, so specs pick real slugs without hammering the throttled host. */
export interface SeedData {
  events: EventSummary[];
  series: Slugged[];
  products: Slugged[];
  challenges: Slugged[];
  upcoming: EventSummary[];
  past: EventSummary[];
  openForRegistration: EventSummary[];
}

/** Collects uncaught page errors and API 5xx; the test fails at the end if any were seen. */
export interface Problems {
  list: string[];
  /** Ignore problems whose text matches (for tests that provoke errors on purpose). */
  allow(pattern: RegExp): void;
}

interface TestFixtures {
  problems: Problems;
}
interface WorkerFixtures {
  seed: SeedData;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  seed: [
    async ({ playwright }, use) => {
      const request = await playwright.request.newContext();
      const [events, series, products, challenges] = await Promise.all([
        getData<EventSummary[]>(request, '/events', { params: { pageSize: 200 } }),
        getData<Slugged[]>(request, '/series'),
        getData<Slugged[]>(request, '/shop/products'),
        getData<Slugged[]>(request, '/challenges'),
      ]);
      await request.dispose();
      const t = today();
      await use({
        events,
        series,
        products,
        challenges,
        upcoming: events.filter((e) => (e.date ?? '') >= t),
        past: events.filter((e) => (e.date ?? '9999') < t),
        openForRegistration: events.filter(
          (e) => e.registrationStatus === 'open' && (e.date ?? '') >= t,
        ),
      });
    },
    { scope: 'worker' },
  ],

  problems: [
    async ({ page }, use) => {
      const list: string[] = [];
      const allowed: RegExp[] = [];
      page.on('pageerror', (e) => list.push(`page error: ${e.message}`));
      page.on('response', (r) => {
        if (!r.url().startsWith(API)) return;
        if (r.status() >= 500) list.push(`API ${r.status()}: ${r.request().method()} ${r.url()}`);
        if (r.status() === 429)
          list.push(`DEV_THROTTLED: 429 on ${r.request().method()} ${r.url()}`);
      });
      await use({ list, allow: (p) => allowed.push(p) });
      const real = list.filter((p) => !allowed.some((a) => a.test(p)));
      expect(real, 'uncaught page errors / API 5xx during the test').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Dismisses the cookie banner if it is shown (it is not on every visit). */
export async function acceptCookies(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: /Akceptuj wszystkie/i });
  if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) await btn.click();
}

/** Pre-accepts cookies via storage so the banner never covers the page (for tests not about the banner). */
export async function skipCookieBanner(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      // CookiePreferences in src/components/CookieConsent.tsx; the banner shows only when the key is absent.
      localStorage.setItem(
        'cookie-consent',
        JSON.stringify({
          necessary: true,
          analytics: false,
          marketing: false,
          functional: true,
          timestamp: new Date().toISOString(),
        }),
      );
    } catch {
      /* storage blocked */
    }
  });
}
