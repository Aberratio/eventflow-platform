import { renderHook, waitFor, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRegistrationQuote } from '../useRegistrationQuote';
import type { RegistrationQuote } from '@/types';

const quoteOf = (totalAmount: number): { data: RegistrationQuote } => ({
  data: {
    eventName: 'Bieg',
    distanceName: '10 km',
    settlementItems: [{ name: 'Opłata', basis: 'distance_price', amount: totalAmount }],
    totalAmount,
    discountCode: null,
  },
});

const wrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe('useRegistrationQuote (B-02)', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('asks the server once, after the payload has been still for the debounce time', async () => {
    const quote = vi.fn().mockResolvedValue(quoteOf(85));
    const { result, rerender } = renderHook(
      ({ payload }) => useRegistrationQuote({ enabled: true, payload, quote, debounceMs: 400 }),
      { wrapper: wrapper(), initialProps: { payload: { distanceId: 'd1', n: 1 } } },
    );
    rerender({ payload: { distanceId: 'd1', n: 2 } });
    rerender({ payload: { distanceId: 'd1', n: 3 } });

    expect(quote).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(true);
    expect(result.current.quote).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(450);
    });
    await waitFor(() => expect(result.current.quote?.totalAmount).toBe(85));
    expect(quote).toHaveBeenCalledTimes(1);
    expect(quote).toHaveBeenCalledWith({ distanceId: 'd1', n: 3 });
    expect(result.current.isPending).toBe(false);
  });

  it('does not show the quote of an older payload once the payload changed', async () => {
    const quote = vi.fn().mockImplementation(async (p: { n: number }) => quoteOf(p.n * 10));
    const { result, rerender } = renderHook(
      ({ payload }) => useRegistrationQuote({ enabled: true, payload, quote, debounceMs: 100 }),
      { wrapper: wrapper(), initialProps: { payload: { n: 1 } } },
    );
    await act(async () => {
      vi.advanceTimersByTime(150);
    });
    await waitFor(() => expect(result.current.quote?.totalAmount).toBe(10));

    rerender({ payload: { n: 2 } });
    expect(result.current.quote).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(150);
    });
    await waitFor(() => expect(result.current.quote?.totalAmount).toBe(20));
  });

  it('sends nothing while disabled or without a payload', async () => {
    const quote = vi.fn().mockResolvedValue(quoteOf(1));
    const { result } = renderHook(
      () => useRegistrationQuote({ enabled: false, payload: { n: 1 }, quote, debounceMs: 10 }),
      { wrapper: wrapper() },
    );
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(quote).not.toHaveBeenCalled();
    expect(result.current.quote).toBeNull();
    expect(result.current.isPending).toBe(false);
  });

  it('yields no quote (the caller keeps its local preview) when the server refuses', async () => {
    const quote = vi.fn().mockRejectedValue(new Error('422'));
    const { result } = renderHook(
      () => useRegistrationQuote({ enabled: true, payload: { n: 1 }, quote, debounceMs: 10 }),
      { wrapper: wrapper() },
    );
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.quote).toBeNull();
  });
});
