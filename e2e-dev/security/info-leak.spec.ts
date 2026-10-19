import type { APIRequestContext, APIResponse } from '@playwright/test';
import { test, expect } from '../support/fixtures';
import { call } from '../support/api';
import { API } from '../support/env';

const API_ROOT = API.replace(/\/api\/v1$/, '');
const ts = Date.now().toString(36);

/** Things that must never appear in an error body: traces, file paths, PHP classes, SQL, versions. */
const LEAK_RE = /stack ?trace|"trace"|#\d+ [^\n]*\.php|\.php\b|\/var\/www|\/home\/\w+|[A-Z]:\\\\|vendor\/|Slim\\|Psr\\|ZmierzymyCzas\\|PDOException|SQLSTATE|mysqli?|syntax error|Fatal error|Uncaught|Warning: |Notice: |Deprecated: |on line \d+|APP_DEBUG|DB_PASSWORD/i;

async function body(res: APIResponse): Promise<string> {
  return res.text().catch(() => '');
}

function expectNoLeak(text: string, where: string): void {
  const m = LEAK_RE.exec(text);
  expect(m ? `${where}: leaked "${m[0]}" in ${text.slice(Math.max(0, m.index - 40), m.index + 80)}` : '', where).toBe('');
}

/** Raw request that tolerates 429 (used for the rate-limit probe) instead of throwing. */
async function rawPost(request: APIRequestContext, path: string, data: unknown): Promise<APIResponse> {
  return request.fetch(`${API}${path}`, { method: 'POST', data, headers: { Accept: 'application/json' }, failOnStatusCode: false });
}

test.describe('Information leak in errors @security', () => {
  test('404, 405, broken JSON and a very long parameter reveal no internals @smoke', async ({ request }) => {
    const long = 'a'.repeat(3000);
    const probes: Array<{ name: string; res: APIResponse }> = [];
    probes.push({ name: '404 unknown route', res: await call(request, 'GET', `/qa-nope-${ts}`) });
    probes.push({ name: '404 unknown slug', res: await call(request, 'GET', `/events/slug/qa-nope-${ts}`) });
    probes.push({ name: '405 DELETE /health', res: await call(request, 'DELETE', '/health') });
    probes.push({
      name: 'broken JSON',
      res: await call(request, 'POST', '/auth/login', { headers: { 'Content-Type': 'application/json' }, data: `{"email":"qa-leak-${ts}@example.com",` }),
    });
    probes.push({ name: 'very long slug', res: await call(request, 'GET', `/events/slug/${long}`) });
    probes.push({ name: 'garbage query', res: await call(request, 'GET', '/events', { params: { pageSize: "1' OR '1'='1", page: '-1;DROP TABLE x' } }) });

    for (const { name, res } of probes) {
      expect(res.status(), `${name} status`).toBeLessThan(500);
      expectNoLeak(await body(res), name);
      const h = res.headers();
      test.info().annotations.push({ type: 'headers', description: `${name}: server=${h['server'] ?? '-'} x-powered-by=${h['x-powered-by'] ?? '-'}` });
      expect(h['x-powered-by'] ?? '', `${name} x-powered-by must not disclose the PHP version`).not.toMatch(/\d/);
      expect(h['server'] ?? '', `${name} server header must not disclose a version`).not.toMatch(/\d+\.\d+/);
    }
  });

  test('error body for a missing route is not an HTML/PHP error page', async ({ request }) => {
    const res = await call(request, 'GET', `/qa-nope-${ts}`);
    expect(res.headers()['content-type'] ?? '').toContain('application/json');
    const text = await body(res);
    expect(text).not.toMatch(/<html|<body|Whoops|Slim Application Error/i);
  });
});

test.describe('Account enumeration @security', () => {
  test('password reset answers identically for a known-looking and an unknown address', async ({ request }) => {
    const known = await call(request, 'POST', '/auth/password/reset', { data: { email: 'jan@example.com' } });
    const unknown = await call(request, 'POST', '/auth/password/reset', { data: { email: `qa-nobody-${ts}@example.com` } });
    expect(known.status()).toBe(unknown.status());
    expect(await known.text()).toBe(await unknown.text());
    expect(known.status()).toBeLessThan(500);
  });

  test('registration with an invalid password: responses for existing and new e-mail are recorded', async ({ request }) => {
    const existing = await call(request, 'POST', '/auth/register', { data: { email: 'jan@example.com', password: 'short', firstName: 'QA', lastName: 'Probe' } });
    const fresh = await call(request, 'POST', '/auth/register', { data: { email: `qa-fresh-${ts}@example.com`, password: 'short', firstName: 'QA', lastName: 'Probe' } });
    const a = { status: existing.status(), body: await existing.text() };
    const b = { status: fresh.status(), body: await fresh.text() };
    test.info().annotations.push({ type: 'register-existing', description: `${a.status} ${a.body.slice(0, 200)}` });
    test.info().annotations.push({ type: 'register-new', description: `${b.status} ${b.body.slice(0, 200)}` });
    expect(a.status).toBeLessThan(500);
    expect(b.status).toBeLessThan(500);
    expect(a.body, 'a taken e-mail must not be disclosed (409 email_taken = enumeration)').not.toMatch(/email_taken|już istnieje|zajęty|already/i);
    expect({ status: a.status, body: a.body }).toEqual({ status: b.status, body: b.body });
  });
});

test.describe('Dev and webhook endpoints @security', () => {
  test('/dev/seed-event without a token and with a garbage token is refused', async ({ request }) => {
    const anon = await call(request, 'POST', '/dev/seed-event', { data: {} });
    const junk = await call(request, 'POST', '/dev/seed-event', { data: {}, token: 'garbage.token.value' });
    for (const [name, r] of [['no token', anon], ['garbage token', junk]] as const) {
      expect([401, 403, 404], `${name} status`).toContain(r.status());
      expectNoLeak(await body(r), name);
    }
  });

  for (const hook of ['tpay', 'paynow']) {
    test(`/webhooks/${hook} without signature and with empty body -> 4xx, not 500`, async ({ request }) => {
      const noSig = await call(request, 'POST', `/webhooks/${hook}`, { data: { transactionId: 'x', status: 'CONFIRMED' } });
      const empty = await call(request, 'POST', `/webhooks/${hook}`);
      for (const [name, r] of [['no signature', noSig], ['empty body', empty]] as const) {
        expect(r.status(), `${hook} ${name}`).toBeGreaterThanOrEqual(400);
        expect(r.status(), `${hook} ${name}`).toBeLessThan(500);
        expectNoLeak(await body(r), `${hook} ${name}`);
      }
    });
  }

  test('path traversal on /uploads never returns file content', async ({ request }) => {
    const variants = [
      `${API}/uploads/..%2f..%2f.env`,
      `${API}/uploads/..%2f..%2f..%2fcomposer.json`,
      `${API}/uploads/..%5c..%5c.env`,
      `${API_ROOT}/uploads/..%2f..%2f.env`,
    ];
    for (const url of variants) {
      const res = await request.fetch(url, { failOnStatusCode: false });
      const text = await body(res);
      expect(res.status(), url).toBe(404);
      expect(text, url).not.toMatch(/APP_|DB_(HOST|PASSWORD|USER)|JWT_SECRET|"require"\s*:|"name"\s*:\s*"/);
    }
  });
});

test.describe('Cookies and privacy @security', () => {
  const TRACKING_COOKIE = /^(_ga|_gid|_gat|_gcl_|_fbp|_fbc|__utm|_hj|_clck|_clsk|ajs_|IDE$|fr$|_pk_)/i;
  const TRACKING_HOST = /google-analytics\.com|googletagmanager\.com|doubleclick\.net|facebook\.(net|com)|hotjar\.com|clarity\.ms|connect\.facebook|analytics\.tiktok|ads-twitter|linkedin\.com\/px/i;

  test('before consent: no tracking cookies and no requests to tracking domains', async ({ page, context }) => {
    const tracking: string[] = [];
    page.on('request', (r) => {
      if (TRACKING_HOST.test(r.url())) tracking.push(r.url());
    });
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Akceptuj wszystkie/i })).toBeVisible();
    await page.waitForLoadState('networkidle');
    const cookies = await context.cookies();
    test.info().annotations.push({ type: 'cookies-before-consent', description: cookies.map((c) => c.name).join(', ') || '(none)' });
    expect(cookies.filter((c) => TRACKING_COOKIE.test(c.name)).map((c) => c.name), 'tracking cookies before consent').toEqual([]);
    expect(tracking, 'requests to tracking domains before consent').toEqual([]);
  });

  test('banner links to the privacy policy and "only necessary" is remembered', async ({ page, context }) => {
    const tracking: string[] = [];
    page.on('request', (r) => {
      if (TRACKING_HOST.test(r.url())) tracking.push(r.url());
    });
    await page.goto('/');
    const policy = page.getByRole('link', { name: /polityce prywatności/i });
    await expect(policy).toBeVisible();
    await expect(policy).toHaveAttribute('href', '/info/polityka-prywatnosci');

    await page.getByRole('button', { name: /Tylko niezbędne/i }).click();
    await expect(page.getByRole('button', { name: /Akceptuj wszystkie/i })).toBeHidden();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('cookie-consent') ?? 'null'));
    expect(stored, 'consent stored').toMatchObject({ necessary: true, analytics: false, marketing: false });

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Akceptuj wszystkie/i }), 'banner stays closed after rejecting').toBeHidden();
    expect((await context.cookies()).filter((c) => TRACKING_COOKIE.test(c.name)).map((c) => c.name)).toEqual([]);
    expect(tracking, 'tracking requests after rejecting').toEqual([]);
  });

  test('privacy policy page behind the banner link opens', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /polityce prywatności/i }).click();
    await expect(page).toHaveURL(/\/info\/polityka-prywatnosci/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('No personal data in public responses @security', () => {
  const EMAIL_RE = /^[^\s@"]+@[^\s@"]+\.[a-z]{2,}$/i;
  const PII_KEY = /^(e-?mail|phone|telefon|mobile|birth(date|day)?|dateOfBirth|dataUrodzenia|pesel|street|address|emergencyContact\w*)$/i;
  const ALLOWED_PATH = /organizer|organiser|contact|kontakt|support/i;

  function scan(node: unknown, path: string, out: { pii: string[]; allowed: string[] }): void {
    if (Array.isArray(node)) return node.forEach((v, i) => scan(v, `${path}[${i}]`, out));
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) scan(v, `${path}.${k}`, out);
      return;
    }
    if (typeof node !== 'string' || node === '') return;
    const key = path.split('.').pop() ?? '';
    const hit = EMAIL_RE.test(node) || PII_KEY.test(key);
    if (!hit) return;
    (ALLOWED_PATH.test(path) ? out.allowed : out.pii).push(`${path}=${node.slice(0, 40)}`);
  }

  test('events, results, start lists and rankings expose no participant e-mails, phones or birth dates', async ({ request, seed }) => {
    test.skip(!seed.events[0], 'no events');
    const urls = ['/events?pageSize=100'];
    const withResults = seed.past[0] ?? seed.events[0];
    const withStart = seed.upcoming[0] ?? seed.events[0];
    urls.push(`/events/${withResults.id}/results`, `/events/${withStart.id}/start-list`);
    if (seed.series[0]) urls.push(`/series/${seed.series[0].id}/ranking`);

    const out = { pii: [] as string[], allowed: [] as string[] };
    for (const u of urls) {
      const res = await call(request, 'GET', u);
      expect(res.status(), u).toBe(200);
      scan(await res.json(), u.split('?')[0], out);
    }
    if (out.allowed.length) {
      test.info().annotations.push({ type: 'organizer-contact', description: `${out.allowed.length} organizer/contact field(s), e.g. ${out.allowed[0]}` });
    }
    expect(out.pii.slice(0, 10), 'personal data in public JSON').toEqual([]);
  });
});

// Keep last: if the host rate-limits the login route this can block it for ~5 minutes.
test.describe('Login rate limit @security', () => {
  test.describe.configure({ mode: 'serial' });

  test('failed logins on a non-existent account: record when (if ever) 429 appears', async ({ request }) => {
    const email = `qa-ratelimit-${ts}@example.com`;
    let firstBlocked = 0;
    const statuses: number[] = [];
    for (let i = 1; i <= 8; i++) {
      const res = await rawPost(request, '/auth/login', { email, password: `wrong-password-${i}` });
      statuses.push(res.status());
      if (res.status() === 429) {
        firstBlocked = i;
        test.info().annotations.push({ type: 'retry-after', description: String(res.headers()['retry-after'] ?? '-') });
        break;
      }
      expect(res.status(), `attempt ${i}`).toBe(401);
    }
    test.info().annotations.push({
      type: 'login-rate-limit',
      description: firstBlocked ? `429 from attempt ${firstBlocked} (statuses ${statuses.join(',')})` : `no 429 in ${statuses.length} attempts (statuses ${statuses.join(',')})`,
    });
  });
});
