import { test, expect, skipCookieBanner } from './fixtures';
import { hasPassword, login, signIn, requireAccounts } from './accounts';
import { scanA11y } from './axe';

// Proves the shared helpers work against dev; every other spec builds on them.
test.describe('support helpers @smoke', () => {
  test('seed fixture reads the public catalogue', async ({ seed }) => {
    expect(seed.events.length).toBeGreaterThanOrEqual(10);
    expect(seed.upcoming.length, 'upcoming events').toBeGreaterThan(0);
    expect(seed.past.length, 'past events').toBeGreaterThan(0);
    expect(seed.series.length).toBeGreaterThan(0);
    expect(seed.products.length).toBeGreaterThan(0);
    for (const e of seed.events) expect(e.slug, `event ${e.id} slug`).toMatch(/^[a-z0-9-]+$/);
  });

  test('cookie banner can be skipped and axe runs', async ({ page }) => {
    await skipCookieBanner(page);
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Akceptuj wszystkie/i })).toHaveCount(0);
    const { all } = await scanA11y(page);
    expect(Array.isArray(all)).toBe(true);
  });

  test.describe('accounts', () => {
    requireAccounts();
    test('participant logs in through the API and the page is signed in', async ({ page, request }) => {
      expect(hasPassword()).toBe(true);
      const session = await login(request, 'participant');
      expect(session.user.role).toBe('participant');
      await signIn(page, request, 'participant');
      await page.goto('/participant');
      await expect(page).toHaveURL(/\/participant/);
    });
  });
});
