import { useCallback, useState } from 'react';
import { ApiRequestError } from '@/api/errors';

/** The server's message when it sent one, otherwise the dialog's own fallback copy. */
export const apiErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof ApiRequestError ? error.message : fallback;

/**
 * In-flight state for a registration dialog's submit. `run` flips `pending` around the task and
 * routes a failure to `onError`; `guardOpenChange` keeps the dialog from closing while it is pending.
 */
export const useRegistrationAction = (onOpenChange: (open: boolean) => void) => {
  const [pending, setPending] = useState(false);

  const run = useCallback(async (task: () => Promise<void>, onError: (error: unknown) => void) => {
    setPending(true);
    try {
      await task();
    } catch (error) {
      onError(error);
    } finally {
      setPending(false);
    }
  }, []);

  const guardOpenChange = (next: boolean) => (pending ? undefined : onOpenChange(next));

  return { pending, run, guardOpenChange };
};
