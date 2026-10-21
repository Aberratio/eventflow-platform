import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpAdapter } from '../http.adapter';

// R-02: POST /registrations/{id}/transfer
describe('httpAdapter registration transfer (R-02)', () => {
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

  it('transfers through POST .../transfer with an existing competitor', async () => {
    await httpAdapter.transferRegistration('r 1', { competitorId: 'c9' });

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url.endsWith('/registrations/r%201/transfer')).toBe(true);
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ competitorId: 'c9' });
  });

  it('transfers to a new person', async () => {
    await httpAdapter.transferRegistration('r1', {
      newPerson: { firstName: 'Anna', lastName: 'Nowak', birthDate: '1990-05-01' },
    });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      newPerson: { firstName: 'Anna', lastName: 'Nowak', birthDate: '1990-05-01' },
    });
  });
});
