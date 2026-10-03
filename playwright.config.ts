import { defineConfig, devices } from '@playwright/test';
import { API_URL, FRONTEND_PORT, FRONTEND_URL } from './e2e/env';

export default defineConfig({
  testDir: './e2e',
  // 60 s: `php -S` serves one request at a time, so a slow request left behind by the previous test
  // can delay the next login by tens of seconds.
  timeout: 60000,
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
    },
  },
  // The API under test is `php -S`, which serves one request at a time; specs also share one seeded
  // database and some mutate it in a fixed order (event-workflows lifecycle). Serial and no retries,
  // so a red run is a real signal (PP.15).
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: FRONTEND_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : [
        // e2e/helpers.ts logs in with accounts seeded by database/seeders/001_demo.sql in the
        // server repo, so the API is migrated and seeded before any spec runs (see
        // e2e/start-backend.mjs). There is no mock mode: the specs need the real API.
        {
          command: 'node e2e/start-backend.mjs',
          url: `${API_URL}/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 180000,
          stdout: 'pipe',
          stderr: 'pipe',
        },
        {
          command: `npm run dev -- --host 127.0.0.1 --port ${FRONTEND_PORT} --strictPort`,
          url: FRONTEND_URL,
          reuseExistingServer: !process.env.CI,
          env: { ...process.env, VITE_API_URL: API_URL },
        },
      ],
});
