import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { ParticipantsTab } from '../ParticipantsTab';
import type { Event, Registration } from '@/types';

const mockSwap = vi.fn();

vi.mock('@/api', () => ({
  exportStartList: vi.fn(),
  getFormFieldAggregates: vi.fn(),
  approveRefund: vi.fn(),
  completeRefund: vi.fn(),
  markRegistrationPaid: vi.fn(),
  getCare: vi.fn(),
  swapTeamMember: (...args: unknown[]) => mockSwap(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const event = {
  id: 'evt-1',
  name: 'Test Event',
  slug: 'test-event',
  date: '2026-06-01',
  distances: [
    { id: 'd1', name: 'Sztafeta', length: 4, unit: 'km', categories: ['Open'], price: 0 },
  ],
  organizerId: 'o1',
} as unknown as Event;

const reg = (over: Partial<Registration>): Registration =>
  ({
    id: 'r-default',
    eventId: 'evt-1',
    userId: 'u',
    userName: 'Uczestnik',
    userEmail: 'u@example.com',
    distanceId: 'd1',
    distanceName: 'Sztafeta',
    category: 'Open',
    status: 'confirmed',
    registeredAt: '2026-01-10T10:00:00Z',
    ...over,
  }) as Registration;

/** The organizer swaps a relay member from the participants list; solo entries have no such action. */
describe('ParticipantsTab relay member swap', () => {
  it('offers the swap only for Zapisy that belong to a team', () => {
    render(
      <ParticipantsTab
        event={event}
        registrations={[
          reg({ id: 'r1', userName: 'Zespolowy', teamId: 't1', teamName: 'Szybcy' }),
          reg({ id: 'r2', userName: 'Solista' }),
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Wymień zawodnika Zespolowy' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Wymień zawodnika Solista' }),
    ).not.toBeInTheDocument();
  });

  it('swaps through the API and shows the new person in the list', async () => {
    mockSwap.mockResolvedValue({
      success: true,
      data: reg({ id: 'r1', userName: 'Ola Nowak', teamId: 't1', teamName: 'Szybcy' }),
    });
    render(
      <ParticipantsTab
        event={event}
        registrations={[reg({ id: 'r1', userName: 'Zespolowy', teamId: 't1', teamName: 'Szybcy' })]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Wymień zawodnika Zespolowy' }));
    fireEvent.change(await screen.findByLabelText('Imię'), { target: { value: 'Ola' } });
    fireEvent.change(screen.getByLabelText('Nazwisko'), { target: { value: 'Nowak' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Wymień zawodnika' }).at(-1)!);

    await waitFor(() =>
      expect(mockSwap).toHaveBeenCalledWith('t1', 'r1', {
        newPerson: { firstName: 'Ola', lastName: 'Nowak' },
      }),
    );
    expect(await screen.findByText('Ola Nowak')).toBeInTheDocument();
    expect(screen.queryByText('Zespolowy')).not.toBeInTheDocument();
  });
});
