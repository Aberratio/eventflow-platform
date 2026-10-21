import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@/test/test-utils';
import type { DistanceChangeQuote, Event, Registration } from '@/types';

const api = vi.hoisted(() => ({
  quoteDistanceChange: vi.fn(),
  changeRegistrationDistance: vi.fn(),
}));
vi.mock('@/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

import { ApiRequestError } from '@/api/errors';
import { ChangeDistanceDialog } from '../ChangeDistanceDialog';

const event = {
  id: 'e1',
  name: 'Bieg Testowy',
  date: '2030-06-20T00:00:00',
  distances: [
    { id: 'd1', name: '10 km', price: 80, registeredCount: 3 },
    { id: 'd2', name: '5 km', price: 50, registeredCount: 3 },
    { id: 'd3', name: 'Półmaraton', price: 120, registeredCount: 3 },
    { id: 'd4', name: 'Pełny', price: 60, limit: 1, registeredCount: 1 },
  ],
} as unknown as Event;

const registration = {
  id: 'r1',
  eventId: 'e1',
  distanceId: 'd1',
  distanceName: '10 km',
  userName: 'Jan Kowalski',
  status: 'confirmed',
  totalAmount: 80,
} as Registration;

const quote = (over: Partial<DistanceChangeQuote> = {}): DistanceChangeQuote => ({
  registrationId: 'r1',
  from: { distanceId: 'd1', distanceName: '10 km' },
  to: { distanceId: 'd2', distanceName: '5 km' },
  category: 'Open',
  currentTotal: 80,
  newTotal: 50,
  paidAmount: 80,
  balance: -30,
  balanceDueMinor: 0,
  refundDueMinor: 3000,
  settlementItems: [{ name: 'Opłata startowa', basis: 'distance_price', amount: 50 }],
  discountDropped: false,
  bibCleared: true,
  blockedReason: null,
  blockedMessage: null,
  ...over,
});

const renderDialog = (props: { isManager?: boolean; onChanged?: () => void } = {}) =>
  render(
    <ChangeDistanceDialog
      open
      onOpenChange={vi.fn()}
      registration={registration}
      event={event}
      {...props}
    />,
  );

const pick = (distanceId: string) =>
  fireEvent.change(screen.getByLabelText('Nowy dystans'), { target: { value: distanceId } });

describe('ChangeDistanceDialog (R-02)', () => {
  beforeEach(() => {
    api.quoteDistanceChange.mockReset();
    api.changeRegistrationDistance.mockReset();
  });

  it('offers the other distances only and marks a full one', () => {
    renderDialog();

    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options.some((t) => t?.startsWith('10 km'))).toBe(false);
    expect(options.some((t) => t?.startsWith('5 km'))).toBe(true);
    expect(screen.getByRole('option', { name: /Pełny.*brak miejsc/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zmień dystans' })).toBeDisabled();
  });

  it('shows the quote with the refund notice and changes the distance on confirm', async () => {
    api.quoteDistanceChange.mockResolvedValue({ success: true, data: quote() });
    api.changeRegistrationDistance.mockResolvedValue({
      success: true,
      data: { ...registration, distanceId: 'd2', distanceName: '5 km' },
    });
    const onChanged = vi.fn();
    renderDialog({ onChanged });

    pick('d2');

    expect(await screen.findByText(/wniosek o jej zwrot/)).toBeInTheDocument();
    expect(api.quoteDistanceChange).toHaveBeenCalledWith('r1', { distanceId: 'd2' });
    expect(screen.getByText(/numer startowy zostanie przydzielony od nowa/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Zmień dystans' }));

    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(api.changeRegistrationDistance).toHaveBeenCalledWith('r1', { distanceId: 'd2' });
  });

  it('explains and blocks an owner who would owe an extra', async () => {
    api.quoteDistanceChange.mockResolvedValue({
      success: true,
      data: quote({
        to: { distanceId: 'd3', distanceName: 'Półmaraton' },
        newTotal: 120,
        balance: 40,
        balanceDueMinor: 4000,
        refundDueMinor: 0,
        blockedReason: 'balance_due_requires_organizer',
        blockedMessage: 'Ten dystans jest droższy.',
      }),
    });
    renderDialog();

    pick('d3');

    expect(await screen.findByText(/Dopłatę rozlicza organizator/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zmień dystans' })).toBeDisabled();
  });

  it('lets the organizer confirm a dearer distance and settle the extra by hand', async () => {
    api.quoteDistanceChange.mockResolvedValue({
      success: true,
      data: quote({ newTotal: 120, balance: 40, balanceDueMinor: 4000, refundDueMinor: 0 }),
    });
    renderDialog({ isManager: true });

    pick('d3');

    expect(await screen.findByText(/rozlicz ją z uczestnikiem ręcznie/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zmień dystans' })).toBeEnabled();
  });

  it('shows the server error when the quote fails', async () => {
    api.quoteDistanceChange.mockRejectedValue(
      new ApiRequestError(
        'Wybrany dystans osiągnął limit uczestników.',
        'registration_capacity_exceeded',
        409,
      ),
    );
    // Own registration id: the test QueryClient is shared, a cached quote of r1/d2 would hide the error.
    render(
      <ChangeDistanceDialog
        open
        onOpenChange={vi.fn()}
        registration={{ ...registration, id: 'r-error' }}
        event={event}
        isManager
      />,
    );

    pick('d2');

    expect(await screen.findByRole('alert')).toHaveTextContent('osiągnął limit uczestników');
    expect(screen.getByRole('button', { name: 'Zmień dystans' })).toBeDisabled();
  });

  it('lets the participant choose a fee variant of the new distance', async () => {
    const withVariants = {
      ...event,
      distances: [
        event.distances![0],
        {
          ...event.distances![1],
          pricingVariants: [
            { id: 'v1', name: 'Harcownik', price: 40 },
            { id: 'v2', name: 'Biuro', price: 30, officeOnly: true },
          ],
        },
      ],
    } as unknown as Event;
    api.quoteDistanceChange.mockResolvedValue({ success: true, data: quote() });
    render(
      <ChangeDistanceDialog
        open
        onOpenChange={vi.fn()}
        registration={registration}
        event={withVariants}
      />,
    );

    pick('d2');
    const variant = await screen.findByLabelText('Wariant opłaty');
    expect(screen.queryByRole('option', { name: /Biuro/ })).not.toBeInTheDocument();
    fireEvent.change(variant, { target: { value: 'v1' } });

    await waitFor(() =>
      expect(api.quoteDistanceChange).toHaveBeenLastCalledWith('r1', {
        distanceId: 'd2',
        pricingVariantId: 'v1',
      }),
    );
  });
});
