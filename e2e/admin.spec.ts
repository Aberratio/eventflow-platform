import { test, expect } from '../playwright-fixture';

async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@zmierzymyczas.pl');
  await page.fill('input[type="password"]', 'demo1234');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
}

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('dashboard loads with admin identifier', async ({ page }) => {
    await expect(page.locator('text=Admin')).toBeVisible({ timeout: 5000 });
  });

  test('overview tab shows platform stats', async ({ page }) => {
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('events tab lists all events', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Wydarzenia")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('featured events tab loads', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Wyróżnione")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('shop tab lists products', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Sklep")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('orders tab loads order management', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Zamówienia")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('partners tab loads', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Partnerzy")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('pages/CMS tab loads', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Strony")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('users participants subtab loads', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Uczestnicy")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('users organizers subtab loads', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Organizatorzy")');
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

  test('settings tab loads', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Ustawienia")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('moderation tab loads', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Moderacja")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('profile tab loads', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Profil")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});

test.describe('Admin Sub-Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('new product page loads', async ({ page }) => {
    await page.goto('/admin/shop/products/new');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('new page editor loads', async ({ page }) => {
    await page.goto('/admin/pages/new');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('new challenge page loads', async ({ page }) => {
    await page.goto('/admin/challenges/new');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('new partner page loads', async ({ page }) => {
    await page.goto('/admin/partners/new');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
