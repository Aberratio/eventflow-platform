import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpAdapter } from '../http.adapter';

// POST /registrations/{id}/distance-change[/quote]
describe('httpAdapter distance change', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true, data: {} }),
    } as unknown as Response);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('quotes through POST .../distance-change/quote with the chosen distance and variant', async () => {
    await httpAdapter.quoteDistanceChange('r 1', { distanceId: 'd2', pricingVariantId: 'v1' });

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url.endsWith('/registrations/r%201/distance-change/quote')).toBe(true);
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ distanceId: 'd2', pricingVariantId: 'v1' });
  });

  it('changes through POST .../distance-change', async () => {
    await httpAdapter.changeRegistrationDistance('r1', { distanceId: 'd2' });

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url.endsWith('/registrations/r1/distance-change')).toBe(true);
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ distanceId: 'd2' });
  });
});
