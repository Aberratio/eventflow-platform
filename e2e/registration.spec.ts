import { test, expect } from '@playwright/test';
import { dismissCookies } from './helpers';

// Self-registration talks to the real API (run against a live backend; the client and the API are on
// different origins, so this also exercises CORS for POST /auth/register). Not part of the mock smoke run.
test.describe('Self-registration against the live API', () => {
  const password = 'Haslo-e2e-1234';

  async function fillForm(page: import('@playwright/test').Page, email: string) {
    await page.goto('/register');
    await dismissCookies(page);
    await page.getByPlaceholder('Jan', { exact: true }).fill('Ewa');
    await page.getByPlaceholder('Kowalski').fill('Testowa');
    await page.getByPlaceholder('jan@example.com').fill(email);
    await page.getByPlaceholder('Min. 8 znaków').fill(password);
    await page.getByPlaceholder('Powtórz hasło').fill(password);
  }

  test('the form offers no role choice', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByText('Typ konta')).toHaveCount(0);
    await expect(page.getByText('Organizator')).toHaveCount(0);
    await expect(page.getByRole('radio')).toHaveCount(0);
  });

  test('registers a real participant account, signs in and lands on the participant area', async ({
    page,
  }) => {
    const email = `e2e-reg-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
    const registerResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/auth/register') && response.request().method() === 'POST',
    );

    await fillForm(page, email);
    await page.getByRole('button', { name: 'Zarejestruj się' }).click();

    const response = await registerResponse;
    expect(response.status()).toBe(201);
    const sent = response.request().postDataJSON() as Record<string, unknown>;
    expect(sent).not.toHaveProperty('role');
    const body = (await response.json()) as { data: { role: string; email: string } };
    expect(body.data.role).toBe('participant');
    expect(body.data.email).toBe(email);

    await expect(page).toHaveURL(/\/participant/, { timeout: 15000 });
  });

  test('a taken e-mail shows the server message and stays on the form', async ({ page }) => {
    const email = `e2e-dup-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
    await fillForm(page, email);
    await page.getByRole('button', { name: 'Zarejestruj się' }).click();
    await expect(page).toHaveURL(/\/participant/, { timeout: 15000 });

    await page.evaluate(() => window.localStorage.clear());
    await fillForm(page, email);
    await page.getByRole('button', { name: 'Zarejestruj się' }).click();

    await expect(page.getByText('Ten adres e-mail jest już zajęty.').first()).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('button', { name: 'Zarejestruj się' })).toBeEnabled();
  });
});
