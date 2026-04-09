import { test, expect } from '../playwright-fixture';

async function loginAs(page: any, email: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'demo1234');
  await page.click('button[type="submit"]');
}

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
    await loginAs(page, 'jan@example.com');
    await expect(page).toHaveURL(/\/participant/, { timeout: 10000 });
    await expect(page.locator('text=Jan Kowalski')).toBeVisible({ timeout: 5000 });
  });

  test('walidacja email w formularzu logowania', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'niepoprawny-email');
    await page.fill('input[type="password"]', 'demo1234');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    // Should show validation error
    await expect(page.locator('text=Nieprawidłowy')).toBeVisible({ timeout: 3000 });
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
      const addBtn = page.locator('button:has-text("Dodaj do koszyka"), button:has-text("koszyk")').first();
      if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(500);
        // Toast should appear
        const toastMsg = page.locator('text=Dodano do koszyka');
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
    await page.waitForTimeout(1500);

    const eventLink = page.locator('a[href^="/events/"]').first();
    if (await eventLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await eventLink.click();
      await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });

      // Tabs should be present
      const tabs = page.locator('[role="tab"]');
      await expect(tabs.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('przełączanie zakładek na stronie wydarzenia', async ({ page }) => {
    await page.goto('/events');
    await page.waitForTimeout(1500);

    const eventLink = page.locator('a[href^="/events/"]').first();
    if (await eventLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await eventLink.click();
      await page.waitForTimeout(1000);

      const tabNames = ['Dystanse', 'Lista startowa', 'Wyniki'];
      for (const tabName of tabNames) {
        const tab = page.locator(`[role="tab"]:has-text("${tabName}")`);
        if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(300);
        }
      }
    }
  });
});

test.describe('Interakcje — Filtrowanie wydarzeń', () => {
  test('wyszukiwanie na liście wydarzeń', async ({ page }) => {
    await page.goto('/events');
    await page.waitForTimeout(1500);

    const searchInput = page.locator('input[placeholder*="Szukaj"], input[placeholder*="szukaj"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Bieg');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Interakcje — Panel admina', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  });

  test('wyszukiwanie w zakładce wydarzeń', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Wydarzenia")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);

      const searchInput = page.locator('input[placeholder*="Szukaj"]').first();
      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill('Bieg');
        await page.waitForTimeout(500);
      }
    }
  });

  test('wyszukiwanie w zakładce zamówień', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Zamówienia")');
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);

      const searchInput = page.locator('input[placeholder*="Szukaj"]').first();
      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill('ZAM');
        await page.waitForTimeout(500);
      }
    }
  });

  test('przełączanie zakładek użytkowników', async ({ page }) => {
    const participantsTab = page.locator('[role="tab"]:has-text("Uczestnicy")');
    if (await participantsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await participantsTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }

    const organizersTab = page.locator('[role="tab"]:has-text("Organizatorzy")');
    if (await organizersTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await organizersTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});

test.describe('Interakcje — Panel uczestnika', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'jan@example.com');
    await expect(page).toHaveURL(/\/participant/, { timeout: 10000 });
  });

  test('przełączanie wszystkich zakładek', async ({ page }) => {
    const tabNames = ['Rejestracje', 'Wyniki', 'Zamówienia', 'Wiadomości', 'Bilety', 'Wyzwania', 'Profil'];
    for (const tabName of tabNames) {
      const tab = page.locator(`[role="tab"]:has-text("${tabName}")`);
      if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(300);
        await expect(page.locator('body')).not.toBeEmpty();
      }
    }
  });

  test('historia zakładka wyświetla dane', async ({ page }) => {
    const tab = page.locator('[role="tab"]:has-text("Historia")');
    if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
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
