import { existsSync, readFileSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Local, git-ignored KEY=value file (e.g. E2E_DEV_PASSWORD). Real environment variables win.
if (existsSync('.env.e2e-dev')) {
  for (const line of readFileSync('.env.e2e-dev', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

// Suite for the deployed dev environment (no local servers, no mocks).
//   npm run test:e2e:dev
// Signed-in tests use the seeded demo accounts (e2e-dev/support/accounts.ts) with E2E_DEV_PASSWORD.
// The dev host throttles (429, Retry-After 300) when hit too fast: keep DEV_WORKERS low (default 2).
// retries stay 0 so a flaky test shows up as red instead of passing on the second try.
export default defineConfig({
  testDir: './e2e-dev',
  timeout: 45000,
  expect: { timeout: 15000 },
  fullyParallel: true,
  workers: Number(process.env.DEV_WORKERS || 2),
  retries: Number(process.env.DEV_RETRIES || 0),
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-dev' }],
    ['junit', { outputFile: 'test-results-dev/junit.xml' }],
  ],
  outputDir: 'test-results-dev/artifacts',
  use: {
    baseURL: process.env.DEV_BASE_URL || 'https://portal-dev.zmierzymyczas.kokot.it',
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
