import type { Page, TestInfo } from '@playwright/test';
import { test, expect, skipCookieBanner, type SeedData } from '../support/fixtures';
import { getData } from '../support/api';
import { scanA11y } from '../support/axe';

/**
 * Public routes x states, audited with axe (WCAG 2.2 AA). Assertion: no critical/serious violations;
 * the full list is attached as JSON. The app ships one (dark) theme: tokens live on :root, theme-light.css
 * is "reserved for future"; "dark" here means prefers-color-scheme: dark + class `dark`, "light" the opposite.
 */

interface Route {
  name: string;
  path: (seed: SeedData, extra: Extra) => string | undefined;
  /** Optional preparation after load (e.g. empty-submit), returns when the state is ready. */
  prepare?: (page: Page) => Promise<void>;
}
interface Extra {
  infoSlug?: string;
}

const first = <T>(a: T[]): T | undefined => a[0];

const ROUTES: Route[] = [
  { name: 'home', path: () => '/' },
  { name: 'events', path: () => '/events' },
  { name: 'event detail (upcoming)', path: (s) => first(s.upcoming) && `/events/${first(s.upcoming)!.slug}` },
  {
    name: 'event detail (past)',
    path: (s) => {
      const e = s.past.find((p) => p.publicationStatus !== 'draft') ?? first(s.past);
      return e && `/events/${e.slug}`;
    },
  },
  {
    name: 'event register (anonymous)',
    path: (s) => {
      const e = first(s.openForRegistration) ?? first(s.upcoming);
      return e && `/events/${e.slug}/register`;
    },
  },
  { name: 'series list', path: () => '/series' },
  { name: 'series detail', path: (s) => first(s.series) && `/series/${first(s.series)!.slug}` },
  { name: 'shop', path: () => '/shop' },
  { name: 'product', path: (s) => first(s.products) && `/shop/${first(s.products)!.slug}` },
  { name: 'cart (empty)', path: () => '/cart' },
  { name: 'challenges', path: () => '/challenges' },
  { name: 'challenge detail', path: (s) => first(s.challenges) && `/challenges/${first(s.challenges)!.slug}` },
  { name: 'live results', path: () => '/wyniki/live' },
  { name: 'login', path: () => '/login' },
  { name: 'register', path: () => '/register' },
  { name: 'forgot password', path: () => '/forgot-password' },
  { name: 'info page', path: (_s, x) => x.infoSlug && `/info/${x.infoSlug}` },
  { name: '404', path: () => '/this-does-not-exist-a11y' },
];

async function settle(page: Page) {
  await expect(page.locator('h1:visible, h2:visible').first()).toBeVisible();
  await page.waitForLoadState('networkidle').catch(() => undefined);
}


/**
 * Confirmed defects (probe via axe on dev, 2026-10-19), keyed by scan label prefix. Every scan carries
 * color-contrast; the others are limited to the listed states. Those scans are expected to fail (test.fail)
 * until the application is fixed; once fixed the test passes unexpectedly and must be un-marked.
 */
const KNOWN: Record<string, RegExp> = {
  'color-contrast': /./,
  'button-name': /^(home|events|event register (anonymous)|series list|shop)-|^(cookie-banner|cookie-settings|mobile-menu)$/,
  'aria-hidden-focus': /^event register (anonymous)-/,
  list: /^event register (anonymous)-/,
  'target-size': /^(login|register)/,
};

async function audit(page: Page, label: string, testInfo: TestInfo) {
  const rules = Object.entries(KNOWN).filter(([, re]) => re.test(label)).map(([id]) => id);
  test.fail(rules.length > 0, `known axe violations (${rules.join(', ')}); see the QA report`);
  await settle(page);
  const { all, blocking } = await scanA11y(page);
  await testInfo.attach(`axe-${label}.json`, { body: JSON.stringify(all, null, 2), contentType: 'application/json' });
  expect(blocking, `critical/serious axe violations on ${label}`).toEqual([]);
}

async function setScheme(page: Page, scheme: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
  await page.addInitScript((sch) => {
    const apply = () => document.documentElement?.classList.toggle('dark', sch === 'dark');
    apply();
    document.addEventListener('DOMContentLoaded', apply);
  }, scheme);
}

let extra: Extra = {};
test.beforeAll(async ({ playwright }) => {
  const request = await playwright.request.newContext();
  const pages = await getData<{ slug: string }[]>(request, '/info-pages').catch(() => []);
  extra = { infoSlug: pages[0]?.slug };
  await request.dispose();
});

test.describe('@a11y axe: public routes', () => {
  for (const scheme of ['light', 'dark'] as const) {
    for (const route of ROUTES) {
      const smoke = route.name === 'home' && scheme === 'light' ? ' @smoke' : '';
      test(`${route.name} [${scheme}]${smoke}`, async ({ page, seed }, testInfo) => {
        const path = route.path(seed, extra);
        test.skip(!path, 'no data for this route');
        await skipCookieBanner(page);
        await setScheme(page, scheme);
        await page.goto(path!);
        await audit(page, `${route.name}-${scheme}`, testInfo);
      });
    }
  }
});

test.describe('@a11y axe: states', () => {
  test('cart with a product', async ({ page, seed }, testInfo) => {
    const product = seed.products[0];
    test.skip(!product, 'no products');
    await skipCookieBanner(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/shop/${product.slug}`);
    await settle(page);
    const add = page.getByRole('button', { name: 'Dodaj do koszyka' });
    test.skip(!(await add.isEnabled().catch(() => false)), 'product cannot be added without options');
    await add.click();
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: 'Koszyk' })).toBeVisible();
    await audit(page, 'cart-with-product', testInfo);
  });

  test('cookie banner visible', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Akceptuj wszystkie/i })).toBeVisible();
    await audit(page, 'cookie-banner', testInfo);
  });

  test('cookie settings expanded', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Dostosuj' }).click();
    await expect(page.getByRole('button', { name: 'Zapisz preferencje' })).toBeVisible();
    await audit(page, 'cookie-settings', testInfo);
  });

  for (const path of ['/login', '/register']) {
    test(`${path} after empty submit (validation errors)`, async ({ page }, testInfo) => {
      await skipCookieBanner(page);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path);
      await expect(page.locator('h1, h2').first()).toBeVisible();
      await page.locator('form button[type="submit"]').first().click();
      await expect(page.locator('[id$="-form-item-message"], [role="alert"]').first()).toBeVisible();
      await audit(page, `${path.slice(1)}-errors`, testInfo);
    });
  }

  test('mobile menu open (375px)', async ({ page }, testInfo) => {
    await skipCookieBanner(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Otwórz menu' }).click();
    await expect(page.getByRole('link', { name: 'Kalendarz wydarzeń' })).toBeVisible();
    await audit(page, 'mobile-menu', testInfo);
  });
});
