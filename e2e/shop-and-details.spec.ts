import { test, expect } from '../playwright-fixture';
import { API_URL } from './api';
import { loginAs } from './helpers';

test.describe('Shop & Cart Flow', () => {
  test('shop page lists products with prices', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    const productCards = page.locator('[class*="card"]');
    await expect(productCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('can navigate to product details', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForTimeout(500);
    const productLink = page.locator('a[href^="/shop/"]').first();
    if (await productLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await productLink.click();
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('cart shows empty state when no items', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    // Should show empty cart or 0 items
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// Every test above (and the registration tests in
// event-workflows.spec.ts) only checks an empty or blocked cart/registration
// state — none of them ever complete a real purchase. This is the one e2e
// test that drives a real shop checkout to a genuine terminal state against
// the real backend.
//
// Shop checkout has no gateway integration at all yet (see the server's
// `GET /shop/payment-methods` route, which literally comments "Left as-is
// until the payment work lands" above its hardcoded card/blik/bank list) —
// `createOrder()` persists the order directly, whichever payment method is
// picked. "bank" ("Przelew bankowy") is the closest match to "manual bank
// transfer" and, unlike event registration, needs no sandbox gateway
// credentials (that gap is tracked separately and currently blocked).
//
// A real *event* registration would have been the other option, but every event fixture actually reachable in this seeded
// environment turned out to be a dead end for it: the two events seeded
// with `paymentConfig.type: organizer_bank` (database/seeders/data/
// events.json — 'e-bank-transfer', 'e-mixed') are BOTH deterministically
// seeded with `registrationStatus: 'none'` ("nie otwarto jeszcze zapisow")
// by FixtureFieldFiller's `$index % 3 === 2` rule (confirmed against a live
// seeded database), and every currently-`open` event uses `admin_gateway`
// instead. The shop has no such landmine — `prod-korona-medal` is a plain,
// always-in-stock, non-service product seeded directly by 001_demo.sql (not
// subject to any date-based re-anchoring), which is what makes this the
// tractable path.
test.describe('Shop checkout via bank transfer', () => {
  test('completes a real order and reaches a pending-payment terminal state @smoke', async ({
    page,
    request,
  }) => {
    await loginAs(page, 'participant');

    // Product page: a plain reward item, no size choice, a single ("Zloty")
    // color pre-selected by ShopProductPage on load — nothing to fill in
    // before adding it to the cart.
    await page.goto('/shop/medal-korony-polmaratonow');
    const addToCartButton = page.getByRole('button', { name: 'Dodaj do koszyka' });
    await expect(addToCartButton).toBeEnabled({ timeout: 10000 });
    await addToCartButton.click();

    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: 'Koszyk' })).toBeVisible();

    // Delivery: "Odbior osobisty" (pickup) — free and, unlike
    // courier/paczkomat, needs no shipping address, keeping this test
    // focused on the payment path.
    await page.getByText('Odbior osobisty').click();

    // Payment: "Przelew bankowy" — see the file-level comment above for why
    // this is the real, always-reachable stand-in for the blocked
    // gateway-sandbox scope.
    await page.getByText('Przelew bankowy').click();

    const checkoutButton = page.getByRole('button', { name: 'Przejdź do płatności' });
    await expect(checkoutButton).toBeEnabled();
    await checkoutButton.click();

    // Real terminal state #1: the success page, built from the SERVER's
    // response to createOrder() (CartPage.handleCheckout only ever reads
    // `response.data`, never echoes back what the client sent) — a real,
    // server-generated order number.
    await expect(page).toHaveURL(/\/order-success$/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Zamówienie złożone!' })).toBeVisible();
    const orderNumberBadge = page.getByText(/^ORD-\d{4}-[A-F0-9]+$/);
    await expect(orderNumberBadge).toBeVisible();
    const orderNumber = (await orderNumberBadge.textContent())!.trim();
    await expect(page.getByText('Przelew bankowy')).toBeVisible();

    // Real terminal state #2, independent of the success page's own
    // client-held state: confirm this EXACT order (matched by its
    // server-generated order number, not just "some order") actually
    // persisted server-side with a real 'pending' status.
    //
    // This is a quick API check rather than the participant's own "Moje
    // zamówienia" tab because that tab is a dead end here: `GET
    // /shop/orders` (ParticipantDashboard's getOrders(user.id)) is gated by
    // `AuthMiddleware($jwt, $staffRoles)` on the server — admin/superadmin/
    // moderator only (routes.php) — so a participant's own request for
    // their own orders 403s and the tab silently renders "Brak zamówień"
    // (confirmed live: this is what actually happened when this test first
    // drove there). That is a real, separate bug this new test surfaced —
    // out of scope to fix here (it's a server-repo authorization gap,
    // not a client checkout-flow bug), but real, so it's asserted around
    // here rather than asserted ON, and reported alongside this ticket.
    const apiBaseUrl = API_URL;
    const adminLogin = await request.post(`${apiBaseUrl}/auth/login`, {
      data: { email: 'admin@zmierzymyczas.pl', password: 'demo1234' },
    });
    expect(adminLogin.ok()).toBeTruthy();
    const {
      data: { token: adminToken },
    } = await adminLogin.json();
    const ordersResponse = await request.get(`${apiBaseUrl}/shop/orders?userId=u-participant`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(ordersResponse.ok()).toBeTruthy();
    const { data: participantOrders } = await ordersResponse.json();
    const persistedOrder = participantOrders.find(
      (order: { orderNumber: string }) => order.orderNumber === orderNumber,
    );
    expect(persistedOrder).toBeTruthy();
    expect(persistedOrder.status).toBe('pending');
    expect(persistedOrder.paymentMethod.id).toBe('bank');

    // `GET /shop/orders` (the list just queried) doesn't hydrate line
    // items (OrderRepository::list() vs. ::find()) — fetch the single order
    // to confirm the actual purchased product persisted correctly too.
    const orderDetailResponse = await request.get(
      `${apiBaseUrl}/shop/orders/${persistedOrder.id}`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    expect(orderDetailResponse.ok()).toBeTruthy();
    const { data: orderDetail } = await orderDetailResponse.json();
    expect(orderDetail.items).toHaveLength(1);
    expect(orderDetail.items[0].productName).toBe('Medal Korony Polmaratonow');
  });
});

test.describe('Event Filtering & Details', () => {
  test('events page shows filter controls', async ({ page }) => {
    await page.goto('/events');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 5000 });
  });

  test('event details page shows tabs', async ({ page }) => {
    await page.goto('/events');
    await page.getByRole('main').locator('a[href^="/events/"]:visible').first().click();
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: /Informacje/ })).toBeVisible();
  });

  test('event details shows distances tab', async ({ page }) => {
    await page.goto('/events');
    await page.getByRole('main').locator('a[href^="/events/"]:visible').first().click();
    const distTab = page.getByRole('tab', { name: /Dystanse/ });
    await expect(distTab).toBeVisible();
    await distTab.click();
    await expect(distTab).toHaveAttribute('data-state', 'active');
  });
});

test.describe('Series Pages', () => {
  test('series list page shows series', async ({ page }) => {
    await page.goto('/series');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 5000 });
  });

  test('series details page loads', async ({ page }) => {
    await page.goto('/series');
    await page.waitForTimeout(1000);
    const seriesLink = page.locator('a[href^="/series/"]').first();
    if (await seriesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await seriesLink.click();
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Profile & Athlete Pages', () => {
  test('profile page loads', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('live results page loads', async ({ page }) => {
    await page.goto('/wyniki/live');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Info Pages', () => {
  test('about page loads', async ({ page }) => {
    await page.goto('/info/o-nas');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('insurance page loads', async ({ page }) => {
    await page.goto('/info/ubezpieczenie');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
