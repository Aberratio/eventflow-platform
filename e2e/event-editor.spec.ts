import { test, expect } from '../playwright-fixture';
import type { ConsoleMessage, Page } from '@playwright/test';
import { loginAs, pickDate } from './helpers';

// PP.16: the event wizard crashed on step 1 (both create and edit) because RichTextEditor's TipTap
// instance could be destroyed by its own 1ms timer before the component's sync effect ran, throwing
// "Cannot read properties of null (reading 'cached')" with no error boundary below the page. This spec
// walks the real wizard against a real backend and must never see the "Coś poszło nie tak" error
// screen, a tiptap duplicate-extension warning, or a React validateDOMNesting warning.

function trackConsoleIssues(page: Page) {
  const issues: string[] = [];
  page.on('pageerror', (err) => issues.push(`pageerror: ${err.message}`));
  page.on('console', (msg: ConsoleMessage) => {
    const text = msg.text();
    if (text.includes('validateDOMNesting') || text.includes('Duplicate extension names')) {
      issues.push(`console: ${text}`);
    }
  });
  return issues;
}

async function assertNoErrorScreen(page: Page) {
  await expect(page.getByText('Coś poszło nie tak')).toHaveCount(0);
}

async function advanceThroughWizard(page: Page, finalButtonName: RegExp, maxIterations = 25) {
  for (let i = 0; i < maxIterations; i++) {
    if (
      await page
        .getByRole('button', { name: finalButtonName })
        .isVisible()
        .catch(() => false)
    ) {
      return;
    }

    await page.getByRole('button', { name: 'Zapisz i przejdź dalej' }).click();
    await assertNoErrorScreen(page);

    // If the distances sub-step is empty (create flow only — the edit flow's seeded event already has
    // distances), the click above surfaces a validation error instead of advancing. Add one distance
    // and retry.
    const distanceValidationError = page.getByText('Dodaj przynajmniej jeden dystans');
    if (await distanceValidationError.isVisible().catch(() => false)) {
      await page
        .getByRole('button', { name: /Dodaj pierwszy dystans|Dodaj dystans/i })
        .first()
        .click();
      await page.getByPlaceholder('np. Maraton').first().fill('5K');
      await page.getByPlaceholder('42.195').first().fill('5');
      await page.getByPlaceholder('150').first().fill('60');
      await page.getByPlaceholder('500').first().fill('200');
      await page.getByRole('button', { name: 'Zapisz i przejdź dalej' }).click();
      await assertNoErrorScreen(page);
    }
  }

  throw new Error(
    `Wizard did not reach the "${finalButtonName}" step within ${maxIterations} clicks`,
  );
}

test.describe('Event editor (PP.16)', () => {
  test('organizer creates a draft event with a rich-text description', async ({ page }) => {
    const issues = trackConsoleIssues(page);
    await loginAs(page, 'organizer');

    await page.goto('/organizer/events/new');
    await expect(page.getByRole('heading', { name: 'Nowe wydarzenie' })).toBeVisible();
    await assertNoErrorScreen(page);

    await page.locator('#name').fill(`E2E Edytor ${Date.now()}`);
    await pickDate(page, 'date', '2026-12-12');
    await pickDate(page, 'deadline', '2026-12-01');
    await page.locator('#location').fill('Stadion E2E');
    await page.locator('#city').fill('Warszawa');

    const descriptionEditor = page.getByRole('textbox', { name: 'Opis wydarzenia' });
    await expect(descriptionEditor).toBeVisible();
    await descriptionEditor.click();
    await page.keyboard.type('Opis ');
    await page.keyboard.press('Control+b');
    await page.keyboard.type('pogrubiony');

    // Select the last typed word (double-click selects a whole word in a contenteditable, unlike
    // counting Shift+ArrowLeft presses, which raced ProseMirror's own input processing and produced a
    // flaky partial selection), then add a link through the dialog.
    await descriptionEditor.getByText('pogrubiony').dblclick();
    await page.getByRole('button', { name: 'Dodaj link' }).click();
    await page.getByLabel('Adres URL').fill('biuro@example.pl');
    await page.keyboard.press('Enter');
    await expect(descriptionEditor.locator('a[href="mailto:biuro@example.pl"]')).toHaveText(
      'pogrubiony',
    );

    await assertNoErrorScreen(page);

    await advanceThroughWizard(page, /Utwórz wydarzenie/);

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith('/events') && r.request().method() === 'POST'),
      page.getByRole('button', { name: /Utwórz wydarzenie/ }).click(),
    ]);

    const body = await response.json();
    const description: string = body.data?.description ?? body.description ?? '';
    expect(description).toContain('<strong>');
    expect(description).toContain('href="mailto:biuro@example.pl"');

    expect(issues).toEqual([]);
  });

  test('organizer edits a seeded event description', async ({ page }) => {
    const issues = trackConsoleIssues(page);
    await loginAs(page, 'organizer');

    await page.goto('/organizer/events/e-bank-transfer/edit');
    await expect(page.getByRole('heading', { name: 'Edytuj wydarzenie' })).toBeVisible();
    await assertNoErrorScreen(page);

    const descriptionEditor = page.getByRole('textbox', { name: 'Opis wydarzenia' });
    await expect(descriptionEditor).toContainText('Kameralny bieg lokalny');

    await descriptionEditor.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type(' Edycja E2E');

    await assertNoErrorScreen(page);

    await advanceThroughWizard(page, /Zapisz zmiany/);

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith('/events/e-bank-transfer') && r.request().method() === 'PATCH',
      ),
      page.getByRole('button', { name: 'Zapisz zmiany' }).click(),
    ]);

    const body = await response.json();
    const description: string = body.data?.description ?? body.description ?? '';
    expect(description).toContain('Edycja E2E');

    expect(issues).toEqual([]);
  });
});
