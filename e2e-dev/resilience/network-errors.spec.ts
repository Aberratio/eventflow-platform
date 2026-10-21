import type { Page, Route } from '@playwright/test';
import {
  test,
  expect,
  skipCookieBanner,
  type EventSummary,
  type Slugged,
} from '../support/fixtures';
import { API } from '../support/env';

/** A Polish message telling the user something went wrong (not the neutral "Nie znaleziono ..." empty state). */
const ERROR_RE =
  /nie udało się|wystąpił błąd|wystąpił problem|coś poszło nie tak|błąd (serwera|połączenia|sieci|ładowania)|spróbuj ponownie|problem z (połączeniem|serwerem)|niedostępn|brak połączenia/i;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
};
const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    headers: CORS,
    body: JSON.stringify(body),
  });

const EMPTY = { success: true, data: [] };
const LONG_NAME = `Ąęść żółć ŹŻĆ ${'Bieg Przełajowy Świętokrzyski '.repeat(8)}🏃‍♀️🔥🎉`.slice(0, 300);

type Mock = { match: RegExp; handler: (route: Route) => Promise<void> };

/**
 * Replaces the whole API for this page: listed paths get their handler, everything else an empty success.
 * No request reaches the shared dev API, so the host is not loaded by these tests.
 */
async function mockApi(page: Page, mocks: Mock[] = []): Promise<void> {
  await page.route(
    (u) => u.href.startsWith(API),
    async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/^.*\/api\/v1/, '');
      if (route.request().method() === 'OPTIONS')
        return route.fulfill({ status: 204, headers: CORS });
      const hit = mocks.find((m) => m.match.test(path));
      if (hit) return hit.handler(route);
      return json(route, 200, EMPTY);
    },
  );
}

const paged = <T>(rows: T[]) => ({
  success: true,
  data: rows,
  total: rows.length,
  page: 1,
  pageSize: 100,
  totalPages: 1,
});
const futureDate = () => new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);

function upcomingEvent(
  seed: { events: EventSummary[]; upcoming: EventSummary[] },
  name?: string,
): EventSummary {
  const base = seed.upcoming[0] ?? seed.events[0];
  return {
    ...base,
    name: name ?? base.name,
    date: futureDate(),
    publicationStatus: 'published',
    visibility: 'public',
    isPrivate: false,
  };
}

const noHorizontalScroll = (page: Page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );

interface Surface {
  name: string;
  url: (seed: { events: EventSummary[]; series: Slugged[] }) => string;
  main: RegExp;
  /** Mock returning healthy data after the failure was lifted. */
  healthy: (seed: {
    events: EventSummary[];
    upcoming: EventSummary[];
    series: Slugged[];
    products: Slugged[];
  }) => Mock[];
  /** Text proving the data rendered. */
  shows: (seed: {
    events: EventSummary[];
    upcoming: EventSummary[];
    series: Slugged[];
    products: Slugged[];
  }) => string;
}

const SURFACES: Surface[] = [
  {
    name: '/events',
    url: () => '/events',
    main: /\/events(\?|$)/,
    healthy: (s) => [
      { match: /^\/events(\?|$)/, handler: (r) => json(r, 200, paged([upcomingEvent(s)])) },
    ],
    shows: (s) => upcomingEvent(s).name,
  },
  {
    name: 'event detail',
    url: (s) => `/events/${s.events[0].slug}`,
    main: /^\/events\/(slug\/)?[^/]+$/,
    healthy: (s) => [
      {
        match: /^\/events\/(slug\/)?[^/]+$/,
        handler: (r) => json(r, 200, { success: true, data: upcomingEvent(s) }),
      },
    ],
    shows: (s) => upcomingEvent(s).name,
  },
  {
    name: '/shop',
    url: () => '/shop',
    main: /^\/shop\/products/,
    healthy: (s) => [
      { match: /^\/shop\/products(\?|$)/, handler: (r) => json(r, 200, paged([s.products[0]])) },
    ],
    shows: (s) => String(s.products[0].name),
  },
  {
    name: '/series',
    url: () => '/series',
    main: /^\/series(\?|$)/,
    healthy: (s) => [
      { match: /^\/series(\?|$)/, handler: (r) => json(r, 200, paged([s.series[0]])) },
    ],
    shows: (s) => String(s.series[0].name),
  },
];

test.describe('Resilience: API errors @resilience', () => {
  test.beforeEach(async ({ page }) => {
    await skipCookieBanner(page);
  });

  for (const s of SURFACES) {
    test(`${s.name}: 500 from the main endpoint shows an error message, and recovers after retry`, async ({
      page,
      seed,
      problems,
    }) => {
      test.skip(
        !seed.events[0] || !seed.series[0] || !seed.products[0],
        'seed lacks events/series/products',
      );
      problems.allow(/API 500/);
      await mockApi(page, [
        {
          match: s.main,
          handler: (r) =>
            json(r, 500, {
              success: false,
              error: { code: 'server_error', message: 'Wystąpił nieoczekiwany błąd serwera.' },
            }),
        },
      ]);
      await page.goto(s.url(seed));

      await expect(
        page.getByText(ERROR_RE).first(),
        'a Polish error message must be visible, not an empty state',
      ).toBeVisible({ timeout: 15000 });
      expect(await page.locator('#root').innerText(), 'no white screen').not.toBe('');
      await expect(page.getByRole('navigation').or(page.getByRole('banner')).first()).toBeVisible();

      await page.unroute((u) => u.href.startsWith(API));
      await mockApi(page, s.healthy(seed));
      await page.reload();
      await expect(page.getByText(s.shows(seed), { exact: false }).first()).toBeVisible();
    });
  }

  test('/events: request that times out ends in an error, not an endless spinner', async ({
    page,
    seed,
    problems,
  }) => {
    test.skip(!seed.events[0], 'no events');
    problems.allow(/.*/);
    await mockApi(page, [{ match: /^\/events(\?|$)/, handler: (r) => r.abort('timedout') }]);
    const t0 = Date.now();
    await page.goto('/events');
    await expect(
      page.getByText(ERROR_RE).first(),
      'error message after the failed request',
    ).toBeVisible({ timeout: 15000 });
    test
      .info()
      .annotations.push({ type: 'timeout-to-error', description: `${Date.now() - t0} ms` });
  });

  test('/events: request that never answers shows loading and then an error within 20 s', async ({
    page,
    seed,
    problems,
  }) => {
    test.skip(!seed.events[0], 'no events');
    test.setTimeout(60000);
    problems.allow(/.*/);
    await mockApi(page, [
      { match: /^\/events(\?|$)/, handler: () => new Promise<void>(() => undefined) },
    ]);
    const t0 = Date.now();
    await page.goto('/events', { waitUntil: 'domcontentloaded' });
    await expect(
      page.locator('[class*="animate-pulse"]').first(),
      'loading state first',
    ).toBeVisible();
    await expect(
      page.getByText(ERROR_RE).first(),
      'no answer must end in an error message, not an infinite spinner',
    ).toBeVisible({ timeout: 20000 });
    test.info().annotations.push({ type: 'hang-to-error', description: `${Date.now() - t0} ms` });
  });
});

test.describe('Resilience: empty data @resilience', () => {
  test.beforeEach(async ({ page }) => {
    await skipCookieBanner(page);
    await mockApi(page);
  });

  test('/events with {success:true,data:[]} shows an empty state', async ({ page }) => {
    await page.goto('/events');
    await expect(page.getByRole('heading', { name: /Nie znaleziono wydarzeń/i })).toBeVisible();
  });

  test('/shop with no products shows an empty state', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.getByText(/Nie znaleziono produktów/i)).toBeVisible();
  });

  test('/series with no series shows an empty state', async ({ page }) => {
    await page.goto('/series');
    await expect(page.getByText(/Nie znaleziono serii/i)).toBeVisible();
  });

  test('/challenges with no challenges shows a readable empty state', async ({ page }) => {
    await page.goto('/challenges');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      page
        .getByText(/brak|nie znaleziono|nie ma (jeszcze )?(żadnych )?wyzwań|nie ma aktywnych/i)
        .first(),
      'explicit empty-state text',
    ).toBeVisible();
  });
});

test.describe('Resilience: extreme content @resilience', () => {
  for (const vp of [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'mobile 375', width: 375, height: 700 },
  ]) {
    test(`300-character event name does not break layout (${vp.name})`, async ({ page, seed }) => {
      test.skip(!seed.events[0], 'no events');
      await skipCookieBanner(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const ev = upcomingEvent(seed, LONG_NAME);
      await mockApi(page, [
        { match: /^\/events(\?|$)/, handler: (r) => json(r, 200, paged([ev])) },
        {
          match: /^\/events\/(slug\/)?[^/]+$/,
          handler: (r) => json(r, 200, { success: true, data: ev }),
        },
      ]);
      await page.goto('/events');
      await expect(page.getByText('Ąęść żółć ŹŻĆ', { exact: false }).first()).toBeVisible();
      expect(await noHorizontalScroll(page), 'no horizontal scroll on /events').toBe(true);

      await page.goto(`/events/${ev.slug}`);
      await expect(page.getByText('Ąęść żółć ŹŻĆ', { exact: false }).first()).toBeVisible();
      expect(await noHorizontalScroll(page), 'no horizontal scroll on event detail').toBe(true);
    });

    test(`300-character product name does not break layout (${vp.name})`, async ({
      page,
      seed,
    }) => {
      test.skip(!seed.products[0], 'no products');
      await skipCookieBanner(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const product = { ...seed.products[0], name: LONG_NAME };
      await mockApi(page, [
        { match: /^\/shop\/products(\?|$)/, handler: (r) => json(r, 200, paged([product])) },
        {
          match: /^\/shop\/products\/slug\//,
          handler: (r) => json(r, 200, { success: true, data: product }),
        },
      ]);
      await page.goto('/shop');
      await expect(page.getByText('Ąęść żółć ŹŻĆ', { exact: false }).first()).toBeVisible();
      expect(await noHorizontalScroll(page), 'no horizontal scroll on /shop').toBe(true);

      await page.goto(`/shop/${product.slug}`);
      await expect(page.getByText('Ąęść żółć ŹŻĆ', { exact: false }).first()).toBeVisible();
      expect(await noHorizontalScroll(page), 'no horizontal scroll on product page').toBe(true);
    });
  }
});

test.describe('Resilience: network conditions @resilience', () => {
  test.beforeEach(async ({ page }) => {
    await skipCookieBanner(page);
  });

  test('going offline after /events loaded, then opening an event, shows a message instead of crashing', async ({
    page,
    context,
    seed,
    problems,
  }) => {
    test.skip(!seed.events[0], 'no events');
    problems.allow(/.*/);
    const ev = upcomingEvent(seed);
    await mockApi(page, [{ match: /^\/events(\?|$)/, handler: (r) => json(r, 200, paged([ev])) }]);
    await page.goto('/events');
    const link = page.locator(`a[href*="/events/${ev.slug}"]`).first();
    await expect(link).toBeVisible();
    await context.setOffline(true);
    await link.click();
    await expect(page, 'URL changed or stayed, but the app is alive').toHaveURL(/\/events/);
    await expect(
      page
        .getByText(ERROR_RE)
        .or(page.getByText(/nie zostało znalezione|offline|brak (połączenia|internetu)/i))
        .first(),
      'a message must be visible when offline',
    ).toBeVisible({ timeout: 15000 });
    expect(await page.locator('#root').innerText(), 'no white screen').not.toBe('');
  });

  test('Slow 3G: home page h1 within 15 s', async ({ page, context, seed }) => {
    test.setTimeout(60000);
    test.skip(!seed.events[0], 'no events');
    await mockApi(page);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 400,
      downloadThroughput: (400 * 1024) / 8,
      uploadThroughput: (400 * 1024) / 8,
    });
    const t0 = Date.now();
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 15000 });
    const ms = Date.now() - t0;
    test.info().annotations.push({ type: 'slow3g-h1', description: `${ms} ms` });
    expect(ms).toBeLessThan(15000);
  });

  test('401 from the API on a public page does not cause a redirect loop for anonymous', async ({
    page,
    seed,
  }) => {
    test.skip(!seed.events[0], 'no events');
    await mockApi(page, [
      {
        match: /.*/,
        handler: (r) =>
          json(r, 401, {
            success: false,
            error: { code: 'unauthorized', message: 'Unauthorized' },
          }),
      },
    ]);
    let navigations = 0;
    page.on('framenavigated', (f) => {
      if (f === page.mainFrame()) navigations += 1;
    });
    await page.goto('/events');
    await page.waitForLoadState('networkidle');
    const urlAfterLoad = page.url();
    await expect(page.locator('#root')).not.toBeEmpty();
    await page.waitForLoadState('networkidle');
    expect(page.url(), 'URL is stable after load').toBe(urlAfterLoad);
    expect(navigations, 'main-frame navigations (loop would be unbounded)').toBeLessThanOrEqual(3);
  });
});
