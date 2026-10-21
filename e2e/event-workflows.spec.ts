import { test, expect } from '../playwright-fixture';
import type { APIRequestContext, Page } from '@playwright/test';
import { API_URL, ensureOrganizerCapacity, organizerPackageCredits, seededEvent } from './api';
import {
  addFirstDistance,
  advanceThroughWizard,
  clickNextAndSettle,
  isoDaysFromToday,
  loginAs,
  openDashboardSection,
  pickDate,
  WIZARD_NEXT_BUTTON,
  wizardSubStep,
} from './helpers';

const NO_CREDIT_MESSAGE =
  'Brak dostępnego pakietu organizatora. Kup pakiet, aby oddać wydarzenie do sprawdzenia.';

async function openOrganizerSettings(page: Page, eventId: string) {
  await page.goto(`/organizer/events/${eventId}/settings`);
  await expect(page.getByText('Status wydarzenia')).toBeVisible();
}

// Moderation queue card (ModeratorModerationTab / AdminModerationTab): the innermost element that
// holds the event name and its action buttons, so a click never lands on another event's card.
function queueCard(page: Page, eventName: string) {
  return page
    .locator('div')
    .filter({ has: page.getByText(eventName, { exact: true }) })
    .filter({ has: page.getByRole('button', { name: /Zatwierdz/ }) })
    .last();
}

async function publicationStatus(request: APIRequestContext, id: string) {
  return (await seededEvent(request, id)).publicationStatus;
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

  test('validates and creates a draft event', async ({ page, request }) => {
    test.slow();
    await ensureOrganizerCapacity(request);
    await loginAs(page, 'organizer');
    await page.goto('/organizer/events/new');

    await page.getByRole('button', { name: WIZARD_NEXT_BUTTON }).click();
    await expect(page.locator('body')).toContainText('wymagane pola');

    await page.locator('#name').fill(`E2E Bieg ${Date.now()}`);
    await pickDate(page, 'date', isoDaysFromToday(70));
    await pickDate(page, 'deadline', isoDaysFromToday(80));
    await page.locator('#location').fill('Stadion E2E');
    await page.locator('#city').fill('Warszawa');
    await page.getByRole('button', { name: WIZARD_NEXT_BUTTON }).click();
    await expect(page.locator('body')).toContainText('Termin rejestracji nie moze');

    await pickDate(page, 'deadline', isoDaysFromToday(60));

    // Walk the sub-steps until the distances sub-step, then try to leave it without a distance.
    for (let i = 0; i < 25 && (await wizardSubStep(page)) !== 'distances'; i++) {
      await clickNextAndSettle(page);
    }
    expect(await wizardSubStep(page)).toBe('distances');
    await page.getByRole('button', { name: WIZARD_NEXT_BUTTON }).click();
    await expect(page.locator('body')).toContainText('Dodaj przynajmniej jeden dystans');

    await addFirstDistance(page, '-1');
    await page.getByRole('button', { name: WIZARD_NEXT_BUTTON }).click();
    await expect(page.locator('body')).toContainText('nie moze byc ujemna');

    await page.getByPlaceholder('150').first().fill('60');
    await advanceThroughWizard(page, /Utwórz wydarzenie/);
    await expect(page.getByText(/Status po zapisie/i)).toBeVisible();

    await page.getByRole('button', { name: /Utwórz wydarzenie/ }).click();
    await expect(page).toHaveURL(/\/organizer\/events$/);
    await expect(page.getByText(/Szkic/i).first()).toBeVisible();
  });
});

// One serial flow on a fresh seed. Fixtures are resolved by stable ID (names and slugs carry a year
// that moves with the seed date). Depends on the seed: e19 = draft with a rejection reason,
// e2e-pending = submitted, u-organizer starts with 0 package credits (a seed change may alter this; if
// it grants credits, step 1 has to change with it).
test.describe.serial('Event lifecycle - seeded e2e-pending and e19', () => {
  const SEND_BACK_REASON = 'Brakuje regulaminu i mapy trasy';

  test('organizer without a package credit cannot submit a draft', async ({ page, request }) => {
    expect(
      await organizerPackageCredits(request),
      'reseed the database (fresh DB) before running e2e',
    ).toBe(0);
    const e19 = await seededEvent(request, 'e19');
    expect(e19.rejectionReason, 'e19 is seeded as a draft sent back with a reason').toBeTruthy();

    await loginAs(page, 'organizer');
    await openOrganizerSettings(page, 'e19');
    await expect(page.getByText(/Powod odrzucenia:/).locator('..')).toContainText(
      e19.rejectionReason as string,
    );
    const submit = page.getByRole('button', { name: 'Popraw i oddaj ponownie do sprawdzenia' });
    await expect(submit).toBeVisible();
    await submit.click();

    await expect(page.getByText(NO_CREDIT_MESSAGE, { exact: true })).toBeVisible();
    await expect(page.getByText(/No available organizer package credit/i)).toHaveCount(0);
    await expect(page.getByText('Szkic', { exact: true }).first()).toBeVisible();
    expect(await publicationStatus(request, 'e19')).toBe('draft');
  });

  test('admin sees the pending event in the moderation queue', async ({ page, request }) => {
    const pending = await seededEvent(request, 'e2e-pending');
    await loginAs(page, 'admin');
    await openDashboardSection(page, 'Moderacja');
    await expect(page.getByText(pending.name, { exact: true })).toBeVisible();
  });

  test('moderator sends the event back with a comment', async ({ page, request }) => {
    const pending = await seededEvent(request, 'e2e-pending');
    await loginAs(page, 'moderator');
    await openDashboardSection(page, 'Moderacja');
    await expect(page.getByText(pending.name, { exact: true })).toBeVisible();

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/powod|poprawy/i);
      await dialog.accept(SEND_BACK_REASON);
    });
    await queueCard(page, pending.name)
      .getByRole('button', { name: /Odeslij/ })
      .click();

    await expect(page.getByText(pending.name, { exact: true })).toBeHidden();
    const after = await seededEvent(request, 'e2e-pending');
    expect(after.publicationStatus).toBe('draft');
    expect(after.rejectionReason).toBe(SEND_BACK_REASON);
  });

  test('organizer sees the reason and resubmits with the refunded credit', async ({
    page,
    request,
  }) => {
    await loginAs(page, 'organizer');
    await openOrganizerSettings(page, 'e2e-pending');
    await expect(page.getByText(/Powod odrzucenia:/).locator('..')).toContainText(SEND_BACK_REASON);
    await page.getByRole('button', { name: 'Popraw i oddaj ponownie do sprawdzenia' }).click();

    await expect(page.getByText('Wydarzenie oddane do sprawdzenia', { exact: true })).toBeVisible();
    expect(await publicationStatus(request, 'e2e-pending')).toBe('submitted');
  });

  test('moderator can approve an event waiting for review @smoke', async ({ page, request }) => {
    const pending = await seededEvent(request, 'e2e-pending');
    await loginAs(page, 'moderator');
    await openDashboardSection(page, 'Moderacja');
    await expect(page.getByText(pending.name, { exact: true })).toBeVisible();
    await queueCard(page, pending.name)
      .getByRole('button', { name: /Zatwierdz/ })
      .click();

    await expect(page.getByText(pending.name, { exact: true })).toBeHidden();
    expect(await publicationStatus(request, 'e2e-pending')).toBe('published');
  });

  test('approved event is public', async ({ page, request }) => {
    const approved = await seededEvent(request, 'e2e-pending');
    await page.goto(`/events/${approved.slug}`);
    await expect(page.getByText(approved.name).first()).toBeVisible();
  });
});

test.describe('Event workflow - participant', () => {
  test('lists public events and hides unpublished drafts @smoke', async ({ page, request }) => {
    const draft = await seededEvent(request, 'e19');
    await page.goto('/events');
    await expect(page.getByText(draft.name, { exact: true })).toHaveCount(0);
    await expect(page.locator('a[href*="/events/"]:visible').first()).toBeVisible();

    const res = await request.get(`${API_URL}/events?includeUnpublished=1&pageSize=100`);
    expect(res.status()).toBe(200);
    const rows = ((await res.json()).data ?? []) as Array<{ id: string }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.find((row) => row.id === 'e19')).toBeUndefined();
  });

  test('anonymous user is redirected from registration to login', async ({ page, request }) => {
    const open = await seededEvent(request, 'e2e-registration-open');
    await page.goto(`/events/${open.slug}/register`);
    await expect(page).toHaveURL(/\/login/);
  });

  test('closed or sold-out event cannot be registered for', async ({ page, request }) => {
    const full = await seededEvent(request, 'e-full');
    await loginAs(page, 'participant');
    await page.goto(`/events/${full.slug}/register`);
    await expect(page).toHaveURL(new RegExp(`/events/${full.slug}$`));
    await expect(page.getByText(full.name).first()).toBeVisible();
  });
});
