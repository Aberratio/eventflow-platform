import { test, expect, skipCookieBanner } from '../support/fixtures';
import { FRONT } from '../support/env';

function frameAncestorsOf(csp: string | undefined): string | undefined {
  for (const part of (csp ?? '').split(';')) {
    const [name, ...rest] = part.trim().split(/\s+/);
    if (name?.toLowerCase() === 'frame-ancestors') return rest.join(' ');
  }
  return undefined;
}

test.describe('embed views @functional', () => {
  test('embed route may be framed by any site: frame-ancestors * and no X-Frame-Options @smoke', async ({
    request,
    seed,
  }) => {
    test.skip(seed.upcoming.length === 0, 'brak nadchodzącego wydarzenia w API');
    const slug = seed.upcoming[0].slug;
    const res = await request.get(`/events/${slug}/embed`);
    expect(res.status(), 'embed status').toBe(200);
    const h = res.headers();
    expect(frameAncestorsOf(h['content-security-policy']), 'embed CSP frame-ancestors').toBe('*');
    expect(h['x-frame-options'], 'embed must not send X-Frame-Options').toBeUndefined();
  });

  test('regular event page stays unframable: frame-ancestors self and X-Frame-Options present', async ({
    request,
    seed,
  }) => {
    test.skip(seed.upcoming.length === 0, 'brak nadchodzącego wydarzenia w API');
    const slug = seed.upcoming[0].slug;
    const res = await request.get(`/events/${slug}`);
    expect(res.status(), 'event page status').toBe(200);
    const h = res.headers();
    expect(frameAncestorsOf(h['content-security-policy']), 'event page CSP frame-ancestors').toBe(
      "'self'",
    );
    expect(h['x-frame-options'], 'event page X-Frame-Options').toMatch(/^(SAMEORIGIN|DENY)$/i);
  });

  test('embed iframe on a foreign page shows the event name', async ({ page, seed }) => {
    test.skip(seed.upcoming.length === 0, 'brak nadchodzącego wydarzenia w API');
    const ev = seed.upcoming[0];
    await skipCookieBanner(page);
    await page.setContent(
      `<iframe title="embed" width="900" height="1200" src="${FRONT}/events/${ev.slug}/embed"></iframe>`,
    );
    const frame = page.frameLocator('iframe[title="embed"]');
    await expect(frame.getByText(ev.name, { exact: false }).first()).toBeVisible();
  });

  test('embed registration view renders a form or login prompt in an iframe, not a blank screen', async ({
    page,
    request,
    seed,
  }) => {
    const ev = seed.openForRegistration[0] ?? seed.upcoming[0];
    test.skip(!ev, 'brak wydarzenia z otwartą rejestracją ani nadchodzącego w API');

    const res = await request.get(`/embed/event/${ev.id}/register`);
    expect(res.status(), 'embed register status').toBe(200);
    expect(
      frameAncestorsOf(res.headers()['content-security-policy']),
      'embed register CSP frame-ancestors',
    ).toBe('*');
    expect(res.headers()['x-frame-options'], 'embed register X-Frame-Options').toBeUndefined();

    await skipCookieBanner(page);
    await page.setContent(
      `<iframe title="register" width="900" height="1200" src="${FRONT}/embed/event/${ev.id}/register"></iframe>`,
    );
    const frame = page.frameLocator('iframe[title="register"]');
    await expect(frame.locator('#root > *').first(), 'embed app rendered into #root').toBeVisible();
    await expect(frame.locator('body')).toContainText(/zaloguj|rejestr|e-mail|formularz|imi[ęe]/i);
  });

  test('regular event page is blocked inside a foreign iframe while the embed one loads @security', async ({
    page,
    seed,
  }) => {
    test.skip(seed.upcoming.length === 0, 'brak nadchodzącego wydarzenia w API');
    const ev = seed.upcoming[0];
    await skipCookieBanner(page);
    await page.setContent(
      `<iframe title="embed" width="900" height="600" src="${FRONT}/events/${ev.slug}/embed"></iframe>` +
        `<iframe title="plain" width="900" height="600" src="${FRONT}/events/${ev.slug}"></iframe>`,
    );

    // Control: the embed frame really renders, so the blocked frame below is not just an empty slow frame.
    await expect(
      page.frameLocator('iframe[title="embed"]').getByText(ev.name, { exact: false }).first(),
    ).toBeVisible();

    await page.waitForLoadState('networkidle');
    const plain = page.frameLocator('iframe[title="plain"]');
    await expect(
      plain.locator('#root'),
      'app must not render inside the blocked frame',
    ).toHaveCount(0);
    await expect(
      plain.getByText(ev.name, { exact: false }),
      'event name must not show in the blocked frame',
    ).toHaveCount(0);
  });
});
