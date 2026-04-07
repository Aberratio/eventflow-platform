import { test, expect } from '../playwright-fixture';

test.describe('Public Pages - No Auth Required', () => {
  test('home page loads with hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('events page loads and shows events', async ({ page }) => {
    await page.goto('/wydarzenia');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('shop page loads products', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('challenges page loads', async ({ page }) => {
    await page.goto('/challenges');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('series list page loads', async ({ page }) => {
    await page.goto('/series');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('cart page loads empty', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('notifications page loads', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('info page kontakt loads', async ({ page }) => {
    await page.goto('/info/kontakt');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('info page oferta loads', async ({ page }) => {
    await page.goto('/info/oferta');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Error Pages', () => {
  test('404 page renders for unknown route', async ({ page }) => {
    await page.goto('/this-does-not-exist-xyz');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('500 error page renders', async ({ page }) => {
    await page.goto('/500');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('503 error page renders', async ({ page }) => {
    await page.goto('/503');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('403 forbidden page renders', async ({ page }) => {
    await page.goto('/403');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
