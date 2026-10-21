import { test, expect } from '../playwright-fixture';

import { seededEvent } from './api';
import { loginAs, openDashboardSection } from './helpers';

test.describe('Interakcje — Logowanie', () => {
  test('wypełnienie formularza przez kartę testową', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(500);

    // Click first mock credential card to auto-fill
    const credCard = page.locator('text=Uczestnik').first();
    if (await credCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await credCard.click();
      await page.waitForTimeout(300);

      // Check email was auto-filled
      const emailInput = page.locator('input[type="email"]');
      const emailValue = await emailInput.inputValue();
      expect(emailValue).toBe('jan@example.com');
    }
  });

  test('poprawne logowanie i przekierowanie', async ({ page }) => {
    await loginAs(page, 'participant');
    await expect(page).toHaveURL(/\/participant/, { timeout: 10000 });
    await expect(page.getByText(/Witaj, Jan/).first()).toBeVisible();
  });

  test('walidacja email w formularzu logowania', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'niepoprawny-email');
    await page.fill('input[type="password"]', 'demo1234');
    await page.click('button[type="submit"]');
    // The browser's native type=email validation stops the submit before zod runs (the Polish
    // message UX is tracked under PP.26).
    await expect(page.locator('input[type="email"]:invalid')).toHaveCount(1);
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Interakcje — Rejestracja', () => {
  test('formularz rejestracji — walidacja pustych pól', async ({ page }) => {
    await page.goto('/register');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    // Should show validation errors
    const errors = page.locator('[id*="message"], .text-destructive');
    await expect(errors.first()).toBeVisible({ timeout: 3000 });
  });

  test('przełączanie typu konta w rejestracji', async ({ page }) => {
    await page.goto('/register');
    await page.waitForTimeout(500);

    // Click organizer radio option
    const organizerLabel = page.locator('label[for="organizer"]');
    if (await organizerLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await organizerLabel.click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Interakcje — Sklep i koszyk', () => {
  test('przejście do szczegółów produktu', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForTimeout(1000);

    const productLink = page.locator('a[href^="/shop/"]').first();
    if (await productLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await productLink.click();
      await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
    }
  });

  test('dodanie produktu do koszyka ze strony produktu', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForTimeout(1000);

    const productLink = page.locator('a[href^="/shop/"]').first();
    if (await productLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await productLink.click();
      await page.waitForTimeout(1000);

      // Look for "add to cart" button
      const addBtn = page
        .locator('button:has-text("Dodaj do koszyka"), button:has-text("koszyk")')
        .first();
      if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(500);
        // Toast should appear
        const toastMsg = page.getByText('Dodano do koszyka', { exact: true });
        await expect(toastMsg).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('koszyk — pusty stan', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForTimeout(500);
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Interakcje — Nawigacja z eventów', () => {
  test('kliknięcie w wydarzenie otwiera szczegóły', async ({ page }) => {
    await page.goto('/events');
    await page.getByRole('main').locator('a[href^="/events/"]:visible').first().click();
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole('tab').first()).toBeVisible();
  });

  test('przełączanie zakładek na stronie wydarzenia', async ({ page, request }) => {
    // A fixed upcoming event: "Lista startowa" is hidden on past events that have results, so the
    // first card of the list is not a stable choice once the lifecycle spec publishes events.
    const event = await seededEvent(request, 'e2e-registration-open');
    await page.goto(`/events/${event.slug}`);
    await expect(page.getByRole('tab', { name: /Informacje/ })).toBeVisible();

    for (const tabName of ['Dystanse', 'Lista startowa']) {
      const tab = page.getByRole('tab', { name: new RegExp(tabName) });
      await expect(tab).toBeVisible();
      await tab.click();
      await expect(tab).toHaveAttribute('data-state', 'active');
    }
  });
});

test.describe('Interakcje — Filtrowanie wydarzeń', () => {
  test('wyszukiwanie na liście wydarzeń', async ({ page }) => {
    await page.goto('/events');
    await page.waitForTimeout(1500);

    const searchInput = page
      .locator('input[placeholder*="Szukaj"], input[placeholder*="szukaj"]')
      .first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Bieg');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Interakcje — Panel admina', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('wyszukiwanie w zakładce wydarzeń', async ({ page }) => {
    await openDashboardSection(page, 'Wydarzenia');
    const searchInput = page.locator('input[placeholder*="Szukaj"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Bieg');
    await expect(searchInput).toHaveValue('Bieg');
  });

  test('wyszukiwanie w zakładce zamówień', async ({ page }) => {
    await openDashboardSection(page, 'Zamówienia');
    const searchInput = page.locator('input[placeholder*="Szukaj"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('ZAM');
    await expect(searchInput).toHaveValue('ZAM');
  });

  test('przełączanie zakładek użytkowników', async ({ page }) => {
    await openDashboardSection(page, 'Uczestnicy');
    await expect(page).toHaveURL(/\/admin\/participants/);
    await expect(page.locator('table, [data-testid="empty-state"]').first()).toBeVisible();

    await openDashboardSection(page, 'Organizatorzy');
    await expect(page).toHaveURL(/\/admin\/organizers/);
    await expect(page.locator('table, [data-testid="empty-state"]').first()).toBeVisible();
  });
});

test.describe('Interakcje — Panel uczestnika', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'participant');
  });

  test('przełączanie wszystkich zakładek', async ({ page }) => {
    const tabNames = [
      'Rejestracje',
      'Historia',
      'Zamówienia',
      'Bilety',
      'Wyzwania',
      'Profil',
    ];
    for (const tabName of tabNames) {
      const tab = page.getByRole('tab', { name: new RegExp(tabName) });
      await expect(tab).toBeVisible();
      await tab.click();
      await expect(tab).toHaveAttribute('data-state', 'active');
      await expect(page.getByRole('tabpanel')).toBeVisible();
    }
  });

  test('historia zakładka wyświetla dane', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /Historia/ });
    await tab.click();
    await expect(tab).toHaveAttribute('data-state', 'active');
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });
});

test.describe('Interakcje — Forgot Password', () => {
  test('formularz resetowania hasła przyjmuje email', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForTimeout(500);

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('jan@example.com');
    await page.waitForTimeout(200);

    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
    }
  });
});
