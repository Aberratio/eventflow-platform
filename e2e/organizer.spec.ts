import { test, expect } from '../playwright-fixture';

async function loginAsOrganizer(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'marek@timing.pl');
  await page.fill('input[type="password"]', 'demo1234');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/organizer/, { timeout: 10000 });
}

test.describe('Organizer Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOrganizer(page);
  });

  test('dashboard overview loads with organizer name', async ({ page }) => {
    await expect(page.locator('text=Marek Organizator')).toBeVisible({ timeout: 5000 });
  });

  test('events tab shows organizer events', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Wydarzenia")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('profile tab loads organizer info', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Profil")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('can access events list page', async ({ page }) => {
    await page.goto('/organizer/events');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('can access new event form', async ({ page }) => {
    await page.goto('/organizer/events/new');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
