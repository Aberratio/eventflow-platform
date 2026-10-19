import { test, expect } from '../playwright-fixture';

test.describe('Navigation', () => {
  test('home page loads and shows hero', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });

  test('navigates to events page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('banner').getByRole('link', { name: 'Kalendarz' }).first().click();
    await expect(page).toHaveURL(/\/wydarzenia/);
  });

  test('navigates to series page', async ({ page }) => {
    await page.goto('/series');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });

  test('navigates to shop page', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });

  test('404 page for unknown routes', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz');
    await expect(page.locator('text=404')).toBeVisible();
  });
});
