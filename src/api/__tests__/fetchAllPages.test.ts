import { describe, expect, it, vi } from 'vitest';
import { fetchAllPages } from '../fetchAllPages';
import type { PaginatedResponse } from '../types';

/** A fake API holding `total` rows that serves at most 100 per page, like the real one. */
function fakeApi(total: number) {
  const rows = Array.from({ length: total }, (_, i) => ({ id: i + 1 }));
  let inFlight = 0;
  let maxInFlight = 0;
  const fetchPage = vi.fn(async (page: number, pageSize: number) => {
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((r) => setTimeout(r, 1));
    inFlight--;
    const size = Math.min(pageSize, 100);
    return {
      data: rows.slice((page - 1) * size, page * size),
      total,
      page,
      pageSize: size,
      totalPages: Math.ceil(total / size),
    } satisfies PaginatedResponse<{ id: number }>;
  });
  return { fetchPage, maxInFlight: () => maxInFlight };
}

describe('fetchAllPages', () => {
  it('collects 250 rows from 3 pages of 100, in order', async () => {
    const api = fakeApi(250);
    const result = await fetchAllPages(api.fetchPage);
    expect(api.fetchPage).toHaveBeenCalledTimes(3);
    expect(result.data).toHaveLength(250);
    expect(result.data.map((r) => r.id)).toEqual(Array.from({ length: 250 }, (_, i) => i + 1));
    expect(result.total).toBe(250);
  });

  it('makes a single request when everything fits on one page', async () => {
    const api = fakeApi(40);
    const result = await fetchAllPages(api.fetchPage);
    expect(api.fetchPage).toHaveBeenCalledTimes(1);
    expect(result.data).toHaveLength(40);
  });

  it('never runs more than 3 page requests at once', async () => {
    const api = fakeApi(1000);
    const result = await fetchAllPages(api.fetchPage);
    expect(result.data).toHaveLength(1000);
    expect(api.maxInFlight()).toBeLessThanOrEqual(3);
  });

  it('stops at a hard page limit when total is absurd', async () => {
    const fetchPage = vi.fn(async (page: number) => ({
      data: [{ id: page }],
      total: 10_000_000,
      page,
      pageSize: 100,
      totalPages: 100_000,
    }));
    await fetchAllPages(fetchPage);
    expect(fetchPage.mock.calls.length).toBeLessThanOrEqual(50);
  });

  it('propagates a failing page', async () => {
    const fetchPage = vi.fn(async (page: number) => {
      if (page === 2) throw new Error('boom');
      return { data: [{ id: page }], total: 250, page, pageSize: 100, totalPages: 3 };
    });
    await expect(fetchAllPages(fetchPage)).rejects.toThrow('boom');
  });
});
