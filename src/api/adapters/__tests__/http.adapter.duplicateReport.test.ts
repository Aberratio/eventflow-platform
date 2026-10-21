import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpAdapter } from '../http.adapter';

const okResponse = (data: unknown, status = 200) =>
  ({
    ok: true,
    status,
    json: vi.fn().mockResolvedValue({ success: true, data }),
  }) as unknown as Response;

// POST /competitors/{id}/duplicate-reports, GET /admin/competitors/duplicate-reports
describe('httpAdapter competitor duplicate reports', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('posts the report to the competitor duplicate-reports route', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      okResponse({ id: 'r1', competitorId: 'c 1', duplicateOfId: 'c2', status: 'open' }, 201),
    );

    const res = await httpAdapter.reportCompetitorDuplicate('c 1', {
      duplicateOfId: 'c2',
      note: 'Ta sama osoba',
    });

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url.endsWith('/competitors/c%201/duplicate-reports')).toBe(true);
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ duplicateOfId: 'c2', note: 'Ta sama osoba' });
    expect(res.data.status).toBe('open');
  });

  it('lists the open reports for staff', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(okResponse([{ id: 'r1', status: 'open' }]));

    const res = await httpAdapter.listCompetitorDuplicateReports();

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url.endsWith('/admin/competitors/duplicate-reports')).toBe(true);
    expect(init.method ?? 'GET').toBe('GET');
    expect(res.data).toHaveLength(1);
  });

  it('passes the status filter to the queue list', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(okResponse([]));

    await httpAdapter.listCompetitorDuplicateReports('rejected');

    const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url.endsWith('/admin/competitors/duplicate-reports?status=rejected')).toBe(true);
  });

  it('rejects a report with an optional reason via PATCH', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      okResponse({ id: 'r 1', status: 'rejected', rejectReason: 'Różne osoby' }),
    );

    const res = await httpAdapter.rejectCompetitorDuplicateReport('r 1', 'Różne osoby');

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url.endsWith('/admin/competitors/duplicate-reports/r%201')).toBe(true);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(String(init.body))).toEqual({ status: 'rejected', reason: 'Różne osoby' });
    expect(res.data.status).toBe('rejected');
  });
});
