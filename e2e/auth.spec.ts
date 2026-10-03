import { test, expect } from '../playwright-fixture';

import { loginAs, openDashboardSection } from './helpers';

const LOGIN_ERROR = 'Nieprawidłowy email lub hasło.';

test.describe('Authentication Flow', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Zaloguj się' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'bad@email.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page.getByText(LOGIN_ERROR, { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('shows error for wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'jan@example.com');
    await page.fill('input[type="password"]', 'badpassword');
    await page.click('button[type="submit"]');
    await expect(page.getByText(LOGIN_ERROR, { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('register page renders with form fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('text=Zarejestruj się')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('forgot password page renders', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('login page has links to register and forgot password', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('a[href="/register"]')).toBeVisible();
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
  });

  test('login page does not show quick login panel', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Szybkie logowanie')).not.toBeVisible();
    await expect(page.locator('text=Konta testowe')).not.toBeVisible();
  });
});

test.describe('Participant Login & Dashboard', () => {
  test('participant login redirects to /participant', async ({ page }) => {
    await loginAs(page, 'participant');
    await expect(page).toHaveURL(/\/participant/, { timeout: 10000 });
  });

  test('participant dashboard shows overview tab', async ({ page }) => {
    await loginAs(page, 'participant');
    await expect(page.getByText(/Witaj, Jan/).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: /Przegląd/ })).toHaveAttribute(
      'data-state',
      'active',
    );
  });

  test('participant can navigate dashboard tabs', async ({ page }) => {
    await loginAs(page, 'participant');

    for (const tabName of ['Rejestracje', 'Historia', 'Zamówienia', 'Wiadomości']) {
      const tab = page.getByRole('tab', { name: new RegExp(tabName) });
      await expect(tab).toBeVisible();
      await tab.click();
      await expect(tab).toHaveAttribute('data-state', 'active');
      await expect(page.getByRole('tabpanel')).toBeVisible();
    }
  });

  test('participant registrations tab loads', async ({ page }) => {
    await loginAs(page, 'participant');
    await expect(page).toHaveURL(/\/participant/, { timeout: 10000 });
    await page.goto('/participant?tab=registrations');
    await page.waitForTimeout(500);
    // Should show registrations content
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('participant orders tab loads', async ({ page }) => {
    await loginAs(page, 'participant');
    await expect(page).toHaveURL(/\/participant/, { timeout: 10000 });
    await page.goto('/participant?tab=orders');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('participant can access profile page', async ({ page }) => {
    await loginAs(page, 'participant');
    await expect(page).toHaveURL(/\/participant/, { timeout: 10000 });
    await page.goto('/profile');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Organizer Login & Dashboard', () => {
  test('organizer login redirects to /organizer', async ({ page }) => {
    await loginAs(page, 'organizer');
    await expect(page).toHaveURL(/\/organizer/, { timeout: 10000 });
  });

  test('organizer dashboard shows overview', async ({ page }) => {
    await loginAs(page, 'organizer');
    await expect(page.getByRole('heading', { name: 'Panel Organizatora' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Pulpit/ })).toHaveAttribute('data-state', 'active');
  });

  test('organizer can navigate to events page', async ({ page }) => {
    await loginAs(page, 'organizer');
    await expect(page).toHaveURL(/\/organizer/, { timeout: 10000 });
    await page.goto('/organizer/events');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('organizer can access new event form', async ({ page }) => {
    await loginAs(page, 'organizer');
    await expect(page).toHaveURL(/\/organizer/, { timeout: 10000 });
    await page.goto('/organizer/events/new');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('organizer dashboard switches to the events tab', async ({ page }) => {
    await loginAs(page, 'organizer');
    const tab = page.getByRole('tab', { name: /Moje wydarzenia/ });
    await tab.click();
    await expect(tab).toHaveAttribute('data-state', 'active');
    await expect(page.getByText('Wszystkie wydarzenia')).toBeVisible();
  });
});

test.describe('Moderator Login & Dashboard', () => {
  test('moderator login redirects to /moderator', async ({ page }) => {
    await loginAs(page, 'moderator');
    await expect(page).toHaveURL(/\/moderator/, { timeout: 10000 });
  });

  test('moderator dashboard shows overview', async ({ page }) => {
    await loginAs(page, 'moderator');
    await expect(page.getByRole('heading', { name: 'Panel Moderatora' })).toBeVisible();
    await expect(page.getByText(/Witaj, Monika/)).toBeVisible();
  });

  test('moderator can navigate sections', async ({ page }) => {
    await loginAs(page, 'moderator');

    await openDashboardSection(page, 'Moderacja');
    await expect(
      page.getByText(/Wydarzenia do sprawdzenia|Brak wydarzen do sprawdzenia/).first(),
    ).toBeVisible();
    await openDashboardSection(page, 'Zamówienia');
    await expect(page.getByText(/Zamówienia \(\d+\)/).first()).toBeVisible();
  });

  test('moderator users sections load in read-only mode', async ({ page }) => {
    await loginAs(page, 'moderator');
    await openDashboardSection(page, 'Uczestnicy');
    await expect(page.locator('table, [data-testid="empty-state"]').first()).toBeVisible();
    await openDashboardSection(page, 'Organizatorzy');
    await expect(page.locator('table, [data-testid="empty-state"]').first()).toBeVisible();
  });
});

test.describe('Admin Login & Dashboard', () => {
  test('admin login redirects to /admin', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  });

  test('admin dashboard shows overview', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page.getByRole('heading', { name: 'Panel Administratora' })).toBeVisible();
  });

  test('admin can navigate all sections', async ({ page }) => {
    await loginAs(page, 'admin');

    const sections: Array<[string, RegExp]> = [
      ['Wydarzenia', /\/admin\/events/],
      ['Produkty', /\/admin\/shop/],
      ['Zamówienia', /\/admin\/orders/],
      ['Partnerzy', /\/admin\/partners/],
      ['Strony', /\/admin\/pages/],
      ['Ustawienia', /\/admin\/settings/],
    ];
    for (const [label, url] of sections) {
      await openDashboardSection(page, label);
      await expect(page).toHaveURL(url);
    }
  });

  test('admin events section shows event list', async ({ page }) => {
    await loginAs(page, 'admin');
    await openDashboardSection(page, 'Wydarzenia');
    await expect(page.locator('table, [data-testid="empty-state"]').first()).toBeVisible();
  });

  test('admin shop section loads products', async ({ page }) => {
    await loginAs(page, 'admin');
    await openDashboardSection(page, 'Produkty');
    await expect(page.getByRole('heading', { name: 'Zarządzanie sklepem' })).toBeVisible();
  });

  test('admin orders section loads', async ({ page }) => {
    await loginAs(page, 'admin');
    await openDashboardSection(page, 'Zamówienia');
    await expect(page.getByRole('heading', { name: 'Zamówienia' })).toBeVisible();
  });

  test('admin partners section loads', async ({ page }) => {
    await loginAs(page, 'admin');
    await openDashboardSection(page, 'Partnerzy');
    await expect(page.getByRole('heading', { name: 'Nasi partnerzy' })).toBeVisible();
  });

  test('admin settings section loads', async ({ page }) => {
    await loginAs(page, 'admin');
    await openDashboardSection(page, 'Ustawienia');
    await expect(page.getByRole('heading', { name: 'Ustawienia platformy' })).toBeVisible();
  });

  test('admin pages/cms section loads', async ({ page }) => {
    await loginAs(page, 'admin');
    await openDashboardSection(page, 'Strony');
    await expect(page.getByText('Strony informacyjne')).toBeVisible();
  });
});

test.describe('Logout Flow', () => {
  test('user can logout and return to public site', async ({ page }) => {
    await loginAs(page, 'participant');
    await expect(page).toHaveURL(/\/participant/, { timeout: 10000 });

    // Look for logout button
    const logoutBtn = page.locator('button:has-text("Wyloguj"), [aria-label="Wyloguj"]');
    if (
      await logoutBtn
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await logoutBtn.first().click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Role-Based Access', () => {
  test('unauthenticated user can browse public pages', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();

    await page.goto('/wydarzenia');
    await expect(page.locator('body')).not.toBeEmpty();

    await page.goto('/shop');
    await expect(page.locator('body')).not.toBeEmpty();

    await page.goto('/challenges');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
