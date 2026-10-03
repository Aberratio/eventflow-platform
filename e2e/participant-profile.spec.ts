import { test, expect } from '../playwright-fixture';
import { loginAs } from './helpers';

// Rendering only: never submit a password change here. Every spec logs in as
// the same seeded participant, so a mutation would break parallel runs.
test.describe('Participant profile tab', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'participant');
  });

  const expectProfile = async (page: import('@playwright/test').Page) => {
    await expect(page.getByRole('tab', { name: /Profil/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const panel = page.getByRole('tabpanel');
    await expect(panel).toContainText('Dane podstawowe');
    await expect(page.getByRole('heading', { name: 'Zmiana hasła' })).toBeVisible();
  };

  test('clicking the Profil tab shows the profile', async ({ page }) => {
    await page.getByRole('tab', { name: /Profil/ }).click();
    await expectProfile(page);
  });

  test('/participant/profile opens the profile', async ({ page }) => {
    await page.goto('/participant/profile');
    await expectProfile(page);
  });

  test('/participant?tab=profile opens the profile', async ({ page }) => {
    await page.goto('/participant?tab=profile');
    await expectProfile(page);
  });
});
