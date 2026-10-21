import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpAdapter } from '../http.adapter';

// GET /registrations/{id}/changes
describe('httpAdapter.getRegistrationChanges', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('reads the history of one registration', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true, data: [{ id: 'c1', type: 'cancelled' }] }),
    } as unknown as Response);

    const res = await httpAdapter.getRegistrationChanges('r 1');

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url.endsWith('/registrations/r%201/changes')).toBe(true);
    expect(init.method ?? 'GET').toBe('GET');
    expect(res.data[0].type).toBe('cancelled');
  });

  it('cancels through POST /registrations/{id}/cancel', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true, data: { id: 'r1', status: 'cancelled' } }),
    } as unknown as Response);

    await httpAdapter.cancelRegistration('r1');

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url.endsWith('/registrations/r1/cancel')).toBe(true);
    expect(init.method).toBe('POST');
  });
});
