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
 * POST /registrations/{id}/retry-payment reopens an expired Zapis (a lapsed-but-not-yet-swept
 * `pending` one is expired on the spot by the server) and, since B-05, also starts a fresh gateway
 * session for a `pending` Zapis whose window is still open. A bank-transfer Zapis has no gateway
 * link, so the pending case needs the caller to say it is NOT a transfer (`isBankTransfer: false`);
 * an unknown route is never assumed to be a gateway.
 */
export function canRetryPayment(
  registration: Registration,
  now: Date = new Date(),
  options: { isBankTransfer?: boolean } = {},
): boolean {
  if (registration.status === 'expired') return true;
  if (registration.status !== 'pending' || registration.paymentDetails?.startFeePaid) return false;
  if (isPast(registration.paymentExpiresAt, now)) return true;
  return options.isBankTransfer === false;
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
    case 'retry_not_available_for_bank_transfer':
      return 'Ten zapis opłacasz przelewem — użyj danych do przelewu z komunikatu.';
    case 'registration_distance_invalid':
      return 'Wybrany dystans nie jest już dostępny.';
  }
  if (error instanceof Error && 'code' in error && error.message) return error.message;
  return 'Nie udało się ponowić płatności. Spróbuj ponownie za chwilę.';
}
