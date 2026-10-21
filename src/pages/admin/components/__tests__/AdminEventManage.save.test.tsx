import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Event } from '@/types';
import { createFakeEventServer } from '@/test/fakeEventServer';
import { AdminEventManage } from '../AdminEventManage';

const getEventById = vi.fn();
const getRegistrations = vi.fn();
const getUsers = vi.fn();
const updateEvent = vi.fn();

vi.mock('@/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api')>()),
  getEventById: (...args: unknown[]) => getEventById(...args),
  getRegistrations: (...args: unknown[]) => getRegistrations(...args),
  getUsers: (...args: unknown[]) => getUsers(...args),
  updateEvent: (...args: unknown[]) => updateEvent(...args),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'admin-1', role: 'admin' } }),
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
  discountCodes: [],
  merchandise: [],
} as unknown as Event;

type Payload = {
  discountCodes: Array<{ id: string }>;
  merchandise: Array<{ id: string }>;
  paymentMethods: Array<{ id: string }>;
};

const payloadAt = (callIndex: number) => updateEvent.mock.calls[callIndex][1] as Payload;
const ids = (rows: Array<{ id: string }>) => rows.map((row) => row.id);

let client: QueryClient;

const renderPage = () => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/admin/events/e1?tab=advanced']}>
        <Routes>
          <Route path="/admin/events/:id" element={<AdminEventManage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const saveButton = () => screen.getByRole('button', { name: /Zapisz zmiany/ });

const addDiscountCode = async (user: ReturnType<typeof userEvent.setup>, code: string) => {
  await user.click(await screen.findByRole('button', { name: 'Dodaj kod' }));
  await user.type(screen.getByPlaceholderText('np. SUMMER2026'), code);
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Dodaj kod' }));
};

const addMerchandise = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(await screen.findByRole('button', { name: 'Dodaj produkt' }));
  await user.type(screen.getByPlaceholderText('np. Koszulka pamiątkowa'), name);
  await user.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Dodaj produkt' }),
  );
};

describe('AdminEventManage advanced save child ids', () => {
  let server: ReturnType<typeof createFakeEventServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    server = createFakeEventServer([event]);
    getEventById.mockImplementation(async () => ({
      success: true,
      data: structuredClone(server.event('e1')),
    }));
    getRegistrations.mockResolvedValue({ success: true, data: [] });
    getUsers.mockResolvedValue({ success: true, data: [] });
    updateEvent.mockImplementation(async (id: string, payload: Record<string, unknown>) =>
      server.update(id, payload),
    );
  });

  it('sends the same child ids on a second save with no edits', async () => {
    const user = userEvent.setup();
    renderPage();
    await addDiscountCode(user, 'NEW');
    await addMerchandise(user, 'Koszulka');

    await user.click(saveButton());
    await waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(saveButton()).toBeEnabled());
    const first = payloadAt(0);
    expect(first.merchandise[0].id).toMatch(/^merch_/);
    expect(first.paymentMethods[0].id).toBe('pm1');

    await user.click(saveButton());
    await waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(2));
    const second = payloadAt(1);
    const stored = server.event('e1') as unknown as Payload;
    expect(ids(second.discountCodes)).toEqual(ids(stored.discountCodes));
    expect(ids(second.merchandise)).toEqual(ids(stored.merchandise));
    expect(ids(second.paymentMethods)).toEqual(ids(stored.paymentMethods));
    expect(ids(second.discountCodes)[0]).toMatch(/^srv-/);
    expect(ids(second.merchandise)[0]).toMatch(/^srv-/);
    expect(ids(second.paymentMethods).every((id) => id.startsWith('srv-'))).toBe(true);
    // rows were updated in place, not re-created
    expect(stored.discountCodes).toHaveLength(1);
    expect(stored.merchandise).toHaveLength(1);
    expect(stored.paymentMethods).toHaveLength(5);
  }, 20000);

  it('disables the save button while saving and keeps edits made in flight', async () => {
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
    await addDiscountCode(user, 'NEW');

    await user.click(saveButton());
    await waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
    expect(saveButton()).toBeDisabled();

    const liveResults = screen.getByPlaceholderText('https://example.com/live-results/...');
    await user.type(liveResults, 'https://live.example');

    await act(async () => {
      releaseFirst();
    });
    await waitFor(() => expect(saveButton()).toBeEnabled());
    expect(liveResults).toHaveValue('https://live.example');
    expect(screen.getByText('NEW')).toBeInTheDocument();
  }, 20000);

  it('does not wipe unsaved edits when the event is refetched in the background', async () => {
    const user = userEvent.setup();
    renderPage();
    const liveResults = await screen.findByPlaceholderText('https://example.com/live-results/...');
    await user.type(liveResults, 'https://draft.example');

    // another tab saved something: the refetched event is a new object
    server.event('e1').name = 'Bieg Testowy (zmieniony)';
    await act(async () => {
      await client.invalidateQueries({ queryKey: ['events', 'e1'] });
    });
    await waitFor(() => expect(getEventById.mock.calls.length).toBeGreaterThan(1));

    expect(liveResults).toHaveValue('https://draft.example');
  }, 20000);
});
