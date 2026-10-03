import { test, expect } from '../playwright-fixture';
import { seededEvent } from './api';
import { loginAs } from './helpers';

test.describe('Organizer Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'organizer');
  });

  test('dashboard overview loads with organizer name', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Panel Organizatora' })).toBeVisible();
    // The seed names the organizer "Marek ..."; the header shows the account name.
    await expect(page.getByRole('banner').getByText(/Marek/).first()).toBeVisible();
  });

  test('events tab shows organizer events', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /Moje wydarzenia/ });
    await tab.click();
    await expect(tab).toHaveAttribute('data-state', 'active');
    await expect(page.getByText('Wszystkie wydarzenia')).toBeVisible();
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

  test('draft event page button opens participant preview URL', async ({ page, request }) => {
    const draft = await seededEvent(request, 'e19');
    await page.goto('/organizer/events/e19');
    await page.getByRole('link', { name: /Zobacz stronę wydarzenia/i }).click();
    await expect(page).toHaveURL(new RegExp(`/events/${draft.slug}/preview$`));
    await expect(page.getByText('Tryb podglądu szkicu')).toBeVisible();
    await expect(page.getByRole('button', { name: /Przetestuj formularz/i })).toBeVisible();
  });
});

test.describe('Draft Event Preview Access', () => {
  test('anonymous users cannot open a draft preview URL', async ({ page, request }) => {
    const draft = await seededEvent(request, 'e19');
    await page.goto(`/events/${draft.slug}/preview`);
    await expect(page.getByText('Wydarzenie nie zostało znalezione')).toBeVisible();
  });
});
