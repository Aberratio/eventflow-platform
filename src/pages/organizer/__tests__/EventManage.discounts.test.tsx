import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Event } from '@/types';
import { createFakeEventServer } from '@/test/fakeEventServer';
import EventManage from '../EventManage';

const getEventById = vi.fn();
const getRegistrationsByEvent = vi.fn();
const updateEvent = vi.fn();

vi.mock('@/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api')>()),
  getEventById: (...args: unknown[]) => getEventById(...args),
  getRegistrationsByEvent: (...args: unknown[]) => getRegistrationsByEvent(...args),
  updateEvent: (...args: unknown[]) => updateEvent(...args),
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
  discountCodes: [
    {
      id: 'dc-seed',
      code: 'SEED',
      discountType: 'percent',
      discountValue: 10,
      usedCount: 3,
      active: true,
    },
  ],
} as unknown as Event;

const sentIds = (callIndex: number) =>
  (
    updateEvent.mock.calls[callIndex][1] as { discountCodes: Array<{ id: string }> }
  ).discountCodes.map((code) => code.id);

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/organizer/events/e1/discounts']}>
        <Routes>
          <Route path="/organizer/events/:id/:tab" element={<EventManage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('EventManage discount codes tab child ids', () => {
  let server: ReturnType<typeof createFakeEventServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    server = createFakeEventServer([event]);
    getEventById.mockImplementation(async () => ({
      success: true,
      data: structuredClone(server.event('e1')),
    }));
    getRegistrationsByEvent.mockResolvedValue({ success: true, data: [] });
    updateEvent.mockImplementation(async (id: string, payload: Record<string, unknown>) =>
      server.update(id, payload),
    );
  });

  it('sends the server id of a freshly added code in the next save', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Dodaj kod' }));
    await user.type(screen.getByPlaceholderText('np. SUMMER2026'), 'NEW');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Dodaj kod' }));
    await waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
    await screen.findByText('NEW');

    await waitFor(() => expect(screen.getAllByRole('switch')).toHaveLength(2));
    await user.click(screen.getAllByRole('switch')[1]);
    await waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(2));
    expect(sentIds(1)).toEqual(['dc-seed', 'srv-1']);
    expect(server.event('e1').discountCodes.map((c) => c.id)).toEqual(['dc-seed', 'srv-1']);
  }, 20000);

  it('serializes a change made before the first response lands', async () => {
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    updateEvent.mockImplementationOnce(async (id: string, payload: Record<string, unknown>) => {
      const response = server.update(id, payload);
      await firstGate;
      return response;
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Dodaj kod' }));
    await user.type(screen.getByPlaceholderText('np. SUMMER2026'), 'NEW');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Dodaj kod' }));
    await waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getAllByRole('switch')).toHaveLength(2));
    await user.click(screen.getAllByRole('switch')[1]);

    expect(updateEvent).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseFirst();
    });
    await waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(2));
    expect(sentIds(1)).toEqual(['dc-seed', 'srv-1']);
    expect(server.event('e1').discountCodes.map((c) => c.id)).toEqual(['dc-seed', 'srv-1']);
    await waitFor(() => expect(screen.getByText('Nieaktywny')).toBeInTheDocument());
  }, 20000);
});
