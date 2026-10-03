import { test, expect } from '../playwright-fixture';

test.describe('Events', () => {
  test('events page lists events', async ({ page }) => {
    await page.goto('/events');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    // Should have event cards
    const cards = page.locator('[class*="card"]');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  test('event details page loads', async ({ page }) => {
    await page.goto('/events');
    // Click first event link
    const firstLink = page.getByRole('main').locator('a[href^="/events/"]').first();
    await firstLink.click();
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });
});

test.describe('Shop', () => {
  test('shop page shows products', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });

  test('cart page is accessible', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });
});

test.describe('Challenges', () => {
  test('challenges list page loads', async ({ page }) => {
    await page.goto('/challenges');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });
});
