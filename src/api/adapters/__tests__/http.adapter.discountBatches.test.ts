import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpAdapter } from '../http.adapter';

const TOKEN_STORAGE_KEY = 'zmierzymy_czas_api_token';
const BASE = 'http://localhost:8081/api/v1/events/event-1/discount-code-batches';

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe('httpAdapter discount code batches (R-07)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(TOKEN_STORAGE_KEY, 'jwt-token');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('POSTs the batch parameters to the batches collection', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ success: true, data: { id: 'b1' } }, 201),
    );
    const input = {
      prefix: 'VIP',
      count: 5,
      discountType: 'percent' as const,
      discountValue: 10,
      maxUses: 1,
    };

    await httpAdapter.createDiscountCodeBatch('event-1', input);

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe(BASE);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual(input);
  });

  it('shows the server validation message for a rejected batch', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(
        {
          success: false,
          error: {
            code: 'validation_error',
            message: 'Liczba kodów musi mieścić się w zakresie 1-1000.',
            details: { field: 'count' },
          },
        },
        422,
      ),
    );

    await expect(
      httpAdapter.createDiscountCodeBatch('event-1', {
        count: 5000,
        discountType: 'percent',
        discountValue: 10,
        maxUses: 1,
      }),
    ).rejects.toThrow('Liczba kodów musi mieścić się w zakresie 1-1000.');
  });

  it('lists batches and loads one batch by id', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ success: true, data: [] }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { id: 'b 1', codes: [] } }));

    await httpAdapter.getDiscountCodeBatches('event-1');
    await httpAdapter.getDiscountCodeBatch('event-1', 'b 1');

    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(BASE);
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe(`${BASE}/b%201`);
  });

  it('downloads the CSV from the export route with the bearer token', async () => {
    const clickSpy = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:x'),
      revokeObjectURL: vi.fn(),
    });
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
      tag === 'a'
        ? ({ click: clickSpy, href: '', download: '' } as unknown as HTMLAnchorElement)
        : originalCreateElement(tag),
    );
    const headers = new Map([
      ['Content-Disposition', 'attachment; filename="kody-rabatowe-VIP.csv"'],
    ]);
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (name: string) => headers.get(name) ?? null },
      blob: vi.fn().mockResolvedValue(new Blob(['Kod'])),
    } as unknown as Response);

    await httpAdapter.exportDiscountCodeBatch('event-1', 'b1');

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/b1/export`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-token' }),
      }),
    );
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
