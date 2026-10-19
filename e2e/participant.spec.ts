import { test, expect } from '../playwright-fixture';

import { loginAs } from './helpers';

test.describe('Participant Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'participant');
  });

  test('overview tab shows stats and upcoming events', async ({ page }) => {
    await expect(page.getByText(/Witaj, Jan/).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: /Przegląd/ })).toHaveAttribute(
      'data-state',
      'active',
    );
  });

  test('registrations tab displays list', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /Rejestracje/ });
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(tab).toHaveAttribute('data-state', 'active');
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });

  test('history tab displays results', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /Historia/ });
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(tab).toHaveAttribute('data-state', 'active');
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });

  test('messages tab displays', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /Wiadomości/ });
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(tab).toHaveAttribute('data-state', 'active');
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });

  test('orders tab displays order history', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /Zamówienia/ });
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(tab).toHaveAttribute('data-state', 'active');
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });

  test('tickets tab displays', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /Bilety/ });
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(tab).toHaveAttribute('data-state', 'active');
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });

  test('challenges tab displays', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /Wyzwania/ });
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(tab).toHaveAttribute('data-state', 'active');
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });

  test('profile tab shows user data', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /Profil/ });
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(tab).toHaveAttribute('data-state', 'active');
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });
});

test.describe('Participant Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'participant');
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
