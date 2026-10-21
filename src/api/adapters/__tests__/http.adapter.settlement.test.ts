import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpAdapter } from '../http.adapter';

const TOKEN_STORAGE_KEY = 'zmierzymy_czas_api_token';

describe('httpAdapter settlement report (R-03)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('requests the report with the period and optional event filter', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'jwt-token');
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true, data: { events: [] } }),
    } as unknown as Response);

    await httpAdapter.getSettlementReport({
      dateFrom: '2026-03-01',
      dateTo: '2026-03-31',
      eventId: 'evt-1',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8081/api/v1/admin/settlements?dateFrom=2026-03-01&dateTo=2026-03-31&eventId=evt-1',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-token' }),
      }),
    );
  });

  it('downloads the export with the chosen format and omits an empty event filter', async () => {
    const click = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:x'),
      revokeObjectURL: vi.fn(),
    });
    const original = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
      tag === 'a'
        ? ({ click, href: '', download: '' } as unknown as HTMLAnchorElement)
        : original(tag),
    );
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => null },
      blob: vi.fn().mockResolvedValue(new Blob(['x'])),
    } as unknown as Response);

    await httpAdapter.exportSettlementReport(
      { dateFrom: '2026-03-01', dateTo: '2026-03-31' },
      'xlsx',
    );

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8081/api/v1/admin/settlements/export?dateFrom=2026-03-01&dateTo=2026-03-31&format=xlsx',
      expect.anything(),
    );
    expect(click).toHaveBeenCalledTimes(1);
  });
});
