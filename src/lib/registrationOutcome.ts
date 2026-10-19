import { ApiRequestError } from '@/api/errors';

/** G-08: the wording of a dry-run Zapis (a Draft in test mode), shared by every registration screen. */
export const TEST_REGISTRATION_MESSAGE =
  'Zapis testowy – sprawdzono konfigurację, nic nie zostało zapisane ani opłacone';

/**
 * B-01: the server's 409 `registration_closed` is a state of the page, not a failure — returns
 * the server's Polish message, or null for any other error.
 */
export function registrationClosedMessage(error: unknown): string | null {
  if (!(error instanceof ApiRequestError) || error.code !== 'registration_closed') return null;
  return error.message;
}
