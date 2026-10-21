import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpAdapter } from '../http.adapter';

// POST /competitors/{id}/anonymization { isAnonymized }
describe('httpAdapter.setCompetitorAnonymization', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('posts the flag to the competitor anonymization route', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true, data: { id: 'c 1', isAnonymized: true } }),
    } as unknown as Response);

    const res = await httpAdapter.setCompetitorAnonymization('c 1', true);

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url.endsWith('/competitors/c%201/anonymization')).toBe(true);
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ isAnonymized: true });
    expect(res.data.isAnonymized).toBe(true);
  });
});
