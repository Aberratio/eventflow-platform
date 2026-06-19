import { test, expect } from '../playwright-fixture';
import type { Page } from '@playwright/test';
import { loginAs } from './helpers';

async function openOrganizerSettings(page: Page, eventId: string) {
  await page.goto(`/organizer/events/${eventId}/settings`);
  await expect(page.getByText('Status wydarzenia')).toBeVisible();
}

test.describe('Event workflow - organizer', () => {
  test('event management tabs use addressable routes', async ({ page }) => {
    await loginAs(page, 'organizer');

    await page.goto('/organizer/events/e2e-approved/participants');
    await expect(page).toHaveURL(/\/organizer\/events\/e2e-approved\/participants$/);
    await expect(page.getByRole('tab', { name: /Uczestnicy/i })).toHaveAttribute(
      'data-state',
      'active',
    );

    await page.reload();
    await expect(page).toHaveURL(/\/organizer\/events\/e2e-approved\/participants$/);
    await expect(page.getByRole('tab', { name: /Uczestnicy/i })).toHaveAttribute(
      'data-state',
      'active',
    );

    await page.goto('/organizer/events/e2e-approved?tab=settings');
    await expect(page).toHaveURL(/\/organizer\/events\/e2e-approved\/settings$/);
    await expect(page.getByText('Status wydarzenia')).toBeVisible();
  });

  test('validates and creates a draft event', async ({ page }) => {
    await loginAs(page, 'organizer');
    await page.goto('/organizer/events/new');

    await page.getByRole('button', { name: /Dalej/i }).click();
    await expect(page.locator('body')).toContainText('wymagane pola');

    await page.locator('#name').fill(`E2E Bieg ${Date.now()}`);
    await page.locator('#date').fill('2026-12-12');
    await page.locator('#deadline').fill('2026-12-20');
    await page.getByRole('button', { name: /Dalej/i }).click();
    await expect(page.locator('body')).toContainText('Termin rejestracji nie moze');

    await page.locator('#deadline').fill('2026-12-01');
    await page.locator('#location').fill('Stadion E2E');
    await page.locator('#city').fill('Warszawa');
    await page.getByRole('button', { name: /Dalej/i }).click();

    await page.getByRole('button', { name: /Dalej/i }).click();
    await expect(page.locator('body')).toContainText('Dodaj przynajmniej jeden dystans');

    await page
      .getByRole('button', { name: /Dodaj pierwszy dystans|Dodaj dystans/i })
      .first()
      .click();
    await page.getByPlaceholder('np. Maraton').fill('5K');
    await page.getByPlaceholder('42.195').fill('5');
    await page.getByPlaceholder('150').fill('-1');
    await page.getByRole('button', { name: /Dalej/i }).click();
    await expect(page.locator('body')).toContainText('cena nie moze byc ujemna');

    await page.getByPlaceholder('150').fill('60');
    await page.getByPlaceholder('500').fill('200');
    await page.getByRole('button', { name: /Dalej/i }).click();
    await expect(page.getByText(/Status po zapisie/i)).toBeVisible();

    await page
      .locator('button')
      .filter({ hasText: /wydarzenie/i })
      .last()
      .click();
    await expect(page).toHaveURL(/\/organizer\/events$/);
    await expect(page.getByText(/Szkic/i).first()).toBeVisible();
  });

  test('submits draft for review and publishes an approved event', async ({ page }) => {
    await loginAs(page, 'organizer');

    await openOrganizerSettings(page, 'e19');
    await page.getByRole('button', { name: /Oddaj do sprawdzenia/i }).click();
    await expect(page.getByText(/Do sprawdzenia/i).first()).toBeVisible();

    await openOrganizerSettings(page, 'e2e-approved');
    await page.getByRole('button', { name: /Opublikuj/i }).click();
    await expect(page.getByText(/Aktywne|Opublikowane/i).first()).toBeVisible();

    await page.goto('/events/bieg-testowy-zatwierdzony-2026');
    await expect(page.getByText('Bieg Testowy Zatwierdzony 2026').first()).toBeVisible();
  });
});

test.describe('Event workflow - moderation', () => {
  test('moderator can approve an event waiting for review @smoke', async ({ page }) => {
    await loginAs(page, 'moderator');
    await page.getByRole('button', { name: /^Moderacja$/i }).click();
    await expect(page.getByText('Bieg Testowy Do Moderacji 2026')).toBeVisible();
    await page
      .getByRole('button', { name: /Zatwierdz/i })
      .first()
      .click();
    await expect(page.getByText('Bieg Testowy Do Moderacji 2026')).toBeHidden();
  });

  test('moderator can reject with a comment', async ({ page }) => {
    await loginAs(page, 'moderator');
    await page.getByRole('button', { name: /^Moderacja$/i }).click();
    await expect(page.getByText('Bieg Testowy Do Moderacji 2026')).toBeVisible();
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/powod|poprawy/i);
      await dialog.accept('Brakuje regulaminu i mapy trasy');
    });
    await page
      .getByRole('button', { name: /Odeslij/i })
      .first()
      .click();
    await expect(page.getByText('Bieg Testowy Do Moderacji 2026')).toBeHidden();
  });

  test('admin can see pending and approved moderation queues', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.getByRole('button', { name: /^Moderacja$/i }).click();
    await expect(page.getByText('Bieg Testowy Do Moderacji 2026')).toBeVisible();
    await page.getByRole('tab', { name: /Zatwierdzone/i }).click();
    await expect(page.getByText('Bieg Testowy Zatwierdzony 2026')).toBeVisible();
  });
});

test.describe('Event workflow - participant', () => {
  test('lists public events and hides unpublished drafts @smoke', async ({ page }) => {
    await page.goto('/events');
    await expect(page.getByText('Bieg Testowy Do Moderacji 2026')).toHaveCount(0);
    await expect(page.getByText('Bieg Miejski')).toHaveCount(0);
    await expect(page.locator('a[href*="/events/"]:visible').first()).toBeVisible();
  });

  test('anonymous user is redirected from registration to login', async ({ page }) => {
    await page.goto('/events/triathlon-mazury-2026/register');
    await expect(page).toHaveURL(/\/login/);
  });

  test('closed or sold-out event cannot be registered for', async ({ page }) => {
    await loginAs(page, 'participant');
    await page.goto('/events/bieg-wyprzedany-2026/register');
    await expect(page).toHaveURL(/\/events\/bieg-wyprzedany-2026$/);
    await expect(page.getByText(/Bieg Wyprzedany 2026/i)).toBeVisible();
  });
});
