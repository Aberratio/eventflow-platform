import { test, expect } from '../playwright-fixture';

test.describe('Polskie aliasy tras', () => {
  test('/wydarzenia ładuje stronę wydarzeń', async ({ page }) => {
    await page.goto('/wydarzenia');
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
  });

  test('/logowanie ładuje stronę logowania', async ({ page }) => {
    await page.goto('/logowanie');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('/rejestracja ładuje formularz rejestracji', async ({ page }) => {
    await page.goto('/rejestracja');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('/sklep ładuje stronę sklepu', async ({ page }) => {
    await page.goto('/sklep');
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
  });

  test('/wyniki/live ładuje wyniki na żywo', async ({ page }) => {
    await page.goto('/wyniki/live');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
