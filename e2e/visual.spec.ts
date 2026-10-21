import { test, expect } from '../playwright-fixture';

async function loginAs(page: any, email: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'demo1234');
  await page.click('button[type="submit"]');
}

// The baselines include the cookie banner, so these specs must not pre-accept it.
test.use({ preAcceptCookies: false });

test.describe('Visual Snapshots - Public Pages', () => {
  test('strona główna — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('home-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('strona główna — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('home-mobile.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('strona logowania — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('login-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('strona logowania — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('login-mobile.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('strona rejestracji — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/register');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('register-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('lista wydarzeń — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/events');
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot('events-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('lista wydarzeń — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/events');
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot('events-mobile.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('sklep — desktop', async ({ page }) => {
    test.fixme(
      true,
      'quarantined: baseline differs on a fresh seed (external product and challenge images, 22% and 6% of pixels)',
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/shop');
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot('shop-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('sklep — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/shop');
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot('shop-mobile.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('seria — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/series');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('series-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('wyzwania — desktop', async ({ page }) => {
    test.fixme(
      true,
      'quarantined: baseline differs on a fresh seed (external product and challenge images, 22% and 6% of pixels)',
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/challenges');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('challenges-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('koszyk pusty — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/cart');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('cart-empty-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('strona 404 — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/nonexistent-page');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('404-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('strona 500 — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/500');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('500-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });
});

test.describe('Visual Snapshots - Dashboards', () => {
  test('panel uczestnika — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAs(page, 'jan@example.com');
    await expect(page).toHaveURL(/\/participant/, { timeout: 10000 });
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot('participant-dashboard-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('panel uczestnika — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAs(page, 'jan@example.com');
    await expect(page).toHaveURL(/\/participant/, { timeout: 10000 });
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot('participant-dashboard-mobile.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('panel organizatora — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAs(page, 'marek@timing.pl');
    await expect(page).toHaveURL(/\/organizer/, { timeout: 10000 });
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot('organizer-dashboard-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('panel moderatora — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAs(page, 'monika@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/moderator/, { timeout: 10000 });
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot('moderator-dashboard-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('panel admina — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAs(page, 'admin@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot('admin-dashboard-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('panel admina — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAs(page, 'admin@zmierzymyczas.pl');
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot('admin-dashboard-mobile.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });
});
