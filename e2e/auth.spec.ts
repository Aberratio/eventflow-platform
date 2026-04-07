import { test, expect } from '../playwright-fixture';

test.describe('Authentication Flow', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Zaloguj się')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'bad@email.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Nieprawidłowy')).toBeVisible({ timeout: 5000 });
  });

  test('login with test account redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'jan@zmierzymyczas.pl');
    await page.fill('input[type="password"]', 'demo1234');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/participant/, { timeout: 10000 });
  });

  test('register page renders', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('text=Zarejestruj się')).toBeVisible();
  });

  test('forgot password page renders', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
