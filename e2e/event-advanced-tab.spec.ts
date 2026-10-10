import { expect, test, type Page } from '@playwright/test';
import { dismissCookies, loginAs } from './helpers';

/**
 * PP.103: the admin event screen must not crash on DECIMAL money fields that PHP/PDO serialises
 * as numeric strings ("120.00"). Reproduces the second visit to "Opcje zaawansowane".
 *
 * Needs a real backend on another origin than the client (not tagged @smoke):
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:5203 PLAYWRIGHT_USE_MOCKS=false \
 *   npx playwright test e2e/event-advanced-tab.spec.ts
 * with the client built against VITE_API_URL=http://127.0.0.1:8103/api/v1.
 */
const EVENT_ID = 'e-gdynia-half';

const trackPageErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
};

test.describe('admin event advanced tab with string DECIMAL prices (PP.103)', () => {
  // The save test mutates the event, so keep the tests of this file in order.
  test.describe.configure({ mode: 'serial' });

  test('advanced -> overview -> advanced does not crash', async ({ page }) => {
    const errors = trackPageErrors(page);
    await loginAs(page, 'admin');
    await page.goto(`/admin/events/${EVENT_ID}`);
    await dismissCookies(page);

    await page.getByRole('tab', { name: 'Opcje zaawansowane' }).click();
    await expect(page.getByRole('heading', { name: 'Opcje zaawansowane' })).toBeVisible();
    await page.getByRole('tab', { name: 'Przegląd' }).click();
    await page.getByRole('tab', { name: 'Opcje zaawansowane' }).click();

    await expect(page.getByText(/Cena bazowa: 120 zł/).first()).toBeVisible();
    await expect(page.getByText('(21.097 km)').first()).toBeVisible();
    // AC5: DECIMAL(10,3) "10.000" renders as 10, not 10.000.
    await expect(page.getByText('(10 km)').first()).toBeVisible();
    await expect(page.getByText('10.000 km')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('direct ?tab=advanced renders the price preview', async ({ page }) => {
    const errors = trackPageErrors(page);
    await loginAs(page, 'admin');
    await page.goto(`/admin/events/${EVENT_ID}?tab=advanced`);
    await dismissCookies(page);

    await expect(page.getByText(/Cena bazowa: 120 zł/).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('save in the advanced tab, switch tabs and come back', async ({ page }) => {
    const errors = trackPageErrors(page);
    await loginAs(page, 'admin');
    await page.goto(`/admin/events/${EVENT_ID}`);
    await dismissCookies(page);

    await page.getByRole('tab', { name: 'Opcje zaawansowane' }).click();
    await page.locator('#liveResultsUrl').fill('https://example.com/live-pp103');
    const [saved] = await Promise.all([
      page.waitForResponse(
        (r) => r.request().method() === 'PATCH' && r.url().endsWith(`/events/${EVENT_ID}`),
      ),
      page.getByRole('button', { name: 'Zapisz zmiany' }).click(),
    ]);
    expect(saved.ok()).toBe(true);

    await page.getByRole('tab', { name: 'Przegląd' }).click();
    await page.getByRole('tab', { name: 'Opcje zaawansowane' }).click();
    await expect(page.getByText(/Cena bazowa: 120 zł/).first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});
