import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@/test/test-utils';
import type { Event, Registration } from '@/types';

const lib = vi.hoisted(() => ({ retryRegistrationPayment: vi.fn() }));
const toast = vi.hoisted(() => vi.fn());
vi.mock('@/lib/unpaidRegistration', async (orig) => ({
  ...(await orig<typeof import('@/lib/unpaidRegistration')>()),
  retryRegistrationPayment: lib.retryRegistrationPayment,
}));
vi.mock('@/api', () => ({ retryPayment: vi.fn() }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));

import { ApiRequestError } from '@/api/errors';
import { UnpaidRegistrationBanner } from '../UnpaidRegistrationBanner';

const future = new Date(Date.now() + 3600_000).toISOString();
const reg = (over: Partial<Registration> = {}): Registration =>
  ({
    id: 'r1',
    eventId: 'e1',
    eventName: 'Bieg Testowy',
    status: 'pending',
    paymentExpiresAt: future,
    paymentDetails: { startFeePaid: false },
    transferTitle: 'ZC-r1',
    totalAmount: 50,
    ...over,
  }) as Registration;
const event = (type: 'organizer_bank' | 'admin_gateway'): Event =>
  ({
    id: 'e1',
    name: 'Bieg Testowy',
    paymentConfig: { type, bankAccountNumber: 'PL61 1090', bankAccountHolder: 'Klub' },
  }) as Event;

beforeEach(() => vi.clearAllMocks());

describe('UnpaidRegistrationBanner (B-05)', () => {
  it('renders nothing when every registration is paid or confirmed', () => {
    const { container } = render(
      <UnpaidRegistrationBanner
        registrations={[
          reg({ status: 'confirmed' }),
          reg({ id: 'r2', paymentDetails: { startFeePaid: true } as never }),
        ]}
        events={[event('admin_gateway')]}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('announces the unpaid registration with the deadline', () => {
    render(<UnpaidRegistrationBanner registrations={[reg()]} events={[event('admin_gateway')]} />);
    expect(screen.getByText('Masz nieopłacony zapis na Bieg Testowy')).toBeInTheDocument();
    expect(screen.getByText(/Dokończ płatność do /)).toBeInTheDocument();
  });

  it('shows the transfer details and title for a bank-transfer event', () => {
    render(<UnpaidRegistrationBanner registrations={[reg()]} events={[event('organizer_bank')]} />);
    expect(screen.getByText('PL61 1090')).toBeInTheDocument();
    expect(screen.getByText('ZC-r1')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('offers "Zapłać teraz" for an expired gateway registration and retries it', async () => {
    lib.retryRegistrationPayment.mockResolvedValue({ registration: reg(), redirected: true });
    render(
      <UnpaidRegistrationBanner
        registrations={[reg({ status: 'expired', paymentExpiresAt: null })]}
        events={[event('admin_gateway')]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Zapłać teraz/ }));
    await waitFor(() => expect(lib.retryRegistrationPayment).toHaveBeenCalledWith('r1'));
  });

  it('shows the server error (e.g. capacity) as a destructive toast', async () => {
    lib.retryRegistrationPayment.mockRejectedValue(
      new ApiRequestError('x', 'registration_capacity_exceeded', 409),
    );
    render(
      <UnpaidRegistrationBanner
        registrations={[reg({ status: 'expired' })]}
        events={[event('admin_gateway')]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Zapłać teraz/ }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          description: expect.stringMatching(/limit/i),
        }),
      ),
    );
  });
});
