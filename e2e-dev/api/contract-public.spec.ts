import { test, expect } from '../support/fixtures';
import { call } from '../support/api';

type Kind = 'array' | 'object';
type Shape = Record<string, 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any'>;

interface Endpoint {
  path: string;
  kind: Kind;
  /** Keys required on each element (array) or on the object itself. */
  keys?: Shape;
}

const EVENT_KEYS: Shape = { id: 'string', slug: 'string', name: 'string', date: 'string', publicationStatus: 'string' };

/** Public GET endpoints from routes.php. Paths with {slug}/{id} are filled from the seed in the tests below. */
const LISTS: Endpoint[] = [
  { path: '/events/featured', kind: 'array', keys: EVENT_KEYS },
  { path: '/events/live', kind: 'array' },
  { path: '/series', kind: 'array', keys: { id: 'string', slug: 'string', name: 'string' } },
  { path: '/shop/products', kind: 'array', keys: { id: 'string', slug: 'string', name: 'string' } },
  { path: '/shop/categories', kind: 'array' },
  { path: '/shop/delivery-methods', kind: 'array' },
  { path: '/shop/payment-methods', kind: 'array' },
  { path: '/challenges', kind: 'array', keys: { id: 'string', slug: 'string', name: 'string' } },
  { path: '/info-pages', kind: 'array', keys: { slug: 'string' } },
  { path: '/partners', kind: 'array' },
  { path: '/partners/featured', kind: 'array' },
  { path: '/event-backgrounds', kind: 'array' },
  { path: '/insurance/variants', kind: 'array' },
];

function checkShape(obj: unknown, keys: Shape | undefined, where: string): void {
  if (!keys) return;
  expect(obj, where).toBeTruthy();
  const rec = obj as Record<string, unknown>;
  for (const [k, t] of Object.entries(keys)) {
    expect(k in rec, `${where}: missing key "${k}"`).toBe(true);
    if (t === 'any') continue;
    const v = rec[k];
    if (t === 'array') expect(Array.isArray(v), `${where}.${k} should be array`).toBe(true);
    else expect(typeof v, `${where}.${k} type`).toBe(t);
  }
}

interface Timed {
  status: number;
  contentType: string;
  json: any;
  ms: number;
}

async function timed(
  request: Parameters<typeof call>[0],
  method: Parameters<typeof call>[1],
  path: string,
  opts: Parameters<typeof call>[3] = {},
): Promise<Timed> {
  const t0 = Date.now();
  const res = await call(request, method, path, opts);
  const ms = Date.now() - t0;
  const contentType = res.headers()['content-type'] ?? '';
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  test.info().annotations.push({ type: 'timing', description: `${method} ${path} -> ${res.status()} in ${ms} ms` });
  return { status: res.status(), contentType, json, ms };
}

function expectErrorEnvelope(r: Timed, where: string): void {
  expect(r.contentType, `${where} content-type`).toContain('application/json');
  expect(r.json?.success, `${where} success flag`).toBe(false);
  expect(typeof r.json?.error?.code, `${where} error.code`).toBe('string');
  expect(typeof r.json?.error?.message, `${where} error.message`).toBe('string');
}

test.describe('API contract: public endpoints @api', () => {
  test('GET /health @smoke', async ({ request }) => {
    const r = await timed(request, 'GET', '/health');
    expect(r.status).toBe(200);
    expect(r.contentType).toContain('application/json');
    expect(r.json.success).toBe(true);
    expect(typeof r.json.data).toBe('object');
    expect(r.json.data.checks.database).toBe('ok');
  });

  test('GET /events: paginated list with event shape @smoke', async ({ request }) => {
    const r = await timed(request, 'GET', '/events', { params: { pageSize: 5 } });
    expect(r.status).toBe(200);
    expect(r.contentType).toContain('application/json');
    // JsonResponder::paginated has no `success` flag (unlike ok()); recorded as a minor contract inconsistency.
    expect(r.json.success, 'paginated lists carry no success flag').toBeUndefined();
    expect(Array.isArray(r.json.data)).toBe(true);
    expect(r.json.data.length).toBeGreaterThan(0);
    for (const e of r.json.data) checkShape(e, EVENT_KEYS, `event ${e?.id}`);
    const meta = r.json.meta ?? r.json;
    expect(typeof meta.total).toBe('number');
    expect(typeof meta.page).toBe('number');
    expect(typeof meta.pageSize).toBe('number');
    expect(typeof meta.totalPages).toBe('number');
  });

  for (const ep of LISTS) {
    test(`GET ${ep.path}`, async ({ request }) => {
      const r = await timed(request, 'GET', ep.path);
      expect(r.status).toBe(200);
      expect(r.contentType).toContain('application/json');
      // Either the ok() envelope or the paginated one (data + total, no success flag).
      if (r.json.success === undefined) expect(typeof r.json.total, `${ep.path} paginated total`).toBe('number');
      else expect(r.json.success).toBe(true);
      expect(Array.isArray(r.json.data), 'data is an array').toBe(true);
      for (const item of r.json.data.slice(0, 20)) checkShape(item, ep.keys, `${ep.path} item`);
    });
  }

  test('GET detail endpoints by slug/id (events, series, shop, challenges, info-pages)', async ({ request, seed }) => {
    const ev = seed.events[0];
    test.skip(!ev, 'no events in seed');
    const targets: Array<{ path: string; keys?: Shape }> = [
      { path: `/events/slug/${ev.slug}`, keys: EVENT_KEYS },
      { path: `/events/${ev.id}`, keys: EVENT_KEYS },
      { path: `/events/${ev.id}/results` },
      { path: `/events/${ev.id}/start-list` },
      { path: `/events/${ev.id}/form-fields/public` },
    ];
    if (seed.series[0]) {
      targets.push({ path: `/series/slug/${seed.series[0].slug}`, keys: { id: 'string', slug: 'string', name: 'string' } });
      targets.push({ path: `/series/${seed.series[0].id}/ranking` });
    }
    if (seed.products[0]) targets.push({ path: `/shop/products/slug/${seed.products[0].slug}`, keys: { id: 'string', slug: 'string', name: 'string' } });
    if (seed.challenges[0]) targets.push({ path: `/challenges/slug/${seed.challenges[0].slug}`, keys: { id: 'string', slug: 'string', name: 'string' } });
    for (const t of targets) {
      const r = await timed(request, 'GET', t.path);
      expect(r.status, t.path).toBe(200);
      expect(r.contentType, t.path).toContain('application/json');
      expect(r.json.success, `${t.path} success`).toBe(true);
      expect(r.json.data, `${t.path} data`).not.toBeUndefined();
      expect(typeof r.json.data, `${t.path} data type`).toBe('object');
      if (t.keys) checkShape(r.json.data, t.keys, t.path);
    }
  });

  test('GET /info-pages/slug/{slug}', async ({ request }) => {
    const list = await timed(request, 'GET', '/info-pages');
    const slug = list.json?.data?.[0]?.slug;
    test.skip(!slug, 'no info pages');
    const r = await timed(request, 'GET', `/info-pages/slug/${slug}`);
    expect(r.status).toBe(200);
    expect(r.json.success).toBe(true);
    expect(r.json.data.slug).toBe(slug);
  });

  test('public events expose no sensitive fields', async ({ request, seed }) => {
    const list = await timed(request, 'GET', '/events', { params: { pageSize: 200 } });
    expect(list.status).toBe(200);
    for (const e of list.json.data) {
      expect(e.accessCode ?? '', `accessCode on ${e.id}`).toBe('');
      expect(e.bzOrganizationToken ?? '', `bzOrganizationToken on ${e.id}`).toBe('');
      for (const d of e.discounts ?? e.discountCodes ?? []) {
        expect('usedBy' in d, `usedBy on discount of ${e.id}`).toBe(false);
      }
    }
    const ev = seed.events[0];
    test.skip(!ev, 'no events');
    const one = await timed(request, 'GET', `/events/slug/${ev.slug}`);
    expect(one.json.data.accessCode ?? '').toBe('');
    expect(one.json.data.bzOrganizationToken ?? '').toBe('');
    for (const d of one.json.data.discounts ?? one.json.data.discountCodes ?? []) {
      expect('usedBy' in d).toBe(false);
    }
    const feat = await timed(request, 'GET', '/events/featured');
    for (const e of feat.json.data) {
      expect(e.accessCode ?? '').toBe('');
      expect(e.bzOrganizationToken ?? '').toBe('');
    }
  });
});

test.describe('API contract: pagination @api', () => {
  test('page and pageSize are respected, pages do not overlap', async ({ request }) => {
    const p1 = await timed(request, 'GET', '/events', { params: { page: 1, pageSize: 3 } });
    const p2 = await timed(request, 'GET', '/events', { params: { page: 2, pageSize: 3 } });
    expect(p1.status).toBe(200);
    expect(p2.status).toBe(200);
    const m1 = p1.json.meta ?? p1.json;
    const m2 = p2.json.meta ?? p2.json;
    expect(p1.json.data.length).toBeLessThanOrEqual(3);
    expect(m1.pageSize).toBe(3);
    expect(m1.page).toBe(1);
    expect(m2.page).toBe(2);
    expect(m2.total, 'total is stable across pages').toBe(m1.total);
    expect(m1.totalPages).toBe(Math.max(1, Math.ceil(m1.total / 3)));
    const ids1 = p1.json.data.map((e: { id: string }) => e.id);
    const ids2 = p2.json.data.map((e: { id: string }) => e.id);
    expect(ids1.filter((id: string) => ids2.includes(id)), 'overlap between pages').toEqual([]);
    if (m1.total > 3) expect(ids2.length).toBeGreaterThan(0);
  });

  for (const [name, params] of [
    ['pageSize=0', { pageSize: '0' }],
    ['pageSize=-1', { pageSize: '-1' }],
    ['pageSize=100000', { pageSize: '100000' }],
    ['page=abc', { page: 'abc' }],
  ] as const) {
    test(`edge value ${name} never returns 5xx`, async ({ request }) => {
      const r = await timed(request, 'GET', '/events', { params });
      expect(r.status, 'status').toBeLessThan(500);
      if (r.status === 200) {
        expect(Array.isArray(r.json.data)).toBe(true);
        const m = r.json.meta ?? r.json;
        expect(m.pageSize, 'effective pageSize is bounded').toBeLessThanOrEqual(1000);
        expect(m.pageSize).toBeGreaterThan(0);
        expect(m.page).toBeGreaterThanOrEqual(1);
      } else {
        expect(r.status).toBeGreaterThanOrEqual(400);
        expectErrorEnvelope(r, name);
      }
    });
  }
});

test.describe('API contract: errors @api', () => {
  test('unknown event slug/id -> 404 with error envelope', async ({ request }) => {
    const ts = Date.now().toString(36);
    for (const path of [`/events/slug/qa-nope-${ts}`, `/events/qa-nope-${ts}`]) {
      const r = await timed(request, 'GET', path);
      expect(r.status, path).toBe(404);
      expectErrorEnvelope(r, path);
    }
  });

  test('unknown catalogue slug/id -> 404 with error envelope', async ({ request }) => {
    // Needs the server change that answers 404 for unknown catalogue slugs (eventflow-server PR).
    const ts = Date.now().toString(36);
    for (const path of [
      `/series/slug/qa-nope-${ts}`,
      `/shop/products/slug/qa-nope-${ts}`,
      `/challenges/slug/qa-nope-${ts}`,
      `/info-pages/slug/qa-nope-${ts}`,
    ]) {
      const r = await timed(request, 'GET', path);
      expect(r.status, path).toBe(404);
      expectErrorEnvelope(r, path);
    }
  });

  test('unknown route -> 404 JSON', async ({ request }) => {
    const r = await timed(request, 'GET', `/qa-no-such-route-${Date.now().toString(36)}`);
    expect(r.status).toBe(404);
    expect(r.contentType).toContain('application/json');
    expectErrorEnvelope(r, 'unknown route');
  });

  test('wrong method on /health -> 405 JSON (records actual response)', async ({ request }) => {
    const r = await timed(request, 'DELETE', '/health');
    test.info().annotations.push({ type: 'wrong-method', description: `DELETE /health -> ${r.status} ${r.contentType} ${JSON.stringify(r.json)}` });
    expect(r.status).toBe(405);
    expect(r.contentType).toContain('application/json');
    expectErrorEnvelope(r, 'DELETE /health');
  });

  test('POST /auth/login with empty body, broken JSON and missing fields -> 4xx envelope, not 500', async ({ request }) => {
    const email = `qa-contract-${Date.now().toString(36)}@example.com`;
    const empty = await timed(request, 'POST', '/auth/login');
    const broken = await timed(request, 'POST', '/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: '{"email": "' + email + '", ',
    });
    const missing = await timed(request, 'POST', '/auth/login', { data: { email } });
    for (const [name, r] of [['empty', empty], ['broken', broken], ['missing password', missing]] as const) {
      expect(r.status, `${name} status`).toBeGreaterThanOrEqual(400);
      expect(r.status, `${name} status`).toBeLessThan(500);
      expectErrorEnvelope(r, name);
    }
  });
});
