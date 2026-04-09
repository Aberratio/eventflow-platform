import { test, expect } from '../playwright-fixture';

async function loginAs(page: any, email: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'demo1234');
  await page.click('button[type="submit"]');
}

test.describe('Reset Password', () => {
  test('strona resetowania hasła się ładuje', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Event Registration Flow', () => {
  test('strona rejestracji na wydarzenie się ładuje', async ({ page }) => {
    // Find a valid event slug first
    await page.goto('/events');
    await page.waitForTimeout(1000);
    const eventLink = page.locator('a[href^="/events/"]').first();
    if (await eventLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      const href = await eventLink.getAttribute('href');
      if (href) {
        await page.goto(`${href}/register`);
        await page.waitForTimeout(500);
        await expect(page.locator('body')).not.toBeEmpty();
      }
    }
  });

  test('strona sukcesu rejestracji się ładuje', async ({ page }) => {
    await page.goto('/events');
    await page.waitForTimeout(1000);
    const eventLink = page.locator('a[href^="/events/"]').first();
    if (await eventLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      const href = await eventLink.getAttribute('href');
      if (href) {
        await page.goto(`${href}/register/success`);
        await page.waitForTimeout(500);
        await expect(page.locator('body')).not.toBeEmpty();
      }
    }
  });

  test('embed rejestracji się ładuje', async ({ page }) => {
    await page.goto('/events');
    await page.waitForTimeout(1000);
    const eventLink = page.locator('a[href^="/events/"]').first();
    if (await eventLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      const href = await eventLink.getAttribute('href');
      if (href) {
        await page.goto(`${href}/embed`);
        await page.waitForTimeout(500);
        await expect(page.locator('body')).not.toBeEmpty();
      }
    }
  });
});

test.describe('Order Success', () => {
  test('strona sukcesu zamówienia się ładuje', async ({ page }) => {
    await page.goto('/order-success');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Athlete Profile', () => {
  test('profil zawodnika się ładuje', async ({ page }) => {
    await page.goto('/athlete/u-1');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Challenge Details', () => {
  test('szczegóły wyzwania się ładują', async ({ page }) => {
    await page.goto('/challenges');
    await page.waitForTimeout(1000);
    const challengeLink = page.locator('a[href^="/challenges/"]').first();
    if (await challengeLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await challengeLink.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});

test.describe('Admin Sub-Pages (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  });

  test('edycja zamówienia się ładuje', async ({ page }) => {
    await page.goto('/admin/orders/order-1/edit');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('zarządzanie wydarzeniem admina się ładuje', async ({ page }) => {
    await page.goto('/admin/events/evt-1');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('edycja produktu się ładuje', async ({ page }) => {
    await page.goto('/admin/shop/products/prod-1/edit');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('edycja wyzwania się ładuje', async ({ page }) => {
    await page.goto('/admin/challenges/ch-1/edit');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('edycja partnera się ładuje', async ({ page }) => {
    await page.goto('/admin/partners/partner-1/edit');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('edycja strony CMS się ładuje', async ({ page }) => {
    await page.goto('/admin/pages/page-1/edit');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Organizer Sub-Pages (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'marek@timing.pl');
    await expect(page).toHaveURL(/\/organizer/, { timeout: 10000 });
  });

  test('zarządzanie wydarzeniem organizatora się ładuje', async ({ page }) => {
    await page.goto('/organizer/events/evt-1');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('edycja wydarzenia organizatora się ładuje', async ({ page }) => {
    await page.goto('/organizer/events/evt-1/edit');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Moderator Sub-Pages (authenticated)', () => {
  test('zarządzanie wydarzeniem moderatora się ładuje', async ({ page }) => {
    await loginAs(page, 'monika@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/moderator/, { timeout: 10000 });
    await page.goto('/moderator/events/evt-1');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Dynamic Info Pages', () => {
  test('strona o-nas się ładuje', async ({ page }) => {
    await page.goto('/info/o-nas');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('strona kontakt się ładuje', async ({ page }) => {
    await page.goto('/info/kontakt');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('strona oferta się ładuje', async ({ page }) => {
    await page.goto('/info/oferta');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('strona ubezpieczenie się ładuje', async ({ page }) => {
    await page.goto('/info/ubezpieczenie');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('nieistniejąca strona info nie crashuje', async ({ page }) => {
    await page.goto('/info/nieistniejaca-strona');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
