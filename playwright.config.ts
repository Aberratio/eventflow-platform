import { defineConfig, devices } from '@playwright/test';

const useMockApi =
  process.env.PLAYWRIGHT_USE_MOCKS ??
  (process.env.npm_lifecycle_event === 'test:e2e:smoke' ? 'true' : 'false');

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
    },
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
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
        // e2e/helpers.ts logs in with accounts seeded by
        // database/seeders/001_demo.sql in the server repo, so the API needs
        // to be migrated and seeded before any spec runs (E0.4). Skipped
        // when the suite runs against mocks (test:e2e:smoke), since there is
        // no real backend to talk to in that mode.
        ...(useMockApi === 'true'
          ? []
          : [
              {
                command: 'node e2e/start-backend.mjs',
                url: 'http://localhost:8081/api/v1/health',
                reuseExistingServer: true,
                timeout: 180000,
                stdout: 'pipe' as const,
                stderr: 'pipe' as const,
              },
            ]),
        {
          command: 'npm run dev -- --host 127.0.0.1 --port 5173',
          port: 5173,
          reuseExistingServer: true,
          env: {
            ...process.env,
            VITE_API_URL: '',
            VITE_ENABLE_MOCKS: useMockApi,
          },
        },
      ],
});
