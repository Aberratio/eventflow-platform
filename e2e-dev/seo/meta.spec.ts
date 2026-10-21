import type { Page } from '@playwright/test';
import { test, expect, skipCookieBanner } from '../support/fixtures';
import { getData } from '../support/api';

interface Meta {
  title: string;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  canonical: string | null;
  robots: string | null;
}

async function readMeta(page: Page): Promise<Meta> {
  return page.evaluate(() => {
    const attr = (sel: string, name: string) =>
      document.querySelector(sel)?.getAttribute(name) ?? null;
    return {
      title: document.title,
      description: attr('meta[name="description"]', 'content'),
      ogTitle: attr('meta[property="og:title"]', 'content'),
      ogDescription: attr('meta[property="og:description"]', 'content'),
      ogImage: attr('meta[property="og:image"]', 'content'),
      canonical: attr('link[rel="canonical"]', 'href'),
      robots: attr('meta[name="robots"]', 'content'),
    };
  });
}

const isAbsoluteUrl = (v: string | null): boolean => {
  if (!v) return false;
  try {
    new URL(v);
    return /^https?:$/.test(new URL(v).protocol);
  } catch {
    return false;
  }
};

const TRACKING = /[?&](utm_[a-z]+|fbclid|gclid)=/i;

test.describe('SEO and meta @seo', () => {
  test('public pages carry title, description, Open Graph and canonical @smoke', async ({
    page,
    seed,
    request,
  }) => {
    test.fail(true, 'static title/description for every route, no og:image, no canonical');
    const targets: { path: string; label: string; expectName?: string }[] = [
      { path: '/', label: 'home' },
      { path: '/events', label: 'events list' },
    ];
    if (seed.upcoming[0])
      targets.push({
        path: `/events/${seed.upcoming[0].slug}`,
        label: 'upcoming event',
        expectName: seed.upcoming[0].name,
      });
    if (seed.past[0])
      targets.push({
        path: `/events/${seed.past[0].slug}`,
        label: 'past event',
        expectName: seed.past[0].name,
      });
    targets.push({ path: '/series', label: 'series list' });
    if (seed.series[0])
      targets.push({
        path: `/series/${seed.series[0].slug}`,
        label: 'series',
        expectName: seed.series[0].name,
      });
    targets.push({ path: '/shop', label: 'shop' });
    if (seed.products[0])
      targets.push({
        path: `/shop/${seed.products[0].slug}`,
        label: 'product',
        expectName: seed.products[0].name,
      });
    targets.push({ path: '/challenges', label: 'challenges' });
    const infoPages = await getData<{ slug: string }[]>(request, '/info-pages');
    if (infoPages[0]) targets.push({ path: `/info/${infoPages[0].slug}`, label: 'info page' });

    await skipCookieBanner(page);
    const titles: string[] = [];
    for (const t of targets) {
      await page.goto(t.path);
      await page.waitForLoadState('networkidle');
      const m = await readMeta(page);
      titles.push(m.title);

      expect.soft(m.title.trim(), `${t.path} (${t.label}): <title> is empty`).not.toBe('');
      if (t.expectName) {
        expect
          .soft(m.title, `${t.path} (${t.label}): <title> must contain "${t.expectName}"`)
          .toContain(t.expectName);
      }
      expect
        .soft((m.description ?? '').trim(), `${t.path} (${t.label}): meta description is missing`)
        .not.toBe('');
      expect
        .soft((m.ogTitle ?? '').trim(), `${t.path} (${t.label}): og:title is missing`)
        .not.toBe('');
      expect
        .soft((m.ogDescription ?? '').trim(), `${t.path} (${t.label}): og:description is missing`)
        .not.toBe('');
      expect
        .soft(
          isAbsoluteUrl(m.ogImage),
          `${t.path} (${t.label}): og:image must be an absolute URL, got "${m.ogImage}"`,
        )
        .toBe(true);
      expect
        .soft(
          isAbsoluteUrl(m.canonical),
          `${t.path} (${t.label}): canonical must be an absolute URL, got "${m.canonical}"`,
        )
        .toBe(true);
      expect
        .soft(m.canonical ?? '', `${t.path} (${t.label}): canonical must not carry tracking params`)
        .not.toMatch(TRACKING);
    }
    expect
      .soft(
        new Set(titles).size,
        `titles must be unique across pages, got: ${JSON.stringify(titles)}`,
      )
      .toBe(titles.length);
  });

  test('robots.txt is served as text and dev blocks indexing', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status(), 'robots.txt status').toBe(200);
    expect(res.headers()['content-type'], 'robots.txt content-type').toMatch(/text\/plain/);
    const body = await res.text();

    const wildcardGroup = /User-agent:\s*\*[\s\S]*?(?=\n\s*User-agent:|$)/i.exec(body)?.[0] ?? '';
    const disallowsAll = /^\s*Disallow:\s*\/\s*$/im.test(wildcardGroup);
    const xRobots = res.headers()['x-robots-tag'] ?? '';
    const home = await (await request.get('/')).text();
    const metaNoindex = /<meta[^>]+name=["']robots["'][^>]*noindex/i.test(home);

    expect(
      disallowsAll || /noindex/i.test(xRobots) || metaNoindex,
      'dev must block indexing: robots.txt "User-agent: * / Disallow: /", X-Robots-Tag: noindex or meta robots noindex',
    ).toBe(true);
  });

  test('sitemap.xml is XML with a urlset (not the SPA shell) @seo', async ({ request }) => {
    test.fail(true, '/sitemap.xml returns the SPA HTML shell');
    const res = await request.get('/sitemap.xml');
    expect(res.status(), 'sitemap status').toBe(200);
    expect(res.headers()['content-type'], 'sitemap content-type').toMatch(
      /(application|text)\/xml/,
    );
    expect(await res.text(), 'sitemap body must contain <urlset>').toContain('<urlset');
  });

  test('unknown routes answer 404 and the 404 page is noindex', async ({ page, request }) => {
    test.fail(true, 'unknown routes answer HTTP 200 (soft 404) and the 404 page has no noindex');
    for (const path of ['/events/qa-nonexistent-xyz', '/qa-nonexistent-xyz']) {
      const res = await request.get(path);
      expect.soft(res.status(), `${path} must answer HTTP 404 (soft 404 otherwise)`).toBe(404);
    }

    await skipCookieBanner(page);
    for (const path of ['/events/qa-nonexistent-xyz', '/qa-nonexistent-xyz']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const robots = (await readMeta(page)).robots ?? '';
      expect.soft(robots, `${path}: 404 page must carry meta robots noindex`).toMatch(/noindex/i);
    }
  });

  test('deep links return SPA HTML and render their content @seo', async ({
    page,
    request,
    seed,
  }) => {
    const deep: { path: string; name: string }[] = [];
    if (seed.upcoming[0])
      deep.push({ path: `/events/${seed.upcoming[0].slug}/info`, name: seed.upcoming[0].name });
    if (seed.products[0])
      deep.push({
        path: `/shop/${seed.products[0].slug}`,
        name: seed.products[0].name ?? seed.products[0].slug,
      });
    if (seed.series[0])
      deep.push({
        path: `/series/${seed.series[0].slug}`,
        name: seed.series[0].name ?? seed.series[0].slug,
      });
    test.skip(deep.length === 0, 'brak wydarzenia, produktu ani serii w API');

    await skipCookieBanner(page);
    for (const d of deep) {
      const res = await request.get(d.path);
      expect(res.status(), `${d.path} status`).toBe(200);
      expect(res.headers()['content-type'], `${d.path} content-type`).toMatch(/text\/html/);

      await page.goto(d.path);
      await expect(
        page.getByText(d.name, { exact: false }).first(),
        `${d.path} renders "${d.name}"`,
      ).toBeVisible();
    }
  });
});
