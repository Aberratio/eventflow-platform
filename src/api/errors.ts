import type { RegistrationFormFieldError } from '@/types';

/**
 * Error thrown by the HTTP adapter for a non-2xx API response. `message` is the user-facing
 * Polish text; `code` is the API's `error.code` (e.g. `invalid_token`) for callers that
 * branch on it (reset, verification and e-mail change screens).
 */
export class ApiRequestError extends Error {
  readonly code?: string;
  readonly status?: number;
  /** The API's `error.details`, when the server sent any (e.g. per-field form errors). */
  readonly details?: unknown;

  constructor(message: string, code?: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * The per-field errors of a 422 `registration_form_invalid` (empty for any other error),
 * so the form can show each message next to its field.
 */
export function registrationFormFieldErrors(error: unknown): RegistrationFormFieldError[] {
  if (!(error instanceof ApiRequestError) || error.code !== 'registration_form_invalid') return [];
  const fields = (error.details as { fields?: unknown } | undefined)?.fields;
  if (!Array.isArray(fields)) return [];
  return fields
    .filter((f): f is Record<string, unknown> => typeof f === 'object' && f !== null)
    .map((f) => ({
      fieldId: String(f.fieldId ?? ''),
      fieldKey: String(f.fieldKey ?? ''),
      code: String(f.code ?? ''),
      message: String(f.message ?? 'Niepoprawna wartość.'),
    }));
}

/** The API error code carried by a thrown error, if any. */
export function apiErrorCode(error: unknown): string | undefined {
  return error instanceof ApiRequestError ? error.code : undefined;
}
