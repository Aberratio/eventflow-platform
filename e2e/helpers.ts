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
  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().endsWith('/auth/login') && res.request().method() === 'POST',
      { timeout: 15000 },
    ),
    page.locator('button[type="submit"]').click(),
  ]);
  expect(response.status(), `POST /auth/login as ${role}`).toBe(200);
  await expect(page).toHaveURL(credentials.landingPath, { timeout: 10000 });
}

// Dashboard sidebars (admin, moderator, organizer) render <button>s on desktop, not ARIA tabs.
export async function openDashboardSection(page: Page, label: string | RegExp): Promise<void> {
  const item = page.getByRole('button', { name: label, exact: typeof label === 'string' });
  await expect(item).toBeVisible();
  await item.click();
}

// Local date as YYYY-MM-DD, `days` from today (negative for the past).
export function isoDaysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const POLISH_MONTHS = [
  'styczeń',
  'luty',
  'marzec',
  'kwiecień',
  'maj',
  'czerwiec',
  'lipiec',
  'sierpień',
  'wrzesień',
  'październik',
  'listopad',
  'grudzień',
];

// The event date fields (#date, #deadline) are a react-day-picker popover, not a fillable text input.
// Open the popover, page to the target month, then click the day cell that is not an "outside"
// (adjacent month) day.
export async function pickDate(page: Page, triggerId: string, isoDate: string): Promise<void> {
  const [year, month, day] = isoDate.split('-').map(Number);

  await page.locator(`#${triggerId}`).click();
  const dialog = page.getByRole('dialog').last();
  const caption = dialog.locator('[aria-live="polite"]');
  const initialText = (await caption.textContent())?.trim() ?? '';
  const [initMonthName, initYearStr] = initialText.split(' ');
  const initMonthIndex = POLISH_MONTHS.indexOf(initMonthName);
  const initYear = Number(initYearStr);
  const diffMonths = year * 12 + (month - 1) - (initYear * 12 + initMonthIndex);

  const button = dialog.getByRole('button', {
    name: diffMonths >= 0 ? 'Go to next month' : 'Go to previous month',
  });
  for (let i = 0; i < Math.abs(diffMonths); i++) {
    await button.click();
  }

  await dialog
    .locator('button[role="gridcell"]:not(.day-outside)', { hasText: new RegExp(`^${day}$`) })
    .click();
  await expect(dialog).toHaveCount(0);
}

export const WIZARD_NEXT_BUTTON = 'Zapisz i przejdź dalej';

export async function wizardSubStep(page: Page): Promise<string> {
  return (await page.getByTestId('event-form-step').getAttribute('data-substep')) ?? '';
}

async function readWizardPosition(page: Page): Promise<string> {
  const form = page.getByTestId('event-form-step');
  return `${await form.getAttribute('data-step')}/${await form.getAttribute('data-substep')}`;
}

// Clicks "Zapisz i przejdź dalej" and waits until the wizard moved to another step/sub-step. A blind
// click walk raced the step transition (PP.15). When the section blocks (validation), the wait times
// out and the error names the validation toast, if any.
export async function clickNextAndSettle(page: Page): Promise<void> {
  await expect(page.getByText('Coś poszło nie tak')).toHaveCount(0);
  const before = await readWizardPosition(page);
  await page.getByRole('button', { name: WIZARD_NEXT_BUTTON }).click();
  try {
    await expect(async () => {
      expect(await readWizardPosition(page)).not.toBe(before);
    }).toPass({ timeout: 10000 });
  } catch (error) {
    const blocked = await page
      .getByText('Uzupełnij tę sekcję')
      .first()
      .isVisible()
      .catch(() => false);
    throw new Error(
      `Wizard stayed on ${before} after "${WIZARD_NEXT_BUTTON}"${blocked ? ' (blocked by validation)' : ''}: ${error}`,
    );
  }
  await expect(page.getByText('Coś poszło nie tak')).toHaveCount(0);
}

export async function addFirstDistance(page: Page, price = '60'): Promise<void> {
  await page
    .getByRole('button', { name: /Dodaj pierwszy dystans|Dodaj dystans/i })
    .first()
    .click();
  await page.getByPlaceholder('np. Maraton').first().fill('5K');
  await page.getByPlaceholder('42.195').first().fill('5');
  await page.getByPlaceholder('150').first().fill(price);
  await page.getByPlaceholder('500').first().fill('200');
}

// Walks the wizard with "Zapisz i przejdź dalej" until the final button is visible, adding one distance
// when the create flow reaches the empty distances sub-step (the edit flow's seeded event has some).
export async function advanceThroughWizard(
  page: Page,
  finalButtonName: RegExp,
  maxIterations = 25,
): Promise<void> {
  for (let i = 0; i < maxIterations; i++) {
    if (
      await page
        .getByRole('button', { name: finalButtonName })
        .isVisible()
        .catch(() => false)
    ) {
      return;
    }

    if (
      (await wizardSubStep(page)) === 'distances' &&
      (await page
        .getByRole('button', { name: /Dodaj pierwszy dystans/i })
        .isVisible()
        .catch(() => false))
    ) {
      await addFirstDistance(page);
    }

    await clickNextAndSettle(page);
  }

  throw new Error(
    `Wizard did not reach the "${finalButtonName}" step within ${maxIterations} clicks`,
  );
}
