import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpAdapter } from '../http.adapter';

function mockJsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

const lastCall = () => {
  const [url, init] = vi.mocked(fetch).mock.calls.at(-1) as [string, RequestInit];
  return { url, init, body: init.body ? JSON.parse(init.body as string) : undefined };
};

describe('httpAdapter result corrections', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the optional reason in the PATCH /results/{id} body', async () => {
    vi.mocked(fetch).mockResolvedValue(mockJsonResponse({ success: true, data: { id: 'r1' } }));

    await httpAdapter.updateResult('r1', {
      time: '00:44:10',
      timeInSeconds: 2650,
      reason: 'Błąd maty',
    });

    const { url, init, body } = lastCall();
    expect(url).toMatch(/\/results\/r1$/);
    expect(init.method).toBe('PATCH');
    expect(body.reason).toBe('Błąd maty');
  });

  it('sends corrected net time and places (incl. null) in the PATCH body', async () => {
    vi.mocked(fetch).mockResolvedValue(mockJsonResponse({ success: true, data: { id: 'r1' } }));

    await httpAdapter.updateResult('r1', {
      netTime: '00:44:00',
      netTimeInSeconds: 2640,
      position: 3,
      categoryPosition: null,
    });

    const { init, body } = lastCall();
    expect(init.method).toBe('PATCH');
    expect(body).toEqual({
      netTime: '00:44:00',
      netTimeInSeconds: 2640,
      position: 3,
      categoryPosition: null,
    });
  });

  it('reads the correction history from GET /results/{id}/corrections', async () => {
    const row = {
      id: 'c1',
      resultId: 'r1',
      correctedBy: 'u1',
      correctedByName: 'Anna Org',
      correctedAt: '2026-10-19T10:00:00+00:00',
      reason: 'Błąd maty',
      wasOfficial: true,
      changes: { time: { from: '00:45:00', to: '00:44:10' } },
    };
    vi.mocked(fetch).mockResolvedValue(mockJsonResponse({ success: true, data: [row] }));

    const response = await httpAdapter.getResultCorrections('r1');

    const { url, init } = lastCall();
    expect(url).toMatch(/\/results\/r1\/corrections$/);
    expect(init.method ?? 'GET').toBe('GET');
    expect(response.data[0].changes.time).toEqual({ from: '00:45:00', to: '00:44:10' });
    expect(response.data[0].wasOfficial).toBe(true);
  });
});
