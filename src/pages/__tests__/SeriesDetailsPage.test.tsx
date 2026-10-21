import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SeriesDetailsPage from '../SeriesDetailsPage';

// The classification used to be computed client-side from getEvents()/getResults()
// (a page of 25 events). It must come from GET /series/{id}/ranking.

const { getSeriesRanking, getResults } = vi.hoisted(() => ({
  getSeriesRanking: vi.fn(),
  getResults: vi.fn(),
}));

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getSeriesBySlug: vi.fn().mockResolvedValue({
      data: {
        id: 's1',
        slug: 'puchar',
        name: 'Puchar Testowy',
        type: 'cup',
        eventIds: [],
        description: '',
      },
    }),
    getEvents: vi.fn().mockResolvedValue({ data: [] }),
    getResults,
    getSeriesRanking,
  };
});

describe('SeriesDetailsPage classification', () => {
  it('renders the server ranking from getSeriesRanking(seriesId)', async () => {
    getSeriesRanking.mockResolvedValue({
      data: {
        hasPoints: true,
        entries: [
          {
            rank: 1,
            userId: 'u1',
            name: 'Anna Nowak',
            isAnonymized: false,
            points: 120,
            isCompleted: true,
          },
          {
            rank: 1,
            userId: 'u2',
            name: 'Zawodnik anonimowy',
            isAnonymized: true,
            points: 120,
            isCompleted: true,
          },
        ],
      },
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/series/puchar']}>
          <Routes>
            <Route path="/series/:slug" element={<SeriesDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Anna Nowak')).toBeInTheDocument();
    expect(screen.getByText('Zawodnik anonimowy')).toBeInTheDocument();
    expect(getSeriesRanking).toHaveBeenCalledWith('s1');
    expect(getResults).not.toHaveBeenCalled();
  });
});
