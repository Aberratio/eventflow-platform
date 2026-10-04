import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EventDetailsPage from '../EventDetailsPage';

// PP.55: the server is the only gate for private Events. The page forwards the link's
// `?access=` code as `accessCode` and trusts the 200/404; the server never sends the
// real code back to non-managers.

const mockGetEventBySlug = vi.fn();

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getEventBySlug: (...args: unknown[]) => mockGetEventBySlug(...args),
    getRegistrationsByEvent: vi.fn().mockResolvedValue({ data: [] }),
    getPublicStartList: vi.fn().mockResolvedValue({ data: [] }),
    getResultsByEvent: vi.fn().mockResolvedValue({ data: [] }),
  };
});

vi.mock('@/contexts/AuthContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return { ...actual, useAuth: () => ({ user: null, isAuthenticated: false }) };
});

vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/event-details', async () => {
  const actual = await vi.importActual<typeof import('@/components/event-details')>(
    '@/components/event-details',
  );
  return {
    ...actual,
    EventHeroBanner: ({ event }: { event: { name: string } }) => <h1>{event.name}</h1>,
    EventSidebar: () => null,
    EventInfoTab: () => null,
    EventDistancesTab: () => null,
    EventStartListTab: () => null,
    ResultsSection: () => null,
  };
});

const privateEvent = {
  id: 'e1',
  name: 'Prywatny Bieg',
  slug: 'bieg',
  discipline: 'running',
  date: new Date(Date.now() + 90 * 86400000).toISOString(),
  location: 'Park',
  city: 'Warszawa',
  description: 'Opis',
  imageUrl: '/x.jpg',
  organizerId: 'o1',
  organizerName: 'Org',
  publicationStatus: 'published',
  visibility: 'private',
  accessCode: null,
  registrationDeadline: new Date(Date.now() + 60 * 86400000).toISOString(),
  featured: false,
  distances: [],
};

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/events/:slug" element={<EventDetailsPage />} />
          <Route path="/events/:slug/:tab" element={<EventDetailsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EventDetailsPage private link', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockGetEventBySlug.mockReset();
  });

  it('forwards the access code from the URL and renders a private event returned without accessCode', async () => {
    mockGetEventBySlug.mockResolvedValue({ data: privateEvent });
    renderAt('/events/bieg?access=KOD');

    expect(await screen.findByText('Prywatny Bieg')).toBeInTheDocument();
    expect(screen.queryByText('Wydarzenie nie zostało znalezione')).not.toBeInTheDocument();
    expect(mockGetEventBySlug).toHaveBeenCalledWith('bieg', 'KOD');
  });

  it('remembers the accepted code for tab navigation', async () => {
    mockGetEventBySlug.mockResolvedValue({ data: privateEvent });
    const first = renderAt('/events/bieg?access=KOD');
    await screen.findByText('Prywatny Bieg');
    await waitFor(() => expect(sessionStorage.getItem('private-event-code:bieg')).toBe('KOD'));
    first.unmount();

    mockGetEventBySlug.mockClear();
    renderAt('/events/bieg/results');
    await screen.findByText('Prywatny Bieg');
    expect(mockGetEventBySlug).toHaveBeenCalledWith('bieg', 'KOD');
  });

  it('shows not found when the server rejects the code', async () => {
    mockGetEventBySlug.mockRejectedValue(new Error('Event not found'));
    renderAt('/events/bieg?access=ZLY');

    expect(await screen.findByText('Wydarzenie nie zostało znalezione')).toBeInTheDocument();
    expect(sessionStorage.getItem('private-event-code:bieg')).toBeNull();
  });
});
