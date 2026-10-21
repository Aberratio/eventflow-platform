import type { APIRequestContext, APIResponse } from '@playwright/test';
import { test, expect } from '../support/fixtures';
import { call, DevThrottledError } from '../support/api';
import { API, FRONT } from '../support/env';

const HSTS_MIN_AGE = 15552000; // 180 days
const FRONT_ORIGIN = new URL(FRONT).origin;
const EVIL_ORIGIN = 'https://evil.example';

/** Parses a CSP header into { directive: value }; the first occurrence of a directive wins. */
function parseCsp(value: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (value ?? '').split(';')) {
    const [name, ...rest] = part.trim().split(/\s+/);
    if (name && !(name.toLowerCase() in out)) out[name.toLowerCase()] = rest.join(' ');
  }
  return out;
}

function maxAgeOf(value: string | undefined): number {
  return Number(/max-age=(\d+)/i.exec(value ?? '')?.[1] ?? 0);
}

/** OPTIONS preflight as a browser sends it. `call()` does not support OPTIONS, hence this helper. */
async function preflight(request: APIRequestContext, path: string, method: string, origin: string): Promise<APIResponse> {
  const res = await request.fetch(`${API}${path}`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': method,
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
    failOnStatusCode: false,
  });
  if (res.status() === 429) throw new DevThrottledError('OPTIONS', path, res.headers()['retry-after']);
  return res;
}

test.describe('security headers and CORS @security', () => {
  test('front pages send the CSP, HSTS and hardening headers @smoke', async ({ request }) => {
    for (const path of ['/', '/events', '/shop']) {
      const res = await request.get(path);
      expect(res.status(), `${path} status`).toBe(200);
      const h = res.headers();
      const csp = parseCsp(h['content-security-policy']);

      expect(csp['default-src'], `${path} CSP default-src`).toBe("'self'");
      expect(csp['object-src'], `${path} CSP object-src`).toBe("'none'");
      expect(csp['frame-ancestors'], `${path} CSP frame-ancestors`).toBe("'self'");
      expect(csp['base-uri'], `${path} CSP base-uri`).toBe("'self'");
      const scriptSrc = csp['script-src'] ?? csp['default-src'] ?? '';
      expect(scriptSrc, `${path} script-src must not allow eval`).not.toMatch(/'unsafe-eval'/);
      expect(scriptSrc, `${path} script-src must not allow inline`).not.toMatch(/'unsafe-inline'/);

      expect(maxAgeOf(h['strict-transport-security']), `${path} HSTS max-age`).toBeGreaterThanOrEqual(HSTS_MIN_AGE);
      expect(h['x-content-type-options'], `${path} X-Content-Type-Options`).toBe('nosniff');
      expect(h['x-frame-options'], `${path} X-Frame-Options`).toMatch(/^(SAMEORIGIN|DENY)$/i);
      expect(h['referrer-policy'], `${path} Referrer-Policy`).toBeTruthy();
      expect(h['referrer-policy'], `${path} Referrer-Policy must not leak full URL`).not.toBe('unsafe-url');
      expect(h['permissions-policy'], `${path} Permissions-Policy`).toBeTruthy();
      expect(h['x-powered-by'], `${path} must not send X-Powered-By`).toBeUndefined();
      expect(h['server'] ?? '', `${path} Server must not reveal a version`).not.toMatch(/\d/);
    }
  });

  test('hashed JS asset is cached long, index.html is not cached', async ({ request }) => {
    const index = await request.get('/');
    expect(index.status()).toBe(200);
    expect(index.headers()['cache-control'] ?? '', 'index.html Cache-Control').toContain('no-cache');

    const html = await index.text();
    const assets = [...new Set(html.match(/\/assets\/[^"'\s>]+\.js/g) ?? [])];
    expect(assets.length, 'index.html must reference at least one /assets/*.js bundle').toBeGreaterThan(0);

    const asset = await request.get(assets[0]);
    expect(asset.status(), `${assets[0]} status`).toBe(200);
    const cc = asset.headers()['cache-control'] ?? '';
    expect(
      cc.includes('immutable') || maxAgeOf(cc) >= 31536000,
      `${assets[0]} Cache-Control must be immutable or max-age >= 1 year, got "${cc}"`,
    ).toBe(true);
  });

  test('API /health and /events send API hardening headers', async ({ request }) => {
    for (const path of ['/health', '/events']) {
      const res = await call(request, 'GET', path);
      const h = res.headers();
      expect(h['x-content-type-options'], `${path} X-Content-Type-Options`).toBe('nosniff');
      expect(h['x-frame-options'], `${path} X-Frame-Options`).toBe('DENY');
      expect(parseCsp(h['content-security-policy'])['default-src'], `${path} CSP default-src`).toBe("'none'");
      expect(maxAgeOf(h['strict-transport-security']), `${path} HSTS max-age`).toBeGreaterThanOrEqual(HSTS_MIN_AGE);
    }
  });

  for (const method of ['GET', 'POST', 'PATCH', 'DELETE'] as const) {
    test(`preflight from the front origin allows ${method}`, async ({ request }) => {
      const res = await preflight(request, '/events', method, FRONT_ORIGIN);
      const h = res.headers();
      expect(h['access-control-allow-origin'], 'Access-Control-Allow-Origin').toBe(FRONT_ORIGIN);
      const allowed = (h['access-control-allow-methods'] ?? '').split(',').map((m) => m.trim().toUpperCase());
      expect(allowed, `Access-Control-Allow-Methods must include ${method}`).toContain(method);
      expect(h['access-control-allow-credentials'], 'credentials must never be allowed').toBeUndefined();
    });
  }

  // Hypothesis H2: the API has PUT routes (e.g. PUT /events/{eventId}/form-fields/reorder), but
  // CorsMiddleware lists only "GET, POST, PATCH, DELETE, OPTIONS". A browser PUT fails preflight.
  test('preflight from the front origin allows PUT', async ({ request }) => {
    const res = await preflight(request, '/events/qa-placeholder/form-fields/reorder', 'PUT', FRONT_ORIGIN);
    const allowed = (res.headers()['access-control-allow-methods'] ?? '').split(',').map((m) => m.trim().toUpperCase());
    expect(allowed, 'Access-Control-Allow-Methods must include PUT').toContain('PUT');
  });

  test('foreign origin gets no Allow-Origin and never Allow-Credentials', async ({ request }) => {
    const pre = await preflight(request, '/events', 'GET', EVIL_ORIGIN);
    expect(pre.headers()['access-control-allow-origin'], 'preflight ACAO for foreign origin').toBeUndefined();
    expect(pre.headers()['access-control-allow-credentials'], 'preflight ACAC').toBeUndefined();

    const res = await call(request, 'GET', '/events', { headers: { Origin: EVIL_ORIGIN } });
    expect(res.headers()['access-control-allow-origin'], 'GET ACAO for foreign origin').toBeUndefined();
    expect(res.headers()['access-control-allow-credentials'], 'GET ACAC for foreign origin').toBeUndefined();
  });
});
