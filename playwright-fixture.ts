import { test as base, expect } from '@playwright/test';

// Pre-accepts the cookie banner so it cannot intercept clicks (PP.15). Visual specs opt out because
// their baselines include the banner.
export const test = base.extend<{ preAcceptCookies: boolean }>({
  preAcceptCookies: [true, { option: true }],
  page: async ({ page, preAcceptCookies }, provide) => {
    if (preAcceptCookies) {
      await page.addInitScript(() => {
        window.localStorage.setItem(
          'cookie-consent',
          JSON.stringify({
            necessary: true,
            analytics: false,
            marketing: false,
            functional: false,
            timestamp: new Date().toISOString(),
          }),
        );
      });
    }
    await provide(page);
  },
});
export { expect };
