import { test, expect } from '../playwright-fixture';
import { seededEvent } from './api';
import { loginAs, openDashboardSection } from './helpers';

test.describe('Moderator Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'moderator');
  });

  test('dashboard loads with moderator name', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Panel Moderatora' })).toBeVisible();
    await expect(page.getByText(/Witaj, Monika/)).toBeVisible();
  });

  test('overview tab shows stats', async ({ page }) => {
    await expect(page.getByText('Twój zakres dostępu')).toBeVisible();
  });

  test('moderation tab loads events for review', async ({ page }) => {
    await openDashboardSection(page, 'Moderacja');
    await expect(
      page.getByText(/Wydarzenia do sprawdzenia|Brak wydarzen do sprawdzenia/).first(),
    ).toBeVisible();
  });

  test('can open event preview registration card', async ({ page, request }) => {
    const event = await seededEvent(request, 'e-krakow-bike');
    await page.goto(`/events/${event.slug}/preview`);
    await expect(page.getByText(event.name).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Przetestuj formularz/i })).toBeVisible();
  });

  test('orders tab shows order management', async ({ page }) => {
    await openDashboardSection(page, 'Zamówienia');
    await expect(page.getByText(/Zamówienia \(\d+\)/).first()).toBeVisible();
  });

  test('participants and organizers sections show read-only user lists', async ({ page }) => {
    await openDashboardSection(page, 'Uczestnicy');
    await expect(page.locator('table, [data-testid="empty-state"]').first()).toBeVisible();
    await openDashboardSection(page, 'Organizatorzy');
    await expect(page.locator('table, [data-testid="empty-state"]').first()).toBeVisible();
  });

  test('discount codes tab loads', async ({ page }) => {
    await openDashboardSection(page, 'Kody rabatowe');
    await expect(page.getByText('Kody rabatowe wydarzeń')).toBeVisible();
  });

  test('challenges tab loads', async ({ page }) => {
    await openDashboardSection(page, 'Wyzwania');
    await expect(page.locator('main')).not.toContainText('Coś poszło nie tak');
    await expect(
      page
        .locator('main')
        .getByText(/Wyzwani/)
        .first(),
    ).toBeVisible();
  });
});
