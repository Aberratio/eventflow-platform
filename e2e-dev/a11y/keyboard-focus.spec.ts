import type { Locator, Page } from '@playwright/test';
import { test, expect, skipCookieBanner, type SeedData } from '../support/fixtures';

/**
 * WCAG criteria that need interaction: document structure, skip link, focus visibility and order,
 * dialogs, accessible names, form errors, reduced motion and reflow. Anonymous, read-only.
 */

type PathOf = (seed: SeedData) => string | undefined;

const PAGES: { name: string; path: PathOf }[] = [
  { name: 'home', path: () => '/' },
  { name: 'events', path: () => '/events' },
  { name: 'event detail', path: (s) => (s.upcoming[0] ? `/events/${s.upcoming[0].slug}` : undefined) },
  { name: 'series', path: () => '/series' },
  { name: 'shop', path: () => '/shop' },
  { name: 'challenges', path: () => '/challenges' },
  { name: 'login', path: () => '/login' },
  { name: 'register', path: () => '/register' },
  { name: 'forgot-password', path: () => '/forgot-password' },
];

async function open(page: Page, path: string) {
  await skipCookieBanner(page);
  await page.goto(path);
  await expect(page.locator('main').first()).toBeVisible();
  await expect(page.locator('h1:visible').first()).toBeVisible();
  await page.waitForLoadState('networkidle').catch(() => undefined);
}

test.describe('@a11y document structure', () => {
  for (const p of PAGES) {
    test(`${p.name}: lang, single h1, heading order, landmarks${p.name === 'home' ? ' @smoke' : ''}`, async ({ page, seed }) => {
      const path = p.path(seed);
      test.skip(!path, 'no data for this page');
      await open(page, path!);

      await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
      await expect(page.locator('h1')).toHaveCount(1);

      const levels = await page.evaluate(() =>
        [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')]
          .filter((h) => (h as HTMLElement).offsetParent !== null || getComputedStyle(h).position === 'fixed')
          .map((h) => ({
            level: h.getAttribute('aria-level') ? Number(h.getAttribute('aria-level')) : Number(h.tagName[1]),
            text: (h.textContent ?? '').trim().slice(0, 40),
          })),
      );
      const skips: string[] = [];
      let prev = 0;
      for (const h of levels) {
        if (prev && h.level > prev + 1) skips.push(`h${prev} -> h${h.level} ("${h.text}")`);
        prev = h.level;
      }
      expect(skips, 'heading level jumps').toEqual([]);

      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('banner')).toHaveCount(1);
      await expect(page.getByRole('contentinfo')).toHaveCount(1);
      expect(await page.getByRole('navigation').count(), 'navigation landmark').toBeGreaterThan(0);
    });
  }
});

test.describe('@a11y skip link', () => {
  test('first Tab stop is a skip link that moves focus to main', async ({ page }) => {
    await open(page, '/');
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const a = document.activeElement as HTMLAnchorElement | null;
      return { tag: a?.tagName, href: a?.getAttribute('href'), text: (a?.textContent ?? '').trim() };
    });
    const isSkip = info.tag === 'A' && (info.href ?? '').startsWith('#') && /pomi|przejd|skip|treś/i.test(info.text);
    expect(isSkip, `first Tab stop should be a skip link, got: ${JSON.stringify(info)}`).toBe(true);
    await page.keyboard.press('Enter');
    const inMain = await page.evaluate(() => {
      const m = document.querySelector('main');
      const a = document.activeElement;
      return !!m && !!a && (m === a || m.contains(a));
    });
    expect(inMain, 'focus should be in <main> after the skip link').toBe(true);
  });
});

interface Stop {
  desc: string;
  y: number;
  visible: boolean;
  indicator: boolean;
  inFooter: boolean;
  tabindex: number;
}

/** Tab through the page, measuring each stop. Stops after the footer is reached (or at the cap). */
async function tabThrough(page: Page, cap: number): Promise<{ stops: Stop[]; reachedFooter: boolean }> {
  const stops: Stop[] = [];
  let reachedFooter = false;
  for (let i = 0; i < cap; i++) {
    await page.keyboard.press('Tab');
    const stop = await page.evaluate<Stop | null>(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body || el === document.documentElement) return null;
      const props = [
        'outlineStyle',
        'outlineWidth',
        'outlineColor',
        'boxShadow',
        'borderTopColor',
        'backgroundColor',
        'textDecorationLine',
        'color',
      ] as const;
      const snap = () => {
        const cs = getComputedStyle(el);
        return Object.fromEntries(props.map((p) => [p, cs[p]])) as Record<(typeof props)[number], string>;
      };
      const after = snap();
      el.blur();
      const before = snap();
      el.focus();
      const outline = after.outlineStyle !== 'none' && parseFloat(after.outlineWidth) > 0;
      const outlineChanged = outline && (before.outlineStyle === 'none' || before.outlineWidth !== after.outlineWidth);
      const shadowChanged = after.boxShadow !== 'none' && after.boxShadow !== before.boxShadow;
      const otherChanged = (['borderTopColor', 'backgroundColor', 'textDecorationLine', 'color'] as const).some(
        (p) => before[p] !== after[p],
      );
      const r = el.getBoundingClientRect();
      const label = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('href') || '').trim().replace(/\s+/g, ' ');
      return {
        desc: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${label.slice(0, 40)}"`,
        y: Math.round(r.top + window.scrollY),
        visible: r.width > 0 && r.height > 0,
        indicator: outlineChanged || shadowChanged || otherChanged,
        inFooter: !!el.closest('footer, [role="contentinfo"]'),
        tabindex: el.tabIndex,
      };
    });
    if (!stop) continue; // focus left the page (browser chrome) or body
    stops.push(stop);
    if (stop.inFooter) {
      reachedFooter = true;
      // a few more stops so the footer is covered as well
      if (stops.filter((s) => s.inFooter).length >= 3) break;
    }
  }
  return { stops, reachedFooter };
}

test.describe('@a11y keyboard focus', () => {
  for (const path of ['/', '/events']) {
    test(`${path}: every Tab stop has a visible focus indicator, logical order, no trap${path === '/' ? ' @smoke' : ''}`, async ({
      page,
    }) => {
      await open(page, path);
      const { stops, reachedFooter } = await tabThrough(page, 250);
      expect(stops.length, 'number of Tab stops').toBeGreaterThan(5);

      expect(
        stops.filter((s) => !s.visible).map((s) => s.desc),
        'focused elements with zero size',
      ).toEqual([]);
      expect(
        stops.filter((s) => s.tabindex > 0).map((s) => s.desc),
        'positive tabindex distorts the order',
      ).toEqual([]);
      expect(
        stops.filter((s) => !s.indicator).map((s) => s.desc),
        'Tab stops without a visible focus change (outline / box-shadow / colours)',
      ).toEqual([]);

      const backwards: string[] = [];
      for (let i = 1; i < stops.length; i++) {
        if (stops[i].y < stops[i - 1].y - 40) backwards.push(`${stops[i - 1].desc} (y=${stops[i - 1].y}) -> ${stops[i].desc} (y=${stops[i].y})`);
      }
      expect(backwards, 'focus jumping upwards on the page').toEqual([]);
      expect(reachedFooter, 'Tab reaches the footer (no keyboard trap)').toBe(true);
    });
  }
});

/** Opens a dialog with the keyboard and checks the modal contract. */
async function expectModalContract(page: Page, trigger: Locator, container: () => Locator) {
  await trigger.focus();
  await page.keyboard.press('Enter');
  const box = container();
  await expect(box).toBeVisible();
  const focusInside = () => box.evaluate((el) => el.contains(document.activeElement));
  await expect.poll(focusInside, { message: 'focus moves into the dialog' }).toBe(true);
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    expect(await focusInside(), `Tab #${i + 1} stays inside the dialog`).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(box).toBeHidden();
  await expect(trigger, 'focus returns to the trigger').toBeFocused();
}

test.describe('@a11y dialogs', () => {
  test('cookie settings (footer link)', async ({ page }) => {
    await open(page, '/');
    const trigger = page.getByRole('button', { name: 'Ustawienia cookies' });
    await trigger.scrollIntoViewIfNeeded();
    await expectModalContract(page, trigger, () => page.getByRole('dialog'));
  });

  test('mobile menu (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await open(page, '/');
    const trigger = page.getByRole('button', { name: 'Otwórz menu' });
    await expectModalContract(page, trigger, () => page.locator('#mobile-nav-menu'));
  });

  test('event filters drawer (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await open(page, '/events');
    const trigger = page.locator('button:has(svg.lucide-sliders-horizontal)').first();
    await expect(trigger).toBeVisible();
    await expectModalContract(page, trigger, () => page.getByRole('dialog'));
  });

  test('route dialog on event detail', async ({ page, seed }) => {
    const candidates = seed.upcoming.slice(0, 6);
    test.skip(candidates.length === 0, 'no upcoming events');
    let found = false;
    for (const e of candidates) {
      await page.goto(`/events/${e.slug}/distances`).catch(() => undefined);
      await skipCookieBanner(page);
      const trigger = page.getByRole('button', { name: /Zobacz trasę/i }).first();
      if (await trigger.isVisible({ timeout: 3000 }).catch(() => false)) {
        found = true;
        await expectModalContract(page, trigger, () => page.getByRole('dialog'));
        break;
      }
    }
    test.skip(!found, 'no upcoming event with route files on the dev data');
  });

  test('gallery preview', async ({ page, seed }) => {
    const withGallery = seed.events.filter((e) => Array.isArray((e as { galleryAlbums?: unknown[] }).galleryAlbums) && (e as { galleryAlbums?: unknown[] }).galleryAlbums!.length > 0);
    test.skip(withGallery.length === 0, 'no event with a gallery in the public list');
    await open(page, `/events/${withGallery[0].slug}/gallery`);
    const img = page.locator('main button:has(img), main a:has(img)').first();
    await expect(img).toBeVisible();
    await expectModalContract(page, img, () => page.getByRole('dialog'));
  });
});

test.describe('@a11y names and alternatives', () => {
  for (const [name, path] of [
    ['home', '/'],
    ['events', '/events'],
    ['shop', '/shop'],
    ['login', '/login'],
  ] as const) {
    for (const width of [1280, 375]) {
      test(`${name} @${width}px: images have alt, buttons and links have names`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await open(page, path);
        const res = await page.evaluate(() => {
          const visible = (el: Element) => {
            const r = (el as HTMLElement).getBoundingClientRect();
            return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
          };
          const imgsNoAlt = [...document.querySelectorAll('img')]
            .filter((i) => !i.hasAttribute('alt') && i.getAttribute('role') !== 'presentation')
            .map((i) => i.getAttribute('src')?.slice(-60) ?? '?');
          const nameless = [...document.querySelectorAll('button, a[href], [role="button"], [role="link"]')]
            .filter(visible)
            .filter((el) => {
              const byId = (el.getAttribute('aria-labelledby') ?? '')
                .split(/\s+/)
                .map((id) => document.getElementById(id)?.textContent ?? '')
                .join('')
                .trim();
              const imgAlt = [...el.querySelectorAll('img')].map((i) => i.alt).join('').trim();
              const text = (el.textContent ?? '').trim();
              return !(el.getAttribute('aria-label')?.trim() || byId || text || imgAlt || el.getAttribute('title')?.trim());
            })
            .map((el) => `${el.tagName.toLowerCase()}.${(el.getAttribute('class') ?? '').split(/\s+/).slice(0, 4).join('.')}`);
          return { imgsNoAlt, nameless };
        });
        expect(res.imgsNoAlt, 'img without alt attribute').toEqual([]);
        expect(res.nameless, 'icon-only buttons/links without an accessible name').toEqual([]);
      });
    }
  }
});

test.describe('@a11y forms', () => {
  for (const path of ['/login', '/register', '/forgot-password']) {
    test(`${path}: labelled fields, errors tied to fields or announced${path === '/login' ? ' @smoke' : ''}`, async ({ page }) => {
      await open(page, path);

      const unlabeled = await page.evaluate(() =>
        [...document.querySelectorAll('main input, main select, main textarea')]
          .filter((el) => (el as HTMLInputElement).type !== 'hidden' && (el as HTMLElement).offsetParent !== null)
          .filter((el) => {
            const i = el as HTMLInputElement;
            return !(i.labels && i.labels.length) && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby');
          })
          .map((el) => `${el.tagName.toLowerCase()}[name=${el.getAttribute('name')}][type=${el.getAttribute('type')}]`),
      );
      expect(unlabeled, 'fields without a label').toEqual([]);

      // each visible field reachable through getByLabel
      const names = await page.evaluate(() =>
        [...document.querySelectorAll('main input')]
          .filter((el) => (el as HTMLInputElement).type !== 'hidden' && (el as HTMLElement).offsetParent !== null)
          .map((el) => ((el as HTMLInputElement).labels?.[0]?.textContent ?? el.getAttribute('aria-label') ?? '').trim()),
      );
      for (const label of names) {
        await expect(page.getByLabel(label, { exact: false }).first()).toBeVisible();
      }

      await page.locator('main form button[type="submit"]').first().click();
      const invalid = page.locator('main [aria-invalid="true"]');
      const announced = page.locator('main [role="alert"], main [aria-live="assertive"], main [aria-live="polite"]');
      await expect(invalid.or(announced).first()).toBeVisible();

      const problems = await page.evaluate(() => {
        const out: string[] = [];
        const alerts = [...document.querySelectorAll('main [role="alert"], main [aria-live]')].filter(
          (a) => (a.textContent ?? '').trim().length > 0,
        );
        for (const el of document.querySelectorAll('main [aria-invalid="true"]')) {
          const ids = (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
          const text = ids.map((id) => document.getElementById(id)?.textContent?.trim() ?? '').join('');
          if (!text && alerts.length === 0) out.push(`${el.getAttribute('name') ?? el.id}: no aria-describedby text and no live region`);
        }
        return out;
      });
      expect(problems, 'invalid fields without a programmatic error message').toEqual([]);
      const invalidCount = await invalid.count();
      const announcedCount = await announced.filter({ hasText: /\S/ }).count();
      expect(invalidCount + announcedCount, 'error state is exposed (aria-invalid or live region)').toBeGreaterThan(0);
    });
  }
});

test.describe('@a11y reduced motion', () => {
  for (const path of ['/', '/events']) {
    test(`${path}: no running animations with prefers-reduced-motion`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await open(page, path);
      const moving = await page.evaluate(() => {
        const out: string[] = [];
        for (const el of document.querySelectorAll('body *')) {
          const cs = getComputedStyle(el);
          const dur = (s: string) => Math.max(0, ...s.split(',').map((d) => parseFloat(d) * (d.includes('ms') ? 0.001 : 1)));
          const animates = cs.animationName !== 'none' && dur(cs.animationDuration) > 0;
          const motion = /transform|translate|scale|rotate|margin|left|top|right|bottom|all/.test(cs.transitionProperty) && dur(cs.transitionDuration) > 0 && el.matches('[class*="carousel"], [class*="hero"], [class*="slide"], [class*="marquee"], [class*="animate"]');
          if (animates || motion)
            out.push(`${el.tagName.toLowerCase()}.${(el.getAttribute('class') ?? '').split(/\s+/).slice(0, 3).join('.')} anim=${cs.animationName}/${cs.animationDuration}`);
        }
        return out;
      });
      expect(moving, 'elements still animating under reduced motion').toEqual([]);
    });
  }
});

test.describe('@a11y reflow (WCAG 1.4.10)', () => {
  for (const width of [640, 320]) {
    for (const p of [PAGES[0], PAGES[1], PAGES[2], PAGES[6]]) {
      test(`${p.name} @${width}px has no horizontal scroll`, async ({ page, seed }) => {
        const path = p.path(seed);
        test.skip(!path, 'no data for this page');
        await page.setViewportSize({ width, height: 800 });
        await open(page, path!);
        const res = await page.evaluate(() => {
          const de = document.documentElement;
          const wide = [...document.querySelectorAll('body *')]
            .filter((el) => el.getBoundingClientRect().right > de.clientWidth + 1 && getComputedStyle(el).position !== 'fixed')
            .slice(0, 5)
            .map((el) => `${el.tagName.toLowerCase()}.${(el.getAttribute('class') ?? '').split(/\s+/).slice(0, 3).join('.')}`);
          return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, wide };
        });
        expect(res.scrollWidth, `scrollWidth vs viewport; overflowing: ${res.wide.join(', ')}`).toBeLessThanOrEqual(res.clientWidth + 1);
      });
    }
  }
});
