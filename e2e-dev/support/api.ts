import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import { API } from './env';

/**
 * The dev host (LiteSpeed) answers 429 with Retry-After: 300 when hit too fast. Waiting that out
 * inside a test is pointless, so a 429 fails the call at once with a recognisable message: it is an
 * environment problem, not an application defect, and must not be reported as one.
 */
export class DevThrottledError extends Error {
  constructor(method: string, path: string, retryAfter: string | undefined) {
    super(
      `DEV_THROTTLED: ${method} ${path} got 429 (Retry-After: ${retryAfter ?? '?'}s). Lower workers or wait.`,
    );
  }
}

export interface ApiEnvelope<T> {
  success?: boolean;
  data: T;
  message?: string;
  meta?: { total?: number; page?: number; pageSize?: number; totalPages?: number };
  error?: { code?: string; message?: string };
}

export interface CallOptions {
  token?: string;
  data?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
}

const url = (path: string): string => (path.startsWith('http') ? path : `${API}${path}`);

/** Raw call: returns the response whatever its status (except 429). Use for negative tests. */
export async function call(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  opts: CallOptions = {},
): Promise<APIResponse> {
  const headers: Record<string, string> = { Accept: 'application/json', ...opts.headers };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const res = await request.fetch(url(path), {
    method,
    headers,
    data: opts.data,
    params: opts.params,
    failOnStatusCode: false,
  });
  if (res.status() === 429) throw new DevThrottledError(method, path, res.headers()['retry-after']);
  return res;
}

/** GET expecting 2xx; returns the `data` field of the envelope. */
export async function getData<T>(
  request: APIRequestContext,
  path: string,
  opts: CallOptions = {},
): Promise<T> {
  const res = await call(request, 'GET', path, opts);
  expect(res.ok(), `GET ${path} -> ${res.status()}`).toBeTruthy();
  const json = (await res.json()) as ApiEnvelope<T>;
  return json.data;
}
