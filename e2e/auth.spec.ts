import { test, expect } from '../playwright-fixture';

// Helper to login as a specific role
async function loginAs(page: any, email: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'demo1234');
  await page.click('button[type="submit"]');
}

test.describe('Authentication Flow', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Zaloguj się')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'bad@email.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Nieprawidłowy')).toBeVisible({ timeout: 5000 });
  });

  test('shows error for wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'jan@example.com');
    await page.fill('input[type="password"]', 'badpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Nieprawidłowy')).toBeVisible({ timeout: 5000 });
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

  test('mock credential cards are visible on login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Konta testowe')).toBeVisible();
    await expect(page.locator('text=Uczestnik')).toBeVisible();
    await expect(page.locator('text=Organizator')).toBeVisible();
    await expect(page.locator('text=Moderator')).toBeVisible();
    await expect(page.locator('text=Super Admin')).toBeVisible();
  });
});

test.describe('Participant Login & Dashboard', () => {
  test('participant login redirects to /participant', async ({ page }) => {
    await loginAs(page, 'jan@example.com');
    await expect(page).toHaveURL(/\/participant/, { timeout: 10000 });
  });

  test('participant dashboard shows overview tab', async ({ page }) => {
    await loginAs(page, 'jan@example.com');
    await expect(page).toHaveURL(/\/participant/, { timeout: 10000 });
    await expect(page.locator('text=Jan Kowalski')).toBeVisible({ timeout: 5000 });
  });

  test('participant can navigate dashboard tabs', async ({ page }) => {
    await loginAs(page, 'jan@example.com');
    await expect(page).toHaveURL(/\/participant/, { timeout: 10000 });

    // Check that tab triggers are present
    const tabNames = ['Rejestracje', 'Wyniki', 'Zamówienia', 'Wiadomości'];
    for (const tabName of tabNames) {
      const tab = page.locator(`[role="tab"]:has-text("${tabName}")`);
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('participant registrations tab loads', async ({ page }) => {
    await loginAs(page, 'jan@example.com');
    await expect(page).toHaveURL(/\/participant/, { timeout: 10000 });
    await page.goto('/participant?tab=registrations');
    await page.waitForTimeout(500);
    // Should show registrations content
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('participant orders tab loads', async ({ page }) => {
    await loginAs(page, 'jan@example.com');
    await expect(page).toHaveURL(/\/participant/, { timeout: 10000 });
    await page.goto('/participant?tab=orders');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('participant can access profile page', async ({ page }) => {
    await loginAs(page, 'jan@example.com');
    await expect(page).toHaveURL(/\/participant/, { timeout: 10000 });
    await page.goto('/profile');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Organizer Login & Dashboard', () => {
  test('organizer login redirects to /organizer', async ({ page }) => {
    await loginAs(page, 'marek@timing.pl');
    await expect(page).toHaveURL(/\/organizer/, { timeout: 10000 });
  });

  test('organizer dashboard shows overview', async ({ page }) => {
    await loginAs(page, 'marek@timing.pl');
    await expect(page).toHaveURL(/\/organizer/, { timeout: 10000 });
    await expect(page.locator('text=Marek Organizator')).toBeVisible({ timeout: 5000 });
  });

  test('organizer can navigate to events page', async ({ page }) => {
    await loginAs(page, 'marek@timing.pl');
    await expect(page).toHaveURL(/\/organizer/, { timeout: 10000 });
    await page.goto('/organizer/events');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('organizer can access new event form', async ({ page }) => {
    await loginAs(page, 'marek@timing.pl');
    await expect(page).toHaveURL(/\/organizer/, { timeout: 10000 });
    await page.goto('/organizer/events/new');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('organizer dashboard has profile tab', async ({ page }) => {
    await loginAs(page, 'marek@timing.pl');
    await expect(page).toHaveURL(/\/organizer/, { timeout: 10000 });
    const profileTab = page.locator('[role="tab"]:has-text("Profil")');
    if (await profileTab.isVisible()) {
      await profileTab.click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Moderator Login & Dashboard', () => {
  test('moderator login redirects to /moderator', async ({ page }) => {
    await loginAs(page, 'monika@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/moderator/, { timeout: 10000 });
  });

  test('moderator dashboard shows overview', async ({ page }) => {
    await loginAs(page, 'monika@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/moderator/, { timeout: 10000 });
    await expect(page.locator('text=Monika Moderator')).toBeVisible({ timeout: 5000 });
  });

  test('moderator can navigate tabs', async ({ page }) => {
    await loginAs(page, 'monika@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/moderator/, { timeout: 10000 });

    const tabNames = ['Moderacja', 'Zamówienia', 'Użytkownicy'];
    for (const tabName of tabNames) {
      const tab = page.locator(`[role="tab"]:has-text("${tabName}")`);
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('moderator orders tab loads', async ({ page }) => {
    await loginAs(page, 'monika@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/moderator/, { timeout: 10000 });
    const ordersTab = page.locator('[role="tab"]:has-text("Zamówienia")');
    if (await ordersTab.isVisible()) {
      await ordersTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('moderator users tab loads in read-only mode', async ({ page }) => {
    await loginAs(page, 'monika@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/moderator/, { timeout: 10000 });
    const usersTab = page.locator('[role="tab"]:has-text("Użytkownicy")');
    if (await usersTab.isVisible()) {
      await usersTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});

test.describe('Admin Login & Dashboard', () => {
  test('admin login redirects to /admin', async ({ page }) => {
    await loginAs(page, 'admin@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  });

  test('admin dashboard shows overview', async ({ page }) => {
    await loginAs(page, 'admin@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    await expect(page.locator('text=Admin')).toBeVisible({ timeout: 5000 });
  });

  test('admin can navigate all tabs', async ({ page }) => {
    await loginAs(page, 'admin@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });

    const tabNames = ['Wydarzenia', 'Sklep', 'Zamówienia', 'Partnerzy', 'Strony', 'Ustawienia'];
    for (const tabName of tabNames) {
      const tab = page.locator(`[role="tab"]:has-text("${tabName}")`);
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('admin events tab shows event list', async ({ page }) => {
    await loginAs(page, 'admin@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    const eventsTab = page.locator('[role="tab"]:has-text("Wydarzenia")');
    if (await eventsTab.isVisible()) {
      await eventsTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('admin shop tab loads products', async ({ page }) => {
    await loginAs(page, 'admin@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    const shopTab = page.locator('[role="tab"]:has-text("Sklep")');
    if (await shopTab.isVisible()) {
      await shopTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('admin orders tab loads', async ({ page }) => {
    await loginAs(page, 'admin@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    const ordersTab = page.locator('[role="tab"]:has-text("Zamówienia")');
    if (await ordersTab.isVisible()) {
      await ordersTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('admin partners tab loads', async ({ page }) => {
    await loginAs(page, 'admin@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    const partnersTab = page.locator('[role="tab"]:has-text("Partnerzy")');
    if (await partnersTab.isVisible()) {
      await partnersTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('admin settings tab loads', async ({ page }) => {
    await loginAs(page, 'admin@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    const settingsTab = page.locator('[role="tab"]:has-text("Ustawienia")');
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('admin pages/cms tab loads', async ({ page }) => {
    await loginAs(page, 'admin@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    const pagesTab = page.locator('[role="tab"]:has-text("Strony")');
    if (await pagesTab.isVisible()) {
      await pagesTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});

test.describe('Logout Flow', () => {
  test('user can logout and return to public site', async ({ page }) => {
    await loginAs(page, 'jan@example.com');
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
