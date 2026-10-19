import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

const API = process.env.DEV_API_URL || 'https://portal-api-dev.zmierzymyczas.kokot.it/api/v1';

interface Listed {
  slug: string;
  name?: string;
  date?: string;
}

async function list(request: APIRequestContext, path: string): Promise<Listed[]> {
  const res = await request.get(`${API}${path}`);
  expect(res.ok(), `${path} should respond 2xx`).toBeTruthy();
  const json = await res.json();
  return json.data ?? [];
}

async function acceptCookies(page: Page) {
  const btn = page.getByRole('button', { name: /Akceptuj wszystkie/i });
  if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) await btn.click();
}

const today = () => new Date().toISOString().slice(0, 10);

// Collect uncaught page errors and API 5xx, fail the test at the end.
test.beforeEach(async ({ page }) => {
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('response', (r) => {
    if (r.url().startsWith(API) && r.status() >= 500) {
      problems.push(`API ${r.status()}: ${r.request().method()} ${r.url()}`);
    }
  });
  (page as Page & { __problems?: string[] }).__problems = problems;
});

test.afterEach(async ({ page }) => {
  const problems = (page as Page & { __problems?: string[] }).__problems ?? [];
  expect(problems, 'uncaught errors / API 5xx during the test').toEqual([]);
});

test.describe('API (dev)', () => {
  test('health is ok', async ({ request }) => {
    const res = await request.get(`${API}/health`);
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).data.checks.database).toBe('ok');
  });

  test('database is seeded: events, series and products exist', async ({ request }) => {
    expect((await list(request, '/events?pageSize=100')).length, 'events').toBeGreaterThanOrEqual(10);
    expect((await list(request, '/series')).length, 'series').toBeGreaterThan(0);
    expect((await list(request, '/shop/products')).length, 'products').toBeGreaterThan(0);
  });

  test('calendar has both past and upcoming events', async ({ request }) => {
    const events = await list(request, '/events?pageSize=200');
    const dates = events.map((e) => e.date ?? '').filter(Boolean);
    expect(
      dates.some((d) => d < today()),
      'a past event',
    ).toBeTruthy();
    expect(
      dates.some((d) => d >= today()),
      'an upcoming event',
    ).toBeTruthy();
  });
});

test.describe('Public pages (dev)', () => {
  test('home page renders with navigation', async ({ page }) => {
    await page.goto('/');
    await acceptCookies(page);
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('a[href="/events"], a[href="/wydarzenia"]').first()).toBeVisible();
  });

  test('events list shows event cards and opens one', async ({ page }) => {
    await page.goto('/events');
    await acceptCookies(page);
    const link = page.locator('a[href^="/events/"]:visible').first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/events\/[^/]+/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('upcoming event detail loads from the API slug', async ({ page, request }) => {
    const events = await list(request, '/events?pageSize=200');
    const upcoming = events.find((e) => (e.date ?? '') >= today());
    test.skip(!upcoming, 'no upcoming event');
    await page.goto(`/events/${upcoming!.slug}`);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('past event detail loads', async ({ page, request }) => {
    const events = await list(request, '/events?pageSize=200');
    const past = events.find((e) => (e.date ?? '9999') < today());
    test.skip(!past, 'no past event');
    await page.goto(`/events/${past!.slug}`);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('series list and a series page', async ({ page, request }) => {
    const series = await list(request, '/series');
    test.skip(series.length === 0, 'no series');
    await page.goto('/series');
    await expect(page.locator('a[href^="/series/"]').first()).toBeVisible();
    await page.goto(`/series/${series[0].slug}`);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('shop lists products, product page adds to cart', async ({ page, request }) => {
    const products = await list(request, '/shop/products');
    test.skip(products.length === 0, 'no products');
    await page.goto('/shop');
    await acceptCookies(page);
    await expect(page.locator('a[href^="/shop/"]').first()).toBeVisible();

    await page.goto(`/shop/${products[0].slug}`);
    await expect(page.locator('h1').first()).toBeVisible();
    const add = page.getByRole('button', { name: 'Dodaj do koszyka' });
    if (await add.isEnabled({ timeout: 5000 }).catch(() => false)) {
      await add.click();
      await page.goto('/cart');
      await expect(page.getByRole('heading', { name: 'Koszyk' })).toBeVisible();
    }
  });

  test('challenges and info pages load', async ({ page }) => {
    await page.goto('/challenges');
    await expect(page.locator('h1').first()).toBeVisible();
    await page.goto('/info/kontakt');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('unknown route shows 404', async ({ page }) => {
    await page.goto('/this-does-not-exist-xyz');
    await expect(page.getByText('404').first()).toBeVisible();
  });

  test('wrong credentials keep the user on the login page', async ({ page }) => {
    await page.goto('/login');
    await acceptCookies(page);
    await page.locator('input[type="email"]').fill('nobody@example.com');
    await page.locator('input[type="password"]').fill('wrong-password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Signed-in (dev, optional)', () => {
  const email = process.env.E2E_DEV_EMAIL;
  const password = process.env.E2E_DEV_PASSWORD;
  const role = process.env.E2E_DEV_ROLE || 'participant';
  test.skip(!email || !password, 'set E2E_DEV_EMAIL and E2E_DEV_PASSWORD');

  test(`can log in as ${role} and reach the dashboard`, async ({ page }) => {
    await page.goto('/login');
    await acceptCookies(page);
    await page.locator('input[type="email"]').fill(email!);
    await page.locator('input[type="password"]').fill(password!);
    await page.locator('button[type="submit"]').click();
    const area = role === 'superadmin' ? 'admin' : role;
    await expect(page).toHaveURL(new RegExp(`/${area}`), { timeout: 15000 });
  });
});
