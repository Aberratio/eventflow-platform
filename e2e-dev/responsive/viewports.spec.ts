import type { APIRequestContext } from '@playwright/test';
import { test, expect, skipCookieBanner, type SeedData } from '../support/fixtures';
import { getData } from '../support/api';
import { VIEWPORTS, LANDSCAPE, MIN_TAP_TARGET } from '../support/viewports';

// One page load per route x viewport. Every criterion of the brief is checked inside that single test
// (soft assertions, so one failing criterion does not hide the others).

interface Ctx {
  seed: SeedData;
  newRequest: () => Promise<APIRequestContext>;
}

interface RouteDef {
  title: string;
  kind: 'page' | 'events' | 'results';
  smoke?: boolean;
  resolve: (ctx: Ctx) => Promise<string | null>;
}

/** Past event that actually has results (the results tab shows only then). Cached per worker. */
let pastResultsPath: Promise<string | null> | undefined;
function findPastWithResults(ctx: Ctx): Promise<string | null> {
  pastResultsPath ??= (async () => {
    const request = await ctx.newRequest();
    try {
      for (const e of ctx.seed.past.slice(0, 6)) {
        const results = await getData<unknown[]>(request, `/events/${e.id}/results`);
        if (Array.isArray(results) && results.length > 0) return `/events/${e.slug}/results`;
      }
      return null;
    } finally {
      await request.dispose();
    }
  })().catch((err) => {
    pastResultsPath = undefined;
    throw err;
  });
  return pastResultsPath;
}

const ROUTES: RouteDef[] = [
  { title: 'strona główna /', kind: 'page', smoke: true, resolve: async () => '/' },
  { title: '/events', kind: 'events', resolve: async () => '/events' },
  {
    title: 'szczegóły wydarzenia przyszłego',
    kind: 'page',
    resolve: async ({ seed }) => (seed.upcoming[0] ? `/events/${seed.upcoming[0].slug}` : null),
  },
  { title: '/shop', kind: 'page', resolve: async () => '/shop' },
  {
    title: 'produkt /shop/:slug',
    kind: 'page',
    resolve: async ({ seed }) => (seed.products[0] ? `/shop/${seed.products[0].slug}` : null),
  },
  { title: '/cart', kind: 'page', resolve: async () => '/cart' },
  { title: '/series', kind: 'page', resolve: async () => '/series' },
  { title: '/login', kind: 'page', resolve: async () => '/login' },
  { title: 'wyniki przeszłego wydarzenia', kind: 'results', resolve: findPastWithResults },
];

/**
 * Runs in the browser. Returns the horizontal overflow, undersized tap targets (WCAG 2.5.8 with the
 * spacing exception) and clipped texts for the header and main content.
 */
function measureLayout(minTap: number) {
  const innerWidth = window.innerWidth;

  const label = (el: Element): string => {
    const cls = Array.from(el.classList)
      .slice(0, 2)
      .map((c) => `.${CSS.escape(c)}`)
      .join('');
    return `${el.tagName.toLowerCase()}${el.id ? `#${CSS.escape(el.id)}` : ''}${cls}`;
  };
  const text = (el: Element): string =>
    (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40) ||
    el.getAttribute('aria-label') ||
    '';
  const visible = (el: Element): boolean => {
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0)
      return false;
    return !el.closest('[aria-hidden="true"]');
  };
  const clippedByAncestor = (el: Element): boolean => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (getComputedStyle(p).overflowX !== 'visible') return true;
    }
    return false;
  };

  // Horizontal overflow: elements sticking out of the viewport that no scroll container clips.
  const overflow: string[] = [];
  for (const el of Array.from(document.body.querySelectorAll('*'))) {
    if (!visible(el) || clippedByAncestor(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right > innerWidth + 1) overflow.push(`${label(el)} right=${Math.round(r.right)}`);
  }

  // Tap targets.
  const els = Array.from(
    document.querySelectorAll<HTMLElement>(
      'header a[href], header button, main a[href], main button, main [role="tab"]',
    ),
  ).filter((el) => visible(el) && !(el as HTMLButtonElement).disabled);
  const boxes = els.map((el) => el.getBoundingClientRect());
  const tapTargets: string[] = [];
  els.forEach((el, i) => {
    const r = boxes[i];
    if (r.width >= minTap && r.height >= minTap) return;
    // A checkbox whose own <label> is a large enough click area: the label is the target.
    const lab = el.id
      ? document.querySelector<HTMLElement>(`label[for="${CSS.escape(el.id)}"]`)
      : el.closest<HTMLElement>('label');
    if (lab) {
      const lr = lab.getBoundingClientRect();
      if (lr.width >= minTap && lr.height >= minTap) return;
    }
    // Links inside running text are exempt (WCAG 2.5.8 inline exception).
    if (
      el.tagName === 'A' &&
      getComputedStyle(el).display === 'inline' &&
      (el.parentElement?.textContent ?? '').trim().length >
        (el.textContent ?? '').trim().length + 10
    ) {
      return;
    }
    // Spacing exception: a circle of minTap diameter around the target must not touch another target.
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const rad = minTap / 2;
    const crowded = els.some((other, j) => {
      if (j === i || other.contains(el) || el.contains(other)) return false;
      const o = boxes[j];
      const nx = Math.min(Math.max(cx, o.left), o.right);
      const ny = Math.min(Math.max(cy, o.top), o.bottom);
      return (nx - cx) ** 2 + (ny - cy) ** 2 < rad * rad;
    });
    if (!crowded)
      tapTargets.push(`${label(el)} "${text(el)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
  });

  // Clipped texts: a box with overflow hidden/clip, no ellipsis, that holds text and does not fit.
  const clipped: string[] = [];
  for (const el of Array.from(document.querySelectorAll<HTMLElement>('header *, main *'))) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.overflowX !== 'hidden' && cs.overflowX !== 'clip') continue;
    if (cs.textOverflow === 'ellipsis') continue;
    const hasText = (el.textContent ?? '').trim() !== '';
    if (hasText && el.scrollWidth > el.clientWidth + 1) {
      clipped.push(`${label(el)} "${text(el)}" scroll=${el.scrollWidth} client=${el.clientWidth}`);
    }
  }

  return {
    innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflow: overflow.slice(0, 15),
    tapTargets: tapTargets.slice(0, 20),
    clipped: clipped.slice(0, 20),
  };
}

for (const vp of [...VIEWPORTS, ...LANDSCAPE]) {
  test.describe(`@responsive ${vp.name} ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test.beforeEach(async ({ page }) => {
      await skipCookieBanner(page);
    });

    for (const route of ROUTES) {
      const smoke = route.smoke && vp.name === 'mobile-375' ? ' @smoke' : '';
      test(`${route.title}${smoke}`, async ({ page, seed, playwright }) => {
        const path = await route.resolve({
          seed,
          newRequest: () => playwright.request.newContext(),
        });
        if (!path) {
          test.skip(true, `brak kandydata w seed dla: ${route.title}`);
          return;
        }

        await page.goto(path, { waitUntil: 'load' });
        await expect(page.locator('header').first()).toBeVisible();
        await expect(page.locator('main').first()).toBeVisible();
        await page.waitForLoadState('networkidle');

        // Layout criteria: no horizontal scroll, tap targets, clipped texts.
        const m = await page.evaluate(measureLayout, MIN_TAP_TARGET);
        expect
          .soft(
            m.scrollWidth,
            `scrollWidth ${m.scrollWidth} > innerWidth ${m.innerWidth}; wystające: ${m.overflow.join(' | ')}`,
          )
          .toBeLessThanOrEqual(m.innerWidth + 1);
        expect
          .soft(m.tapTargets, `tap targets < ${MIN_TAP_TARGET}px bez odstępu (WCAG 2.5.8)`)
          .toEqual([]);
        expect.soft(m.clipped, 'teksty ucięte bez ellipsis').toEqual([]);

        // Mobile menu (< 768) and desktop navigation (>= 1024).
        if (vp.width < 768) {
          const burger = page.getByRole('button', { name: 'Otwórz menu' });
          await expect.soft(burger, 'przycisk menu mobilnego widoczny < 768').toBeVisible();
          if (await burger.isVisible()) {
            await burger.click();
            const menu = page.locator('#mobile-nav-menu');
            await expect
              .soft(
                menu.getByRole('link', { name: /Kalendarz wydarzeń/ }),
                'menu mobilne ma link do wydarzeń',
              )
              .toBeVisible();
            await page.getByRole('button', { name: 'Zamknij menu' }).click();
            await expect.soft(menu, 'menu mobilne zamyka się').toBeHidden();
          }
        }
        if (vp.width >= 1024) {
          await expect
            .soft(
              page.getByRole('link', { name: 'Kalendarz', exact: true }).first(),
              'nawigacja desktopowa widoczna',
            )
            .toBeVisible();
        }

        // /events on small screens: search, filter drawer and a select are usable.
        if (route.kind === 'events' && vp.width < 1024) {
          await expect
            .soft(
              page.locator('input[placeholder="Szukaj wydarzeń..."]:visible').first(),
              'pole wyszukiwania widoczne',
            )
            .toBeVisible();

          const filtersTrigger = page
            .locator('main button:has(svg.lucide-sliders-horizontal)')
            .first();
          await expect.soft(filtersTrigger, 'przycisk filtrów widoczny').toBeVisible();
          if (await filtersTrigger.isVisible()) {
            const named =
              (await filtersTrigger.getAttribute('aria-label')) ||
              ((await filtersTrigger.textContent()) ?? '').trim();
            if (!named) {
              test.info().annotations.push({
                type: 'a11y',
                description: 'Przycisk filtrów bez nazwy dostępnej (tryb icon)',
              });
            }
            await filtersTrigger.click();
            await expect
              .soft(
                page.getByText('Filtry wydarzeń', { exact: true }),
                'drawer filtrów się otwiera',
              )
              .toBeVisible();
            await page.keyboard.press('Escape');
            await expect
              .soft(page.getByText('Filtry wydarzeń', { exact: true }), 'drawer filtrów się zamyka')
              .toBeHidden();
          }

          const select = page.locator('main [role="combobox"]:visible').first();
          await expect.soft(select, 'select widoczny').toBeVisible();
          await select.click();
          await expect
            .soft(page.getByRole('option').first(), 'select otwiera listę opcji')
            .toBeVisible();
          await page.keyboard.press('Escape');
        }

        // Past event results: the table scrolls inside its container, not the whole page.
        if (route.kind === 'results') {
          // Category accordion rows carry a chevron; the distance toggles above them do not.
          const category = page
            .locator('[role="tabpanel"] button:has(svg.lucide-chevron-right)')
            .first();
          await expect.soft(category, 'kategoria wyników widoczna').toBeVisible();
          await category.click();
          const table = page.locator('[role="tabpanel"] table:visible').first();
          await expect(table, 'tabela wyników po rozwinięciu kategorii').toBeVisible();
          const box = await table.evaluate((t) => {
            let c: HTMLElement | null = t.parentElement;
            while (c && getComputedStyle(c).overflowX === 'visible') c = c.parentElement;
            return c
              ? {
                  overflowX: getComputedStyle(c).overflowX,
                  scrollW: c.scrollWidth,
                  clientW: c.clientWidth,
                  tableW: t.getBoundingClientRect().width,
                }
              : null;
          });
          expect.soft(box, 'tabela ma przewijany kontener').not.toBeNull();
          if (box) {
            expect.soft(box.overflowX, 'overflow-x kontenera tabeli').toMatch(/auto|scroll/);
            if (box.tableW > box.clientW) {
              test.info().annotations.push({
                type: 'info',
                description: 'tabela szersza niż kontener (przewija się w kontenerze)',
              });
            }
          }
          const after = await page.evaluate(measureLayout, MIN_TAP_TARGET);
          expect
            .soft(after.scrollWidth, 'po otwarciu tabeli strona nie przewija się poziomo')
            .toBeLessThanOrEqual(after.innerWidth + 1);
        }
      });
    }
  });
}
