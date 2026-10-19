import { retryPayment } from '@/api';
import { apiErrorCode } from '@/api/errors';
import type { Registration } from '@/types';
import { navigateToPaymentGateway } from './paymentGatewayNavigation';

const isPast = (iso: string | null | undefined, now: Date): boolean =>
  Boolean(iso) && new Date(iso as string).getTime() <= now.getTime();

/** B-05: a `pending`, not yet paid Zapis whose payment window has not lapsed ("dokończ płatność"). */
export function isAwaitingPayment(registration: Registration, now: Date = new Date()): boolean {
  return (
    registration.status === 'pending' &&
    !registration.paymentDetails?.startFeePaid &&
    !isPast(registration.paymentExpiresAt, now)
  );
}

/**
 * POST /registrations/{id}/retry-payment only reopens a Zapis that has already expired (the server
 * answers 409 retry_requires_expired_registration otherwise); a lapsed-but-not-yet-swept `pending`
 * Zapis is expired on the spot by the server, so it is retryable too.
 */
export function canRetryPayment(registration: Registration, now: Date = new Date()): boolean {
  if (registration.status === 'expired') return true;
  return (
    registration.status === 'pending' &&
    !registration.paymentDetails?.startFeePaid &&
    isPast(registration.paymentExpiresAt, now)
  );
}

/**
 * Reopens the payment window. For a gateway Zapis the server answers with a fresh `paymentSession`
 * and the browser is sent to its checkout; a bank-transfer Zapis just becomes `pending` again.
 */
export async function retryRegistrationPayment(
  registrationId: string,
): Promise<{ registration: Registration; redirected: boolean }> {
  const response = await retryPayment(registrationId);
  const registration = response.data;
  const redirectUrl = registration.paymentSession?.redirectUrl;
  if (redirectUrl) {
    navigateToPaymentGateway(redirectUrl);
    return { registration, redirected: true };
  }
  return { registration, redirected: false };
}

export function retryErrorMessage(error: unknown): string {
  switch (apiErrorCode(error)) {
    case 'registration_capacity_exceeded':
      return 'Limit uczestników na tym dystansie został osiągnięty — nie można ponowić płatności.';
    case 'retry_requires_expired_registration':
      return 'Ten zapis jeszcze nie wygasł — dokończ płatność w trwającym oknie.';
    case 'registration_distance_invalid':
      return 'Wybrany dystans nie jest już dostępny.';
  }
  if (error instanceof Error && 'code' in error && error.message) return error.message;
  return 'Nie udało się ponowić płatności. Spróbuj ponownie za chwilę.';
}
