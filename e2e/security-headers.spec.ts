import { test, expect, type Page } from '@playwright/test';
import { dismissCookies, loginAs } from './helpers';

/**
 * PP.9: verifies the generated `dist/.htaccess` security headers when served
 * by a real Apache (lane-D, port 5304 locally). Opt-in via
 * SECURITY_HEADERS_BASE_URL so the default suite and @smoke are unaffected —
 * dev/CI runs of `npx playwright test` never talk to a static Apache build.
 *
 * Run with: PLAYWRIGHT_BASE_URL=http://localhost:5304 SECURITY_HEADERS_BASE_URL=http://localhost:5304
 * npx playwright test e2e/security-headers.spec.ts
 * (PLAYWRIGHT_BASE_URL is also required, otherwise playwright.config.ts tries to boot its dev stack.)
 *
 * Run it against BOTH a development build and a STAGING-mode build
 * (`VITE_API_URL=https://... npm run build:staging`). HSTS is emitted only in
 * staging/production builds, so serving only the dev build cannot catch an
 * .htaccess line that Apache rejects (that once returned 500 on every path).
 */
// Top-level: `launchOptions` in `test.use` forces a new worker and Playwright
// refuses that inside a nested `test.describe`, so both the skip guard and the
// launch args live at file scope instead of inside the '@headers' group below.
test.skip(!process.env.SECURITY_HEADERS_BASE_URL, 'SECURITY_HEADERS_BASE_URL is not set');
test.use({
  baseURL: process.env.SECURITY_HEADERS_BASE_URL,
  // The AC9 framing tests navigate a synthetic http://parent.test page (fulfilled via
  // page.route, never resolved by real DNS) into an iframe pointed at localhost. Chrome's
  // Local Network Access check treats the synthetic top-level page's address space as
  // unknown/public and blocks that local-address iframe target, independent of our CSP
  // frame-ancestors — a test-harness artifact, not a product behaviour. Disabled only for
  // this spec's browser instance so it never weakens a real page's network-access checks.
  launchOptions: { args: ['--disable-features=LocalNetworkAccessChecks'] },
});

test.describe('@headers security headers (served by Apache)', () => {
  test.describe('AC7: response headers per path', () => {
    test('normal pages get frame-ancestors self, X-Frame-Options SAMEORIGIN and nosniff', async ({
      request,
      baseURL,
    }) => {
      for (const path of ['/', '/events', '/logowanie']) {
        const response = await request.get(`${baseURL}${path}`);
        expect(response.status(), path).toBe(200);
        expect(response.headers()['content-security-policy'], path).toContain(
          "frame-ancestors 'self'",
        );
        expect(response.headers()['x-frame-options'], path).toBe('SAMEORIGIN');
        expect(response.headers()['x-content-type-options'], path).toBe('nosniff');
      }
    });

    test('a deep event URL returns 200 with the same headers', async ({ request, baseURL }) => {
      const slug = await discoverSeededEventSlug();
      const response = await request.get(`${baseURL}/events/${slug}`);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-security-policy']).toContain("frame-ancestors 'self'");
      expect(response.headers()['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers()['x-content-type-options']).toBe('nosniff');
    });

    test('embed routes return 200 with frame-ancestors * and no X-Frame-Options', async ({
      request,
      baseURL,
    }) => {
      const eventId = await discoverSeededEventId();
      for (const path of [`/embed/event/${eventId}/register`, `/events/${eventId}/embed`]) {
        const response = await request.get(`${baseURL}${path}`);
        expect(response.status(), path).toBe(200);
        expect(response.headers()['content-security-policy'], path).toContain('frame-ancestors *');
        expect(response.headers()['x-frame-options'], path).toBeUndefined();
      }
    });

    test('a missing hashed asset 404s', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/assets/does-not-exist-12345678.js`);
      expect(response.status()).toBe(404);
    });

    test('/api paths are not rewritten to index.html', async ({ request, baseURL }) => {
      // No /api directory exists in the SPA docroot, so Apache must answer 404 itself
      // instead of handing the request to the SPA fallback (200 + app shell).
      const response = await request.get(`${baseURL}/api/x`, { maxRedirects: 0 });
      expect(response.status()).toBe(404);
      expect(await response.text()).not.toContain('<div id="root">');
    });
  });

  test.describe('AC8: zero CSP violations on key pages', () => {
    test('home, events, event details, admin login, dashboard, and a dialog', async ({ page }) => {
      await installCspViolationListener(page);

      await page.goto('/');
      await dismissCookies(page);
      await expectNoViolations(page);

      await page.goto('/events');
      await expectNoViolations(page);

      // A direct goto (rather than .click()) sidesteps actionability flakiness from
      // hover/skeleton animations on the list row; this test only cares that the
      // event details document itself is CSP-clean, not about the click interaction.
      const eventHref = await page.locator('a[href^="/events/"]').first().getAttribute('href');
      await page.goto(eventHref!);
      await page.waitForLoadState('networkidle');
      await expectNoViolations(page);

      await loginAs(page, 'admin');
      await expectNoViolations(page);

      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      await expectNoViolations(page);

      // Open one Radix dialog and require that it really opens (no silent skip).
      await page.goto('/admin/organizers');
      await page.waitForLoadState('networkidle');
      await page
        .getByRole('button', { name: /dodaj organizatora/i })
        .first()
        .click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expectNoViolations(page);
    });
  });

  test.describe('AC9: framing from a foreign origin', () => {
    test('iframe of /logowanie is blocked by the browser', async ({ page, baseURL }) => {
      await page.route('http://parent.test/**', (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: `<iframe id="f" src="${baseURL}/logowanie"></iframe>`,
        }),
      );

      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('http://parent.test/');
      await page.waitForTimeout(3000);

      const frameElement = await page.$('#f');
      const frame = await frameElement?.contentFrame();
      const blocked =
        (frame && frame.url().startsWith('chrome-error://')) ||
        consoleErrors.some((e) => /refused to (frame|display)/i.test(e));

      expect(blocked).toBeTruthy();
    });

    test('iframe of /embed/event/:id/register renders the app', async ({ page, baseURL }) => {
      const eventId = await discoverSeededEventId();
      await page.route('http://parent.test/**', (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: `<iframe id="f" src="${baseURL}/embed/event/${eventId}/register"></iframe>`,
        }),
      );

      await page.goto('http://parent.test/');
      const frameElement = await page.waitForSelector('#f');
      const frame = await frameElement.contentFrame();
      expect(frame).not.toBeNull();
      await frame!.locator('#root > *').first().waitFor({ state: 'attached', timeout: 10000 });
    });
  });
});

type SeededEvent = { id: string; slug: string; publicationStatus?: string };

async function fetchFirstPublishedEvent(): Promise<SeededEvent> {
  // Discovers a real, published event from the seeded lane database rather
  // than hardcoding fixture data, per the plan's verification recipe.
  const apiBase = process.env.SECURITY_HEADERS_API_BASE_URL || 'http://localhost:8104/api/v1';
  const response = await fetch(`${apiBase}/events?pageSize=50`);
  if (!response.ok) {
    throw new Error(`Could not list events from ${apiBase}/events (status ${response.status}).`);
  }
  const body = (await response.json()) as { data?: SeededEvent[] };
  const event = (body.data ?? []).find((e) => (e.publicationStatus ?? 'published') === 'published');
  if (!event) {
    throw new Error(
      'Could not discover a seeded published event; seed the lane database before running this spec.',
    );
  }
  return event;
}

async function discoverSeededEventId(): Promise<string> {
  return (await fetchFirstPublishedEvent()).id;
}

async function discoverSeededEventSlug(): Promise<string> {
  return (await fetchFirstPublishedEvent()).slug;
}

async function installCspViolationListener(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __cspViolations: string[] }).__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      (window as unknown as { __cspViolations: string[] }).__cspViolations.push(
        `${e.violatedDirective}: ${e.blockedURI}`,
      );
    });
  });
}

async function expectNoViolations(page: Page): Promise<void> {
  const violations = await page.evaluate(
    () => (window as unknown as { __cspViolations?: string[] }).__cspViolations ?? [],
  );
  expect(violations).toEqual([]);
}
