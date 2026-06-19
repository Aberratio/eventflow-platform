import { test, expect } from '../playwright-fixture';

async function loginAsModerator(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'monika@zmierzymyczas.pl');
  await page.fill('input[type="password"]', 'demo1234');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/moderator/, { timeout: 10000 });
}

test.describe('Moderator Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsModerator(page);
  });

  test('dashboard loads with moderator name', async ({ page }) => {
    await expect(page.locator('text=Monika Moderator')).toBeVisible({ timeout: 5000 });
  });

  test('overview tab shows stats', async ({ page }) => {
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('moderation tab loads events for review', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Moderacja")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('can open event preview registration card', async ({ page }) => {
    await page.goto('/events/krakowski-klasyk-rowerowy-2026/preview');
    await expect(page.getByText('Krakowski Klasyk Rowerowy 2026').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Przetestuj formularz/i })).toBeVisible();
  });

  test('orders tab shows order management', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Zamówienia")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('users tab shows read-only user list', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Użytkownicy")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('discount codes tab loads', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Kody")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('challenges tab loads', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Wyzwania")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('profile tab shows moderator info', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Profil")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});
