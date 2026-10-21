import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { RegistrationQuote } from '@/types';

export const QUOTE_DEBOUNCE_MS = 400;

interface UseRegistrationQuoteOptions<TPayload> {
  /** Off => no request at all (no quote function, preview mode, not on the summary step...). */
  enabled: boolean;
  /** The payload as `createRegistration` would send it; null while the form cannot be priced yet. */
  payload: TPayload | null;
  quote: (payload: TPayload) => Promise<{ data: RegistrationQuote }>;
  debounceMs?: number;
}

/**
 * The server's price for the registration form as filled in so far (`POST /registrations/quote`),
 * re-asked after the payload has been still for `debounceMs`. The server is the only authority on the
 * Rozliczenie; a failed quote (e.g. 422 on an incomplete form) simply yields `quote: null`, so the
 * caller falls back to its local preview and never blocks the form.
 */
export const useRegistrationQuote = <TPayload>({
  enabled,
  payload,
  quote,
  debounceMs = QUOTE_DEBOUNCE_MS,
}: UseRegistrationQuoteOptions<TPayload>) => {
  const serialized = enabled && payload !== null ? JSON.stringify(payload) : null;
  const [settled, setSettled] = useState<string | null>(null);

  useEffect(() => {
    if (serialized === null) {
      setSettled(null);
      return undefined;
    }
    const timer = setTimeout(() => setSettled(serialized), debounceMs);
    return () => clearTimeout(timer);
  }, [serialized, debounceMs]);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['registration-quote', settled],
    queryFn: () => quote(JSON.parse(settled as string) as TPayload),
    select: (response) => response.data,
    enabled: settled !== null,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  const pending = serialized !== null && (serialized !== settled || isFetching);
  // Never show a quote for an older payload than the one on screen.
  const current = serialized !== null && serialized === settled && !isError ? (data ?? null) : null;

  return { quote: current, isPending: pending, isError: serialized !== null && isError };
};
