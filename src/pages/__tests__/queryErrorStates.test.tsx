import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ApiRequestError } from '@/api/errors';
import EventsPage from '../EventsPage';
import ShopPage from '../ShopPage';
import SeriesListPage from '../SeriesListPage';
import ChallengesListPage from '../ChallengesListPage';
import EventDetailsPage from '../EventDetailsPage';
import SeriesDetailsPage from '../SeriesDetailsPage';
import ShopProductPage from '../ShopProductPage';
import ChallengeDetailsPage from '../ChallengeDetailsPage';
import { DynamicInfoPage } from '@/components/info/DynamicInfoPage';

// D-02: a failed request (5xx / network / timeout) used to render the same "not found" copy as
// a genuinely missing record. These pin the difference: failure -> error state + retry,
// 200/404-as-null -> "not found".

const api = vi.hoisted(() => ({
  getEvents: vi.fn(),
  getProducts: vi.fn(),
  getSeries: vi.fn(),
  getChallenges: vi.fn(),
  getEventBySlug: vi.fn(),
  getSeriesBySlug: vi.fn(),
  getProductBySlug: vi.fn(),
  getChallengeBySlug: vi.fn(),
  getInfoPageBySlug: vi.fn(),
}));

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return { ...actual, ...api };
});
vi.mock('@/api/allEvents', () => ({ getAllEvents: (...a: unknown[]) => api.getEvents(...a) }));

const serverError = () => new ApiRequestError('Błąd API 500', undefined, 500);
const ERROR_TITLE = 'Nie udało się pobrać danych';
const NOT_FOUND = /nie znaleziono|nie zostało znalezione|nie znaleziony|nie znalezione/i;

function renderAt(path: string, pattern: string, element: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Routes>
                <Route path={pattern} element={element} />
              </Routes>
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const cases: Array<[string, string, string, React.ReactElement, keyof typeof api]> = [
  ['EventsPage', '/events', '/events', <EventsPage />, 'getEvents'],
  ['ShopPage', '/shop', '/shop', <ShopPage />, 'getProducts'],
  ['SeriesListPage', '/series', '/series', <SeriesListPage />, 'getSeries'],
  ['ChallengesListPage', '/challenges', '/challenges', <ChallengesListPage />, 'getChallenges'],
  ['EventDetailsPage', '/events/:slug', '/events/bieg', <EventDetailsPage />, 'getEventBySlug'],
  ['SeriesDetailsPage', '/series/:slug', '/series/liga', <SeriesDetailsPage />, 'getSeriesBySlug'],
  ['ShopProductPage', '/shop/:slug', '/shop/koszulka', <ShopProductPage />, 'getProductBySlug'],
  [
    'ChallengeDetailsPage',
    '/challenges/:slug',
    '/challenges/wyzwanie',
    <ChallengeDetailsPage />,
    'getChallengeBySlug',
  ],
  ['DynamicInfoPage', '/info/:slug', '/info/o-nas', <DynamicInfoPage />, 'getInfoPageBySlug'],
];

describe('query error states', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    api.getEvents.mockResolvedValue({ data: [], total: 0 });
    api.getProducts.mockResolvedValue({ data: [] });
    api.getSeries.mockResolvedValue({ data: [] });
    api.getChallenges.mockResolvedValue({ data: [] });
  });

  describe.each(cases)('%s', (_name, pattern, path, element, failing) => {
    it('shows an error state with retry on 500, not "not found"', async () => {
      api[failing].mockRejectedValue(serverError());
      renderAt(path, pattern, element);

      expect((await screen.findAllByText(ERROR_TITLE)).length).toBeGreaterThan(0);
      expect(screen.queryByText(NOT_FOUND)).not.toBeInTheDocument();

      api[failing].mockClear();
      await userEvent.click(screen.getAllByRole('button', { name: 'Spróbuj ponownie' })[0]);
      await waitFor(() => expect(api[failing]).toHaveBeenCalledTimes(1));
    });
  });

  it('still says "not found" for an unknown product (data:null)', async () => {
    api.getProductBySlug.mockResolvedValue({ success: true, data: null });
    renderAt('/shop/x', '/shop/:slug', <ShopProductPage />);
    expect(await screen.findByText('Produkt nie znaleziony')).toBeInTheDocument();
    expect(screen.queryByText(ERROR_TITLE)).not.toBeInTheDocument();
  });
});
