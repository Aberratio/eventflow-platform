// Single source for the e2e network layout. CI uses the defaults; lanes override via env.
export const API_URL = (process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:8081/api/v1').replace(
  /\/$/,
  '',
);
export const FRONTEND_PORT = Number(process.env.PLAYWRIGHT_FRONTEND_PORT ?? 5173);
export const FRONTEND_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${FRONTEND_PORT}`;
