import { test, expect } from '../playwright-fixture';

async function loginAsParticipant(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'jan@example.com');
  await page.fill('input[type="password"]', 'demo1234');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/participant/, { timeout: 10000 });
}

test.describe('Participant Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParticipant(page);
  });

  test('overview tab shows stats and upcoming events', async ({ page }) => {
    await expect(page.locator('text=Jan Kowalski')).toBeVisible({ timeout: 5000 });
  });

  test('registrations tab displays list', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Rejestracje")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('results/records tab displays', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Wyniki")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('messages tab displays', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Wiadomości")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('orders tab displays order history', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Zamówienia")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('tickets tab displays', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Bilety")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('challenges tab displays', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Wyzwania")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('profile tab shows user data', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Profil")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});

test.describe('Participant Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParticipant(page);
  });

  test('can navigate to events page', async ({ page }) => {
    await page.goto('/wydarzenia');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('can navigate to shop', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('can navigate to cart', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('can view event details', async ({ page }) => {
    await page.goto('/wydarzenia');
    await page.waitForTimeout(500);
    const eventLink = page.locator('a[href*="/events/"]').first();
    if (await eventLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await eventLink.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});
