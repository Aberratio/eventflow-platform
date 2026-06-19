import { expect, type Page } from '@playwright/test';

export const credentialsByRole = {
  participant: { email: 'jan@example.com', landingPath: /\/participant/ },
  organizer: { email: 'marek@timing.pl', landingPath: /\/organizer/ },
  moderator: { email: 'monika@zmierzymyczas.pl', landingPath: /\/moderator/ },
  admin: { email: 'admin@zmierzymyczas.pl', landingPath: /\/admin/ },
  superadmin: { email: 'superadmin@zmierzymyczas.pl', landingPath: /\/admin/ },
} as const;

export type TestRole = keyof typeof credentialsByRole;

export async function dismissCookies(page: Page): Promise<void> {
  const acceptCookies = page.getByRole('button', { name: /Akceptuj wszystkie/i });
  if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
    await acceptCookies.click();
  }
}

export async function loginAs(page: Page, role: TestRole): Promise<void> {
  const credentials = credentialsByRole[role];

  await page.goto('/login');
  await dismissCookies(page);
  await page.locator('input[type="email"]').fill(credentials.email);
  await page.locator('input[type="password"]').fill('demo1234');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(credentials.landingPath, { timeout: 10000 });
}

export function seededSlug(name: string): string {
  return `e2e-${name}`;
}
