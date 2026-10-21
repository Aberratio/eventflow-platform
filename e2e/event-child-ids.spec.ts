import { expect, test, type Page, type Response } from '@playwright/test';
import { dismissCookies, loginAs } from './helpers';

/**
 * Event child rows (discount codes, merchandise, payment methods, distances) must keep
 * their server ids and server-owned counters across repeated saves from the same screen.
 *
 * Needs a real backend on another origin than the client (not tagged @smoke):
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:5203 PLAYWRIGHT_USE_MOCKS=false \
 *   PP96_API=http://127.0.0.1:8103/api/v1 npx playwright test e2e/event-child-ids.spec.ts
 */
const API = process.env.PP96_API ?? 'http://127.0.0.1:8081/api/v1';
const TOKEN_KEY = 'zmierzymy_czas_api_token';

type Row = { id: string; code?: string; usedCount?: number };
type EventSnapshot = {
  discountCodes: Row[];
  merchandise: Row[];
  paymentMethods: Row[];
  distances: Row[];
};

const fetchEvent = async (page: Page, eventId: string): Promise<EventSnapshot> => {
  const token = await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY);
  const response = await page.request.get(`${API}/events/${eventId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  expect(response.ok()).toBe(true);
  return ((await response.json()) as { data: EventSnapshot }).data;
};

const ids = (rows: Row[] | undefined) => (rows ?? []).map((row) => row.id);

const isEventPatch = (eventId: string) => (response: Response) =>
  response.request().method() === 'PATCH' && response.url().endsWith(`/events/${eventId}`);

const uniqueCode = (prefix: string) => `${prefix}${Date.now().toString(36).toUpperCase()}`;

test.describe('event child ids stay stable across saves', () => {
  // Both tests save the same event, so run them one after another (last write wins otherwise).
  test.describe.configure({ mode: 'serial' });

  test('moderator discount codes tab: second save keeps the server id', async ({ page }) => {
    const eventId = 'e-bank-transfer';
    const code = uniqueCode('PP96A');
    await loginAs(page, 'moderator');
    await page.goto('/moderator');
    await dismissCookies(page);
    await page
      .getByRole('navigation')
      .getByRole('button', { name: /Kody rabatowe/ })
      .click();
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /Bieg Lokalny z Przelewem 2027/ }).click();

    await page.getByRole('button', { name: 'Dodaj kod' }).click();
    await page.getByPlaceholder('np. SUMMER2026').fill(code);
    const [firstSave] = await Promise.all([
      page.waitForResponse(isEventPatch(eventId)),
      page.getByRole('dialog').getByRole('button', { name: 'Dodaj kod' }).click(),
    ]);
    expect(firstSave.ok()).toBe(true);
    await expect(page.getByText('Kody rabatowe zapisane').first()).toBeVisible();

    const afterFirst = await fetchEvent(page, eventId);
    const created = afterFirst.discountCodes.filter((row) => row.code === code);
    expect(created).toHaveLength(1);
    expect(created[0].id).not.toMatch(/^dc-\d+$/);

    // second save from the same screen, no reload: toggle "Aktywny" on the new code
    const row = page.getByRole('row', { name: new RegExp(code) });
    const [secondSave] = await Promise.all([
      page.waitForResponse(isEventPatch(eventId)),
      row.getByRole('switch').click(),
    ]);
    expect(secondSave.ok()).toBe(true);
    const sentCodes = (secondSave.request().postDataJSON() as { discountCodes: Row[] })
      .discountCodes;
    expect(ids(sentCodes)).toContain(created[0].id);
    expect(JSON.stringify(secondSave.request().postDataJSON())).not.toMatch(
      /usedCount|usedBy|registeredCount/,
    );

    const afterSecond = await fetchEvent(page, eventId);
    expect(afterSecond.discountCodes.filter((r) => r.code === code)).toHaveLength(1);
    expect(ids(afterSecond.discountCodes)).toEqual(ids(afterFirst.discountCodes));
  });

  test('admin advanced tab: two saves keep ids of codes, merchandise, payment methods, distances', async ({
    page,
  }) => {
    const eventId = 'e-bank-transfer';
    const code = uniqueCode('PP96B');
    await loginAs(page, 'admin');
    await page.goto(`/admin/events/${eventId}?tab=advanced`);
    await dismissCookies(page);

    await page.getByRole('button', { name: 'Dodaj produkt' }).click();
    await page.getByPlaceholder('np. Koszulka pamiątkowa').fill('Gadzet PP96');
    await page.getByRole('dialog').getByRole('button', { name: 'Dodaj produkt' }).click();
    await page.getByRole('button', { name: 'Dodaj kod' }).click();
    await page.getByPlaceholder('np. SUMMER2026').fill(code);
    await page.getByRole('dialog').getByRole('button', { name: 'Dodaj kod' }).click();

    const save = page.getByRole('button', { name: /Zapisz zmiany/ });
    const saveOnce = async () => {
      const [response] = await Promise.all([
        page.waitForResponse(isEventPatch(eventId)),
        save.click(),
      ]);
      expect(response.ok()).toBe(true);
      await expect(save).toBeEnabled();
      return response;
    };

    await saveOnce();
    const first = await fetchEvent(page, eventId);
    expect(first.discountCodes.filter((row) => row.code === code)).toHaveLength(1);
    await saveOnce();
    const second = await fetchEvent(page, eventId);

    expect(ids(second.discountCodes)).toEqual(ids(first.discountCodes));
    expect(ids(second.merchandise)).toEqual(ids(first.merchandise));
    expect(ids(second.paymentMethods)).toEqual(ids(first.paymentMethods));
    expect(ids(second.distances)).toEqual(ids(first.distances));
  });

  test('admin advanced tab: seeded code keeps id and used_count across two saves', async ({
    page,
  }) => {
    const eventId = 'e-lodz-live';
    await loginAs(page, 'admin');
    await page.goto(`/admin/events/${eventId}?tab=advanced`);
    await dismissCookies(page);
    const before = await fetchEvent(page, eventId);
    const seeded = before.discountCodes.find((row) => row.id === 'dc-lodz-team');
    expect(seeded?.usedCount).toBe(12);

    const save = page.getByRole('button', { name: /Zapisz zmiany/ });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const [response] = await Promise.all([
        page.waitForResponse(isEventPatch(eventId)),
        save.click(),
      ]);
      expect(response.ok()).toBe(true);
      await expect(save).toBeEnabled();
    }

    const after = await fetchEvent(page, eventId);
    const kept = after.discountCodes.find((row) => row.id === 'dc-lodz-team');
    expect(kept?.usedCount).toBe(12);
    expect(ids(after.distances)).toEqual(ids(before.distances));
  });
});
