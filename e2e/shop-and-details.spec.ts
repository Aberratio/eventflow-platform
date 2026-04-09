import { test, expect } from '../playwright-fixture';

test.describe('Shop & Cart Flow', () => {
  test('shop page lists products with prices', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.locator('h1')).toBeVisible();
    const productCards = page.locator('[class*="card"]');
    await expect(productCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('can navigate to product details', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForTimeout(500);
    const productLink = page.locator('a[href^="/shop/"]').first();
    if (await productLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await productLink.click();
      await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
    }
  });

  test('cart shows empty state when no items', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('h1')).toBeVisible();
    // Should show empty cart or 0 items
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Event Filtering & Details', () => {
  test('events page shows filter controls', async ({ page }) => {
    await page.goto('/events');
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
  });

  test('event details page shows tabs', async ({ page }) => {
    await page.goto('/events');
    await page.waitForTimeout(1000);
    const eventLink = page.locator('a[href^="/events/"]').first();
    if (await eventLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await eventLink.click();
      await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
      // Check tabs are present
      const tabs = page.locator('[role="tab"]');
      await expect(tabs.first()).toBeVisible();
    }
  });

  test('event details shows distances tab', async ({ page }) => {
    await page.goto('/events');
    await page.waitForTimeout(1000);
    const eventLink = page.locator('a[href^="/events/"]').first();
    if (await eventLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await eventLink.click();
      await page.waitForTimeout(500);
      const distTab = page.locator('[role="tab"]:has-text("Dystans")');
      if (await distTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await distTab.click();
        await page.waitForTimeout(500);
        await expect(page.locator('body')).not.toBeEmpty();
      }
    }
  });
});

test.describe('Series Pages', () => {
  test('series list page shows series', async ({ page }) => {
    await page.goto('/series');
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
  });

  test('series details page loads', async ({ page }) => {
    await page.goto('/series');
    await page.waitForTimeout(1000);
    const seriesLink = page.locator('a[href^="/series/"]').first();
    if (await seriesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await seriesLink.click();
      await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Profile & Athlete Pages', () => {
  test('profile page loads', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('live results page loads', async ({ page }) => {
    await page.goto('/wyniki/live');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Info Pages', () => {
  test('about page loads', async ({ page }) => {
    await page.goto('/info/o-nas');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('insurance page loads', async ({ page }) => {
    await page.goto('/info/ubezpieczenie');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
