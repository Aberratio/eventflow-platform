import { test, expect } from '../playwright-fixture';

test.describe('Events', () => {
  test('events page lists events', async ({ page }) => {
    await page.goto('/events');
    await expect(page.locator('h1')).toBeVisible();
    // Should have event cards
    const cards = page.locator('[class*="card"]');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  test('event details page loads', async ({ page }) => {
    await page.goto('/events');
    // Click first event link
    const firstLink = page.locator('a[href^="/events/"]').first();
    await firstLink.click();
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Shop', () => {
  test('shop page shows products', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('cart page is accessible', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Challenges', () => {
  test('challenges list page loads', async ({ page }) => {
    await page.goto('/challenges');
    await expect(page.locator('h1')).toBeVisible();
  });
});
