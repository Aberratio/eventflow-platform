/**
 * Error thrown by the HTTP adapter for a non-2xx API response. `message` is the user-facing
 * Polish text; `code` is the API's `error.code` (e.g. `invalid_token`) for callers that
 * branch on it (PP.7: reset, verification and e-mail change screens).
 */
export class ApiRequestError extends Error {
  readonly code?: string;
  readonly status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.status = status;
  }
}

/** The API error code carried by a thrown error, if any. */
export function apiErrorCode(error: unknown): string | undefined {
  return error instanceof ApiRequestError ? error.code : undefined;
}
