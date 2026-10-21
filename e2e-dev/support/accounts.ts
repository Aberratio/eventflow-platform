import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { call, type ApiEnvelope } from './api';

/**
 * Seeded demo accounts (eventflow-server database/seeders/001_demo.sql). On dev they share one
 * password, SEED_DEMO_PASSWORD on the server, given to the tests as E2E_DEV_PASSWORD. An email can
 * be overridden with E2E_DEV_<ROLE>_EMAIL. The password is never logged or written anywhere.
 */
export const ACCOUNTS = {
  participant: 'jan@example.com',
  participant2: 'anna@example.com',
  organizer: 'marek@timing.pl',
  organizer2: 'ewa@runpoland.pl',
  moderator: 'monika@zmierzymyczas.pl',
  admin: 'admin@zmierzymyczas.pl',
  superadmin: 'superadmin@zmierzymyczas.pl',
} as const;

export type AccountKey = keyof typeof ACCOUNTS;

export const hasPassword = (): boolean => Boolean(process.env.E2E_DEV_PASSWORD);

export function emailFor(key: AccountKey): string {
  return process.env[`E2E_DEV_${key.toUpperCase()}_EMAIL`] || ACCOUNTS[key];
}

/** Call at the top of a describe that needs accounts. */
export function requireAccounts(): void {
  test.skip(!hasPassword(), 'needs E2E_DEV_PASSWORD (seeded demo accounts on dev)');
}

export interface Session {
  token: string;
  user: { id: string; role: string; email: string; name?: string } & Record<string, unknown>;
}

const sessions = new Map<AccountKey, Session>();

/** Logs in through the API once per worker and account; later calls reuse the token. */
export async function login(request: APIRequestContext, key: AccountKey): Promise<Session> {
  const cached = sessions.get(key);
  if (cached) return cached;
  const password = process.env.E2E_DEV_PASSWORD;
  if (!password) throw new Error('E2E_DEV_PASSWORD is not set');
  const res = await call(request, 'POST', '/auth/login', {
    data: { email: emailFor(key), password },
  });
  expect(res.status(), `login as ${key}`).toBe(200);
  const session = ((await res.json()) as ApiEnvelope<Session>).data;
  sessions.set(key, session);
  return session;
}

/** Forgets a cached session, e.g. after a test logged it out. */
export const dropSession = (key: AccountKey): void => {
  sessions.delete(key);
};

/**
 * Signs the page in by seeding the same localStorage keys the app writes after a login
 * (STORAGE_KEYS.API_TOKEN / STORAGE_KEYS.AUTH in src/constants), before any app script runs.
 */
export async function signIn(
  page: Page,
  request: APIRequestContext,
  key: AccountKey,
): Promise<Session> {
  const session = await login(request, key);
  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem('zmierzymy_czas_api_token', token);
      localStorage.setItem('zmierzymyczas_auth', user);
    },
    [session.token, JSON.stringify(session.user)] as const,
  );
  return session;
}
