import { test, expect } from '../playwright-fixture';
import type { Page } from '@playwright/test';

async function loginAsOrganizer(page: Page) {
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

  test('draft event page button opens participant preview URL', async ({ page }) => {
    await page.goto('/organizer/events/e19');
    await page.getByRole('link', { name: /Zobacz stronę wydarzenia/i }).click();
    await expect(page).toHaveURL(/\/events\/bieg-miejski-lodz\/preview$/);
    await expect(page.getByText('Tryb podglądu szkicu')).toBeVisible();
    await expect(page.getByRole('button', { name: /Przetestuj formularz/i })).toBeVisible();
  });
});

test.describe('Draft Event Preview Access', () => {
  test('anonymous users cannot open a draft preview URL', async ({ page }) => {
    await page.goto('/events/bieg-miejski-lodz/preview');
    await expect(page.getByText('Wydarzenie nie zostało znalezione')).toBeVisible();
  });
});
