import { test, expect, skipCookieBanner } from '../support/fixtures';
import { FRONT } from '../support/env';

// Sequential crawl of public pages: dead internal links, raw i18n output, PL prices and dates.
// Findings are soft assertions with the URL in the message, so one run lists every affected page.

const START = ['/', '/events', '/shop', '/series', '/challenges'];
const EXCLUDED = /^\/(admin|organizer|moderator|participant|profile)(\/|$)/;
const MAX_PAGES = 40;

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const URL_RE = /https?:\/\/\S+/g;
const DOMAIN = /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:pl|it|com|org|net|eu|io|dev|app|info)\b/gi;
const I18N_KEY = /\b[a-z]+(?:\.[a-z_]+){2,}\b/g;
const BAD_VALUE = /\b(?:undefined|null|NaN)\b|\[object Object\]|Invalid Date/g;
const NOT_FOUND = /ta strona nie istnieje/i;
const ISO_DATE = /\b\d{4}-\d{2}-\d{2}\b/;
const EN_MONTH =
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/;
const PL_DOTTED = /\b\d{2}\.\d{2}\.\d{4}\b/;
const PL_MONTH =
  /\b\d{1,2}\s+(?:stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\b/i;
const PRICE_PL = /\d[\d\s\u00a0]*,\d{2}\s?zł/;
const PRICE_BAD = /\d\.\d{2}\s?zł|\bPLN\b/;

test.describe('@usability links and i18n', () => {
  test.beforeEach(async ({ page }) => {
    await skipCookieBanner(page);
  });

  test('@usability @smoke crawl: martwe linki, surowe teksty, ceny i daty', async ({
    page,
    seed,
  }) => {
    test.setTimeout(20 * 60 * 1000);

    const productPath = seed.products[0] ? `/shop/${seed.products[0].slug}` : null;
    const eventCandidate = seed.upcoming[0] ?? seed.past[0];
    const eventPath = eventCandidate ? `/events/${eventCandidate.slug}` : null;

    const queue: string[] = [
      ...START,
      ...(productPath ? [productPath] : []),
      ...(eventPath ? [eventPath] : []),
    ];
    const from = new Map<string, string>();
    const seen = new Set<string>();
    const bodies = new Map<string, string>();
    const labels = new Set<string>();
    const external: string[] = [];
    let visited = 0;

    while (queue.length > 0 && visited < MAX_PAGES) {
      const path = queue.shift()!;
      if (seen.has(path)) continue;
      seen.add(path);
      visited++;

      const response = await page.goto(path, { waitUntil: 'load' });
      await page.waitForLoadState('networkidle');

      const origin = from.get(path) ? ` (link z ${from.get(path)})` : '';
      expect.soft(response?.status() ?? 0, `${path}${origin}: status HTTP`).toBeLessThan(400);
      expect
        .soft(
          await page.locator('header').count(),
          `${path}${origin}: brak nagłówka serwisu (layout)`,
        )
        .toBeGreaterThan(0);

      const body = await page.locator('body').innerText();
      bodies.set(path, body);
      expect.soft(NOT_FOUND.test(body), `${path}${origin}: strona 404 (martwy link)`).toBe(false);

      // Raw values and i18n keys, after removing e-mails, URLs and domains.
      const cleaned = body.replace(EMAIL, ' ').replace(URL_RE, ' ').replace(DOMAIN, ' ');
      const badValues = Array.from(cleaned.matchAll(BAD_VALUE), (m) => m[0]);
      const i18nKeys = Array.from(cleaned.matchAll(I18N_KEY), (m) => m[0]);
      expect.soft(badValues, `${path}: surowe wartości w tekście`).toEqual([]);
      expect.soft(i18nKeys, `${path}: surowe klucze i18n (do przeglądu)`).toEqual([]);

      const links = await page.$$eval('a[href]', (as) =>
        as.map((a) => ({
          href: a.getAttribute('href') ?? '',
          target: a.getAttribute('target'),
          rel: a.getAttribute('rel'),
        })),
      );
      for (const a of links) {
        if (/^https?:\/\//.test(a.href)) {
          if (a.href.startsWith(FRONT)) continue;
          external.push(a.href);
          if (a.target === '_blank') {
            expect
              .soft(a.rel ?? '', `${path}: ${a.href} target=_blank bez rel=noopener`)
              .toContain('noopener');
          }
          continue;
        }
        if (!a.href.startsWith('/') || a.href.startsWith('//')) continue;
        const target = a.href.split(/[?#]/)[0] || '/';
        if (EXCLUDED.test(target)) continue;
        if (!seen.has(target) && !queue.includes(target)) {
          queue.push(target);
          from.set(target, path);
        }
      }

      const names = await page.$$eval(
        'header a, header button, footer a, main a, main button, main h1, main h2',
        (els) => els.map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean),
      );
      for (const n of names) labels.add(n);
    }

    test.info().annotations.push({
      type: 'info',
      description: `odwiedzono ${visited} stron (limit ${MAX_PAGES})`,
    });
    if (queue.length > 0) {
      test.info().annotations.push({
        type: 'info',
        description: `nieodwiedzone linki po limicie: ${queue.length}`,
      });
    }
    test.info().annotations.push({
      type: 'info',
      description: `zewnętrzne linki (niewizytowane): ${external.length}`,
    });

    // Prices on the shop list and on a product page.
    const shopBody = bodies.get('/shop');
    if (shopBody && seed.products.length > 0) {
      expect.soft(shopBody, '/shop: ceny w formacie PL (zł, przecinek)').toMatch(PRICE_PL);
      expect.soft(shopBody, '/shop: ceny z kropką lub PLN').not.toMatch(PRICE_BAD);
    }
    if (productPath && bodies.has(productPath)) {
      const productBody = bodies.get(productPath)!;
      expect.soft(productBody, `${productPath}: cena w formacie PL`).toMatch(PRICE_PL);
      expect.soft(productBody, `${productPath}: ceny z kropką lub PLN`).not.toMatch(PRICE_BAD);
    }

    // Dates: list and detail must both show PL dates and no ISO or English month names.
    const dateFormat = (body: string): string => {
      if (PL_MONTH.test(body)) return 'nazwa miesiąca PL';
      if (PL_DOTTED.test(body)) return 'dd.mm.rrrr';
      return 'brak';
    };
    const listBody = bodies.get('/events');
    if (listBody) {
      test.info().annotations.push({
        type: 'info',
        description: `format dat na /events: ${dateFormat(listBody)}`,
      });
      expect.soft(ISO_DATE.test(listBody), '/events: data ISO w tekście').toBe(false);
      expect.soft(EN_MONTH.test(listBody), '/events: angielska nazwa miesiąca').toBe(false);
      expect.soft(dateFormat(listBody), '/events: daty po polsku').not.toBe('brak');
    }
    if (eventPath && bodies.has(eventPath)) {
      const detailBody = bodies.get(eventPath)!;
      test.info().annotations.push({
        type: 'info',
        description: `format dat na detalu: ${dateFormat(detailBody)}`,
      });
      expect.soft(ISO_DATE.test(detailBody), `${eventPath}: data ISO w tekście`).toBe(false);
      expect.soft(EN_MONTH.test(detailBody), `${eventPath}: angielska nazwa miesiąca`).toBe(false);
      expect.soft(dateFormat(detailBody), `${eventPath}: daty po polsku`).not.toBe('brak');
    }

    // Naming: annotation only, never a failure.
    const pick = (re: RegExp) =>
      Array.from(labels)
        .filter((l) => re.test(l))
        .slice(0, 15);
    const eventNames = pick(/Wydarzeni|Zawod|Kalendarz/);
    const signupNames = pick(/Zapisy|Rejestracj|Zapisz/);
    if (eventNames.length > 0) {
      test.info().annotations.push({
        type: 'naming',
        description: `nazwy wydarzeń: ${eventNames.join(' | ')}`,
      });
    }
    if (signupNames.length > 0) {
      test.info().annotations.push({
        type: 'naming',
        description: `nazwy zapisów: ${signupNames.join(' | ')}`,
      });
    }
  });
});
