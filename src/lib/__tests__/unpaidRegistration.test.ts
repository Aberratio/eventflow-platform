import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Registration } from '@/types';

const api = vi.hoisted(() => ({ retryPayment: vi.fn() }));
const nav = vi.hoisted(() => ({ navigateToPaymentGateway: vi.fn() }));
vi.mock('@/api', () => api);
vi.mock('../paymentGatewayNavigation', () => nav);

import { ApiRequestError } from '@/api/errors';
import {
  canRetryPayment,
  isAwaitingPayment,
  retryErrorMessage,
  retryRegistrationPayment,
} from '../unpaidRegistration';

const NOW = new Date('2026-09-01T12:00:00Z');
const reg = (over: Partial<Registration> = {}): Registration =>
  ({
    id: 'r1',
    eventId: 'e1',
    status: 'pending',
    paymentExpiresAt: '2026-09-01T13:00:00Z',
    paymentDetails: { startFeePaid: false },
    ...over,
  }) as Registration;

beforeEach(() => vi.clearAllMocks());

describe('isAwaitingPayment / canRetryPayment', () => {
  it('pending, unpaid, window still open -> awaiting payment, not retryable', () => {
    expect(isAwaitingPayment(reg(), NOW)).toBe(true);
    expect(canRetryPayment(reg(), NOW)).toBe(false);
  });

  it('pending without a known deadline still counts as awaiting payment', () => {
    expect(isAwaitingPayment(reg({ paymentExpiresAt: null }), NOW)).toBe(true);
  });

  it('paid, confirmed, cancelled registrations are not awaiting payment', () => {
    expect(isAwaitingPayment(reg({ paymentDetails: { startFeePaid: true } as never }), NOW)).toBe(
      false,
    );
    expect(isAwaitingPayment(reg({ status: 'confirmed' }), NOW)).toBe(false);
    expect(isAwaitingPayment(reg({ status: 'cancelled' }), NOW)).toBe(false);
  });

  it('an expired registration (or a lapsed, not yet swept pending one) can be retried', () => {
    expect(isAwaitingPayment(reg({ status: 'expired' }), NOW)).toBe(false);
    expect(canRetryPayment(reg({ status: 'expired' }), NOW)).toBe(true);
    const lapsed = reg({ paymentExpiresAt: '2026-09-01T11:00:00Z' });
    expect(isAwaitingPayment(lapsed, NOW)).toBe(false);
    expect(canRetryPayment(lapsed, NOW)).toBe(true);
  });

  it('a pending gateway registration with an open window can be retried (B-05)', () => {
    expect(canRetryPayment(reg(), NOW, { isBankTransfer: false })).toBe(true);
    // bank transfer has no gateway link; unknown route is not assumed to be a gateway
    expect(canRetryPayment(reg(), NOW, { isBankTransfer: true })).toBe(false);
    expect(canRetryPayment(reg(), NOW)).toBe(false);
    // paid / confirmed never offer a retry
    expect(
      canRetryPayment(reg({ paymentDetails: { startFeePaid: true } as never }), NOW, {
        isBankTransfer: false,
      }),
    ).toBe(false);
    expect(canRetryPayment(reg({ status: 'confirmed' }), NOW, { isBankTransfer: false })).toBe(
      false,
    );
  });
});

describe('retryRegistrationPayment', () => {
  it('redirects to the gateway when the server opened a payment session', async () => {
    api.retryPayment.mockResolvedValue({
      data: {
        id: 'r1',
        paymentSession: { transactionId: 't', redirectUrl: 'https://pay.example/x' },
      },
    });
    const result = await retryRegistrationPayment('r1');
    expect(api.retryPayment).toHaveBeenCalledWith('r1');
    expect(nav.navigateToPaymentGateway).toHaveBeenCalledWith('https://pay.example/x');
    expect(result.redirected).toBe(true);
  });

  it('does not redirect for bank-transfer registrations (no session)', async () => {
    api.retryPayment.mockResolvedValue({ data: { id: 'r1', paymentSession: null } });
    const result = await retryRegistrationPayment('r1');
    expect(nav.navigateToPaymentGateway).not.toHaveBeenCalled();
    expect(result.redirected).toBe(false);
  });
});

describe('retryErrorMessage', () => {
  it('maps server error codes to Polish messages', () => {
    expect(
      retryErrorMessage(new ApiRequestError('x', 'registration_capacity_exceeded', 409)),
    ).toMatch(/limit/i);
    expect(
      retryErrorMessage(new ApiRequestError('x', 'retry_requires_expired_registration', 409)),
    ).toMatch(/nie wygasł/i);
    expect(retryErrorMessage(new ApiRequestError('Własny komunikat', 'other', 500))).toBe(
      'Własny komunikat',
    );
    expect(retryErrorMessage(new Error('boom'))).toMatch(/spróbuj/i);
  });
});
