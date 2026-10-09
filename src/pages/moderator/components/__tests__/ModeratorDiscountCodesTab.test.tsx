import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Event } from '@/types';
import { createFakeEventServer } from '@/test/fakeEventServer';
import { ModeratorDiscountCodesTab } from '../ModeratorDiscountCodesTab';

const getEvents = vi.fn();
const updateEvent = vi.fn();

vi.mock('@/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api')>()),
  getEvents: (...args: unknown[]) => getEvents(...args),
  updateEvent: (...args: unknown[]) => updateEvent(...args),
}));

Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', { value: () => false });
Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', { value: () => undefined });
Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', { value: () => undefined });
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { value: () => undefined });

const makeEvent = (id: string, name: string, withSeedCode: boolean) =>
  ({
    id,
    name,
    slug: id,
    city: 'Warszawa',
    distances: [],
    publicationStatus: 'published',
    discountCodes: withSeedCode
      ? [
          {
            id: 'dc-seed',
            code: 'SEED',
            discountType: 'percent',
            discountValue: 10,
            usedCount: 3,
            active: true,
          },
        ]
      : [],
  }) as unknown as Event;

const sentIds = (callIndex: number) =>
  (
    updateEvent.mock.calls[callIndex][1] as { discountCodes: Array<{ id: string }> }
  ).discountCodes.map((code) => code.id);

const renderTab = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ModeratorDiscountCodesTab />
    </QueryClientProvider>,
  );
};

type User = ReturnType<typeof userEvent.setup>;

const pickEvent = async (user: User, name: RegExp) => {
  await user.click(await screen.findByRole('combobox'));
  await user.click(await screen.findByRole('option', { name }));
};

const addCode = async (user: User, code: string) => {
  await user.click(screen.getByRole('button', { name: 'Dodaj kod' }));
  await user.type(screen.getByPlaceholderText('np. SUMMER2026'), code);
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Dodaj kod' }));
};

describe('ModeratorDiscountCodesTab child ids (PP.96)', () => {
  let server: ReturnType<typeof createFakeEventServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    server = createFakeEventServer([
      makeEvent('e1', 'Bieg A', true),
      makeEvent('e2', 'Bieg B', false),
    ]);
    getEvents.mockImplementation(async () => server.list());
    updateEvent.mockImplementation(async (id: string, payload: Record<string, unknown>) =>
      server.update(id, payload),
    );
  });

  it('sends the server id on the second save and keeps it after switching events', async () => {
    const user = userEvent.setup();
    renderTab();
    await pickEvent(user, /Bieg A/);

    await addCode(user, 'NEW');
    await waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
    expect(sentIds(0)[0]).toBe('dc-seed');
    await screen.findByText('NEW');

    // second save from the same screen: toggle "Aktywny" on the new code
    await waitFor(() => expect(screen.getAllByRole('switch')).toHaveLength(2));
    await user.click(screen.getAllByRole('switch')[1]);
    await waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(2));
    expect(sentIds(1)).toEqual(['dc-seed', 'srv-1']);
    expect(server.event('e1').discountCodes).toHaveLength(2);

    // switch to another event and back: the list shows server ids, not the stale temporary id
    await pickEvent(user, /Bieg B/);
    await pickEvent(user, /Bieg A/);
    await screen.findByText('NEW');
    await waitFor(() => expect(screen.getAllByRole('switch')).toHaveLength(2));
    await user.click(screen.getAllByRole('switch')[1]);
    await waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(3));
    expect(sentIds(2)).toEqual(['dc-seed', 'srv-1']);
    expect(server.event('e1').discountCodes.map((c) => c.id)).toEqual(['dc-seed', 'srv-1']);
  }, 20000);

  it('runs two quick changes sequentially and sends the server id in the second', async () => {
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
    renderTab();
    await pickEvent(user, /Bieg A/);

    await addCode(user, 'NEW');
    await waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getAllByRole('switch')).toHaveLength(2));
    await user.click(screen.getAllByRole('switch')[1]);

    // the second change must wait for the first response
    expect(updateEvent).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseFirst();
    });
    await waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(2));
    expect(sentIds(1)).toEqual(['dc-seed', 'srv-1']);
    expect(server.event('e1').discountCodes.map((c) => c.id)).toEqual(['dc-seed', 'srv-1']);
    // the edit made while the first save was in flight is still visible
    await waitFor(() => expect(screen.getByText('Nieaktywny')).toBeInTheDocument());
  }, 20000);

  it('keeps the local list when a save fails', async () => {
    updateEvent.mockRejectedValueOnce(new Error('Boom'));
    const user = userEvent.setup();
    renderTab();
    await pickEvent(user, /Bieg A/);

    await addCode(user, 'NEW');
    await waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('NEW')).toBeInTheDocument();
  }, 20000);
});
