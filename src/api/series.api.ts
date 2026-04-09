import { simulateDelay } from './client';
import type { ApiResponse, PaginatedResponse, SeriesFilters } from './types';
import { mockSeries } from './mock/series.mock';
import type { EventSeries } from '@/types';

export async function getSeries(filters?: SeriesFilters): Promise<PaginatedResponse<EventSeries>> {
  await simulateDelay();
  let filtered = [...mockSeries];

  if (filters?.type) filtered = filtered.filter((s) => s.type === filters.type);
  if (filters?.status) filtered = filtered.filter((s) => s.status === filters.status);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter((s) => s.name.toLowerCase().includes(q));
  }

  return {
    data: filtered,
    total: filtered.length,
    page: 1,
    pageSize: filtered.length,
    totalPages: 1,
  };
}

export async function getSeriesById(id: string): Promise<ApiResponse<EventSeries | null>> {
  await simulateDelay();
  const series = mockSeries.find((s) => s.id === id) ?? null;
  return { data: series, success: !!series };
}

export async function getSeriesBySlug(slug: string): Promise<ApiResponse<EventSeries | null>> {
  await simulateDelay();
  const series = mockSeries.find((s) => s.slug === slug) ?? null;
  return { data: series, success: !!series };
}
