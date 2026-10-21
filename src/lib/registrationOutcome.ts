import { ApiRequestError } from '@/api/errors';

/** The wording of a dry-run Zapis (a Draft in test mode), shared by every registration screen. */
export const TEST_REGISTRATION_MESSAGE =
  'Zapis testowy – sprawdzono konfigurację, nic nie zostało zapisane ani opłacone';

/**
 * The server's 409 `registration_closed` is a state of the page, not a failure — returns
 * the server's Polish message, or null for any other error.
 */
export function registrationClosedMessage(error: unknown): string | null {
  if (!(error instanceof ApiRequestError) || error.code !== 'registration_closed') return null;
  return error.message;
}
