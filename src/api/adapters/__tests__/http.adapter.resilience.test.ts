import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpAdapter } from '../http.adapter';
import { ApiRequestError } from '../../errors';

function res(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

const notFound = () =>
  res({ success: false, error: { code: 'not_found', message: 'Nie znaleziono' } }, 404);

/** Contract Rule: detail routes answer 404 now, 200 + data:null before. Both = "not found". */
const detailCalls: Array<[string, () => Promise<{ data: unknown }>]> = [
  ['getEventBySlug', () => httpAdapter.getEventBySlug('x')],
  ['getEventById', () => httpAdapter.getEventById('x')],
  ['getSeriesBySlug', () => httpAdapter.getSeriesBySlug('x')],
  ['getSeriesById', () => httpAdapter.getSeriesById('x')],
  ['getProductBySlug', () => httpAdapter.getProductBySlug('x')],
  ['getChallengeBySlug', () => httpAdapter.getChallengeBySlug('x')],
  ['getChallengeById', () => httpAdapter.getChallengeById('x')],
  ['getInfoPageBySlug', () => httpAdapter.getInfoPageBySlug('x')],
  ['getPartnerById', () => httpAdapter.getPartnerById('x')],
  ['getEventBackgroundById', () => httpAdapter.getEventBackgroundById('x')],
];

describe('httpAdapter resilience', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe.each(detailCalls)('%s', (_name, call) => {
    it('maps 404 not_found to data:null', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(notFound());
      await expect(call()).resolves.toMatchObject({ data: null });
    });

    it('keeps the legacy 200 data:null shape', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(res({ success: true, data: null }));
      await expect(call()).resolves.toMatchObject({ data: null });
    });

    it('still throws on 500', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(res({ success: false, error: {} }, 500));
      await expect(call()).rejects.toMatchObject({ status: 500 });
    });
  });

  it('rejects with a timeout ApiRequestError when the server never answers', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
    );
    const pending = httpAdapter.getSeriesBySlug('x');
    const assertion = expect(pending).rejects.toSatisfy(
      (e: unknown) => e instanceof ApiRequestError && e.code === 'timeout' && !!e.message,
    );
    await vi.advanceTimersByTimeAsync(15_000);
    await assertion;
  });

  it('does not time out a slow upload after 15 s', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.mocked(fetch).mockImplementation((_url, init) => {
      signal = init?.signal ?? undefined;
      return new Promise((resolve) =>
        setTimeout(() => resolve(res({ success: true, data: {} })), 30_000),
      );
    });
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    const pending = httpAdapter.uploadEventImage(file);
    await vi.advanceTimersByTimeAsync(30_000);
    await expect(pending).resolves.toBeDefined();
    expect(signal?.aborted).toBe(false);
  });
});
