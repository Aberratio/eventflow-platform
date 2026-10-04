import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Event, Registration } from '@/types';
import EventManage from '../EventManage';

const getEventById = vi.fn();
const getRegistrationsByEvent = vi.fn();

vi.mock('@/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api')>()),
  getEventById: (...args: unknown[]) => getEventById(...args),
  getRegistrationsByEvent: (...args: unknown[]) => getRegistrationsByEvent(...args),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'organizer-1', role: 'organizer' } }),
}));

vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const event = {
  id: 'e1',
  name: 'Bieg Testowy',
  slug: 'bieg-testowy',
  discipline: 'running',
  date: '2026-06-15',
  location: 'Park',
  city: 'Warszawa',
  description: 'Test',
  imageUrl: '/test.jpg',
  distances: [],
  organizerId: 'organizer-1',
  organizerName: 'Organizator',
  publicationStatus: 'published',
  registrationDeadline: '2026-06-01',
  featured: false,
} as Event;

const registration = {
  id: 'r1',
  eventId: 'e1',
  eventName: 'Bieg Testowy',
  userId: 'u1',
  userName: 'Anna Kowalska',
  userEmail: 'anna@example.com',
  distanceId: 'd1',
  distanceName: '10 km',
  category: 'K',
  registeredAt: '2026-05-01T10:00:00Z',
  status: 'pending',
} as Registration;

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/organizer/events/e1/participants']}>
        <Routes>
          <Route path="/organizer/events/:id/:tab" element={<EventManage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('EventManage participants tab (PP.46)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getEventById.mockResolvedValue({ success: true, data: event });
  });

  it('shows registrations that arrive after the event has already rendered', async () => {
    let resolveRegistrations!: (value: unknown) => void;
    getRegistrationsByEvent.mockReturnValue(
      new Promise((resolve) => {
        resolveRegistrations = resolve;
      }),
    );
    renderPage();

    // Wait until the event has rendered, so the page is up while registrations are still pending.
    expect(await screen.findByRole('heading', { name: 'Bieg Testowy' })).toBeInTheDocument();
    expect(screen.getByText('Ładowanie uczestników...')).toBeInTheDocument();

    await act(async () => {
      resolveRegistrations({ success: true, data: [registration] });
    });

    expect(
      await screen.findByRole('heading', { name: /Uczestnicy\s*\(\s*1\s*\)/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Anna Kowalska').length).toBeGreaterThan(0);
  });

  it('shows a Polish error placeholder when the registrations query fails', async () => {
    getRegistrationsByEvent.mockRejectedValue(new Error('boom'));
    renderPage();

    expect(await screen.findByText('Nie udało się wczytać listy uczestników.')).toBeInTheDocument();
    expect(screen.queryByText('Ładowanie uczestników...')).not.toBeInTheDocument();
  });
});
