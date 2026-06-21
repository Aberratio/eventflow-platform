import { test, expect } from '../playwright-fixture';

async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@zmierzymyczas.pl');
  await page.fill('input[type="password"]', 'demo1234');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
}

async function clickTab(page: any, label: string) {
  const tab = page.locator(`[role="tab"]:has-text("${label}")`);
  await expect(tab).toBeVisible({ timeout: 5000 });
  await tab.click();
  // Wait for tab panel content to stabilise
  await page.waitForLoadState('networkidle');
}

test.describe('Admin Dashboard – authentication', () => {
  test('unauthenticated user is redirected from /admin to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });

  test('admin can log in and reach dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.locator('text=Admin').first()).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/admin/);
  });
});

test.describe('Admin Dashboard – overview tab', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('overview tab shows at least one stat card or heading', async ({ page }) => {
    // The overview tab is the default landing tab
    const statsOrHeading = page.locator('[data-testid="stat-card"], h2, h3').first();
    await expect(statsOrHeading).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Admin Dashboard – events tab', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('events tab renders a table or list of events', async ({ page }) => {
    await clickTab(page, 'Wydarzenia');
    // Expect either a table row, a list item, or an empty-state element
    const content = page.locator('table, [role="row"], [data-testid="empty-state"], .event-list-row').first();
    await expect(content).toBeVisible({ timeout: 8000 });
  });

  test('events tab contains a search or filter control', async ({ page }) => {
    await clickTab(page, 'Wydarzenia');
    const searchOrFilter = page.locator('input[type="search"], input[placeholder*="Szukaj"], input[placeholder*="szukaj"]').first();
    await expect(searchOrFilter).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Admin Dashboard – shop tab', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('shop tab renders product list or empty state', async ({ page }) => {
    await clickTab(page, 'Sklep');
    const content = page.locator('table, [role="row"], [data-testid="empty-state"], h2, h3').first();
    await expect(content).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Admin Dashboard – orders tab', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('orders tab renders a list or empty state', async ({ page }) => {
    await clickTab(page, 'Zamówienia');
    const content = page.locator('table, [role="row"], [data-testid="empty-state"], h2, h3').first();
    await expect(content).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Admin Dashboard – users tabs', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('participants subtab shows user table or empty state', async ({ page }) => {
    await clickTab(page, 'Uczestnicy');
    const content = page.locator('table, [role="row"], [data-testid="empty-state"]').first();
    await expect(content).toBeVisible({ timeout: 8000 });
  });

  test('organizers subtab shows organizer list or empty state', async ({ page }) => {
    await clickTab(page, 'Organizatorzy');
    const content = page.locator('table, [role="row"], [data-testid="empty-state"]').first();
    await expect(content).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Admin Dashboard – moderation tab', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('moderation tab renders heading or queue list', async ({ page }) => {
    await clickTab(page, 'Moderacja');
    const content = page.locator('h2, h3, [data-testid="empty-state"], [role="row"]').first();
    await expect(content).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Admin Dashboard – challenges tab', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('challenges tab renders content', async ({ page }) => {
    await clickTab(page, 'Wyzwania');
    const content = page.locator('table, [role="row"], [data-testid="empty-state"], h2, h3').first();
    await expect(content).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Admin Dashboard – partners tab', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('partners tab renders list or empty state', async ({ page }) => {
    await clickTab(page, 'Partnerzy');
    const content = page.locator('[data-testid="empty-state"], .partner-card, table, h2').first();
    await expect(content).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Admin Dashboard – CMS pages tab', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('pages tab renders page list or empty state', async ({ page }) => {
    await clickTab(page, 'Strony');
    const content = page.locator('table, [role="row"], [data-testid="empty-state"], h2').first();
    await expect(content).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Admin Dashboard – profile tab', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('profile tab shows admin email or name', async ({ page }) => {
    await clickTab(page, 'Profil');
    // Profile tab should show the logged-in admin's info
    const emailOrName = page.locator('text=admin@zmierzymyczas.pl, text=Admin').first();
    await expect(emailOrName).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Admin Sub-Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('new product page renders a form', async ({ page }) => {
    await page.goto('/admin/shop/products/new');
    await page.waitForLoadState('networkidle');
    const form = page.locator('form, input, [role="form"]').first();
    await expect(form).toBeVisible({ timeout: 8000 });
  });

  test('new page editor renders a form', async ({ page }) => {
    await page.goto('/admin/pages/new');
    await page.waitForLoadState('networkidle');
    const form = page.locator('form, input, [role="form"]').first();
    await expect(form).toBeVisible({ timeout: 8000 });
  });

  test('new challenge page renders a form', async ({ page }) => {
    await page.goto('/admin/challenges/new');
    await page.waitForLoadState('networkidle');
    const form = page.locator('form, input, [role="form"]').first();
    await expect(form).toBeVisible({ timeout: 8000 });
  });

  test('new partner page renders a form', async ({ page }) => {
    await page.goto('/admin/partners/new');
    await page.waitForLoadState('networkidle');
    const form = page.locator('form, input, [role="form"]').first();
    await expect(form).toBeVisible({ timeout: 8000 });
  });

  test('admin page title is visible on dashboard', async ({ page }) => {
    await expect(page.locator('h1, h2').filter({ hasText: /Admin|Dashboard|Panel/i }).first()).toBeVisible({ timeout: 5000 });
  });
});
