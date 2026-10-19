import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import AthleteProfilePage from '../AthleteProfilePage';

// D-05: the page asked for pageSize 1000, the API caps a page at 100, so an athlete's event that
// sat beyond the first 100 events lost its name/date/discipline without any error.

const { getEvents } = vi.hoisted(() => ({ getEvents: vi.fn() }));

const events = Array.from({ length: 250 }, (_, i) => ({
  id: `e${i + 1}`,
  name: `Wydarzenie ${i + 1}`,
  slug: `w-${i + 1}`,
  date: '2026-05-01',
  discipline: 'running',
  city: 'Warszawa',
}));

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getEvents,
    getResultsByUser: vi.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: 'r1',
          eventId: 'e250',
          eventName: 'Wydarzenie 250',
          distanceId: 'd1',
          distanceName: '10 km',
          userId: 'u1',
          userName: 'Jan Biegacz',
          time: '00:40:00',
          timeInSeconds: 2400,
          position: 1,
          categoryPosition: 1,
          status: 'finished',
        },
      ],
    }),
  };
});

describe('AthleteProfilePage', () => {
  it('resolves an event that is beyond the first API page of 100', async () => {
    getEvents.mockImplementation(async (f: { page?: number; pageSize?: number }) => {
      const size = Math.min(f.pageSize ?? 25, 100); // the real API's cap
      const page = f.page ?? 1;
      return {
        data: events.slice((page - 1) * size, page * size),
        total: events.length,
        page,
        pageSize: size,
        totalPages: Math.ceil(events.length / size),
      };
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/athletes/u1']}>
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                <Routes>
                  <Route path="/athletes/:userId" element={<AthleteProfilePage />} />
                </Routes>
              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect((await screen.findAllByText('Wydarzenie 250')).length).toBeGreaterThan(0);
  });
});
