import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useParticipantsActions } from '../useParticipantsActions';
import { Event, Registration } from '@/types';

const approveRefund = vi.fn();
const completeRefund = vi.fn();
const markRegistrationPaid = vi.fn();
const cancelRegistration = vi.fn();
const updatePaymentDetails = vi.fn();
const exportStartList = vi.fn();
const toastSpy = vi.fn();

vi.mock('@/api', () => ({
  approveRefund: (...args: unknown[]) => approveRefund(...args),
  completeRefund: (...args: unknown[]) => completeRefund(...args),
  markRegistrationPaid: (...args: unknown[]) => markRegistrationPaid(...args),
  cancelRegistration: (...args: unknown[]) => cancelRegistration(...args),
  updatePaymentDetails: (...args: unknown[]) => updatePaymentDetails(...args),
  exportStartList: (...args: unknown[]) => exportStartList(...args),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastSpy }),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

const mockEvent: Event = {
  id: 'evt-1',
  name: 'Test Event',
  slug: 'test-event',
  date: '2026-06-01',
  registrationDeadline: '2026-05-28',
  location: 'Test City',
  city: 'Test City',
  description: 'Test',
  discipline: 'running',
  publicationStatus: 'published',
  registrationStatus: 'open',
  imageUrl: '',
  distances: [],
  organizerId: 'organizer-1',
  organizerName: 'Organizer',
  featured: false,
} as Event;

const mockRegistrations: Registration[] = [
  {
    id: 'reg-1',
    eventId: 'evt-1',
    userId: 'u1',
    userName: 'Jan Kowalski',
    userEmail: 'jan@example.com',
    distanceId: 'd1',
    distanceName: '10K',
    category: 'M30-39',
    status: 'confirmed',
    registeredAt: '2026-01-10T10:00:00Z',
    bibNumber: '101',
  } as Registration,
  {
    id: 'reg-2',
    eventId: 'evt-1',
    userId: 'u2',
    userName: 'Anna Nowak',
    userEmail: 'anna@example.com',
    distanceId: 'd1',
    distanceName: '10K',
    category: 'K30-39',
    status: 'pending',
    registeredAt: '2026-01-11T10:00:00Z',
    bibNumber: '',
  } as Registration,
  {
    id: 'reg-3',
    eventId: 'evt-1',
    userId: 'u3',
    userName: 'Piotr Wiśniewski',
    userEmail: 'piotr@example.com',
    distanceId: 'd1',
    distanceName: '10K',
    category: 'M40-49',
    status: 'pending',
    registeredAt: '2026-01-12T10:00:00Z',
    bibNumber: '',
  } as Registration,
];

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

const renderActions = () => {
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);
  const rendered = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
    wrapper,
  });
  return { ...rendered, invalidate };
};

describe('useParticipantsActions', () => {
  it('initializes with correct counts', () => {
    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });
    expect(result.current.activeCount).toBe(3);
    expect(result.current.removedCount).toBe(0);
    expect(result.current.unpaidCount).toBe(2);
  });

  it('handleStatusChange(confirmed) calls mark-paid and refetches instead of patching locally', async () => {
    markRegistrationPaid.mockResolvedValueOnce({ success: true, data: mockRegistrations[1] });
    const { result, invalidate } = renderActions();

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.handleStatusChange(mockRegistrations[1], 'confirmed');
    });

    expect(ok).toBe(true);
    expect(markRegistrationPaid).toHaveBeenCalledWith('reg-2');
    expect(cancelRegistration).not.toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['event-registrations', 'evt-1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['registrations', 'event', 'evt-1'] });
    // no optimistic patch: the list changes only when the server data does
    expect(result.current.localRegistrations.find((r) => r.id === 'reg-2')?.status).toBe('pending');
  });

  it('handleStatusChange(cancelled) calls the cancel route', async () => {
    cancelRegistration.mockResolvedValueOnce({ success: true, data: mockRegistrations[0] });
    const { result, invalidate } = renderActions();

    await act(async () => {
      await result.current.handleStatusChange(mockRegistrations[0], 'cancelled');
    });

    expect(cancelRegistration).toHaveBeenCalledWith('reg-1');
    expect(markRegistrationPaid).not.toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalled();
  });

  it.each(['confirmed', 'cancelled'] as const)(
    'handleStatusChange(%s) shows the server message and does not refetch on error',
    async (status) => {
      const error = new Error('Zapis nie jest opłacany przelewem.');
      markRegistrationPaid.mockRejectedValueOnce(error);
      cancelRegistration.mockRejectedValueOnce(error);
      const { result, invalidate } = renderActions();

      let ok: boolean | undefined;
      await act(async () => {
        ok = await result.current.handleStatusChange(mockRegistrations[1], status);
      });

      expect(ok).toBe(false);
      expect(invalidate).not.toHaveBeenCalled();
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Zapis nie jest opłacany przelewem.',
          variant: 'destructive',
        }),
      );
    },
  );

  it('handleBulkCancel cancels each selected registration through the API', async () => {
    cancelRegistration.mockResolvedValue({ success: true, data: mockRegistrations[0] });
    const { result, invalidate } = renderActions();

    await act(async () => {
      await result.current.handleBulkCancel(new Set(['reg-1', 'reg-2']));
    });

    expect(cancelRegistration).toHaveBeenCalledTimes(2);
    expect(cancelRegistration).toHaveBeenCalledWith('reg-1');
    expect(cancelRegistration).toHaveBeenCalledWith('reg-2');
    expect(invalidate).toHaveBeenCalled();
  });

  it('handleBulkCancel reports partial failure with the server message', async () => {
    cancelRegistration
      .mockResolvedValueOnce({ success: true, data: mockRegistrations[0] })
      .mockRejectedValueOnce(new Error('Brak uprawnień.'));
    const { result, invalidate } = renderActions();

    await act(async () => {
      await result.current.handleBulkCancel(new Set(['reg-1', 'reg-2']));
    });

    expect(invalidate).toHaveBeenCalled(); // one succeeded -> refresh
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
        description: expect.stringContaining('Brak uprawnień.'),
      }),
    );
  });

  it('handleBulkCancel does not refetch when every call fails', async () => {
    cancelRegistration.mockRejectedValue(new Error('Błąd serwera.'));
    const { result, invalidate } = renderActions();

    await act(async () => {
      await result.current.handleBulkCancel(new Set(['reg-1']));
    });

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('handleCancelUnpaid cancels only pending registrations', async () => {
    cancelRegistration.mockResolvedValue({ success: true, data: mockRegistrations[1] });
    const { result } = renderActions();

    await act(async () => {
      await result.current.handleCancelUnpaid();
    });

    expect(cancelRegistration).toHaveBeenCalledTimes(2);
    expect(cancelRegistration).toHaveBeenCalledWith('reg-2');
    expect(cancelRegistration).toHaveBeenCalledWith('reg-3');
    expect(cancelRegistration).not.toHaveBeenCalledWith('reg-1');
  });

  it('follows the server list when the registrations prop changes', () => {
    const { result, rerender } = renderHook(({ regs }) => useParticipantsActions(mockEvent, regs), {
      wrapper,
      initialProps: { regs: mockRegistrations },
    });
    expect(result.current.localRegistrations).toHaveLength(3);

    rerender({ regs: [{ ...mockRegistrations[1], status: 'cancelled' }] });

    expect(result.current.localRegistrations).toHaveLength(1);
    expect(result.current.localRegistrations[0].status).toBe('cancelled');
  });

  it('handleAssignBib assigns bib number to participant', () => {
    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });

    act(() => {
      result.current.handleAssignBib('reg-2', '202', 'Anna Nowak');
    });

    const updated = result.current.localRegistrations.find((r) => r.id === 'reg-2');
    expect(updated?.bibNumber).toBe('202');
  });

  it('handlePaymentUpdate saves payment details through the API and refetches', async () => {
    const { result, invalidate } = renderActions();
    updatePaymentDetails.mockResolvedValueOnce({ success: true, data: mockRegistrations[0] });

    const paymentDetails = {
      startFeePaid: true,
      startFeeAmount: 100,
      startFeePaidAt: '2026-01-15T10:00:00Z',
      insurancePaid: false,
      merchandisePayments: [],
    };

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.handlePaymentUpdate('reg-1', paymentDetails);
    });

    expect(ok).toBe(true);
    expect(updatePaymentDetails).toHaveBeenCalledWith('reg-1', paymentDetails);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['event-registrations', 'evt-1'] });
  });

  it('handlePaymentUpdate surfaces the server error and reports failure', async () => {
    updatePaymentDetails.mockRejectedValueOnce(new Error('Brak dostępu do płatności.'));
    const { result, invalidate } = renderActions();

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.handlePaymentUpdate('reg-1', {
        startFeePaid: true,
        startFeeAmount: 100,
        insurancePaid: false,
        merchandisePayments: [],
      });
    });

    expect(ok).toBe(false);
    expect(invalidate).not.toHaveBeenCalled();
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Brak dostępu do płatności.',
        variant: 'destructive',
      }),
    );
  });

  it('handleApproveRefund calls the API and updates local state from the response', async () => {
    const updatedRegistration: Registration = {
      ...mockRegistrations[0],
      refund: { status: 'approved', amount: 80, route: 'manual' },
    };
    approveRefund.mockResolvedValueOnce({ success: true, data: updatedRegistration });

    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });

    await act(async () => {
      await result.current.handleApproveRefund(mockRegistrations[0]);
    });

    expect(approveRefund).toHaveBeenCalledWith('reg-1');
    const updated = result.current.localRegistrations.find((r) => r.id === 'reg-1');
    expect(updated?.refund?.status).toBe('approved');
  });

  it('handleCompleteRefund calls the API and updates local state from the response', async () => {
    const updatedRegistration: Registration = {
      ...mockRegistrations[0],
      status: 'cancelled',
      refund: { status: 'refunded', amount: 80, route: 'manual' },
    };
    completeRefund.mockResolvedValueOnce({ success: true, data: updatedRegistration });

    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });

    await act(async () => {
      await result.current.handleCompleteRefund(mockRegistrations[0]);
    });

    expect(completeRefund).toHaveBeenCalledWith('reg-1');
    const updated = result.current.localRegistrations.find((r) => r.id === 'reg-1');
    expect(updated?.refund?.status).toBe('refunded');
    expect(updated?.status).toBe('cancelled');
  });

  it('handleMarkPaid calls the API and updates local state from the response (E1.8, trasa B)', async () => {
    const updatedRegistration: Registration = {
      ...mockRegistrations[1],
      status: 'confirmed',
      paymentDetails: {
        startFeePaid: true,
        startFeeAmount: 80,
        insurancePaid: false,
        merchandisePayments: [],
      },
    };
    markRegistrationPaid.mockResolvedValueOnce({ success: true, data: updatedRegistration });

    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });

    await act(async () => {
      await result.current.handleMarkPaid(mockRegistrations[1]);
    });

    expect(markRegistrationPaid).toHaveBeenCalledWith('reg-2');
    const updated = result.current.localRegistrations.find((r) => r.id === 'reg-2');
    expect(updated?.status).toBe('confirmed');
    expect(updated?.paymentDetails?.startFeePaid).toBe(true);
  });

  it('handleMarkPaid surfaces a failure without crashing', async () => {
    markRegistrationPaid.mockRejectedValueOnce(new Error('registration_not_manual_route'));

    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });

    let outcome: Registration | undefined;
    await act(async () => {
      outcome = await result.current.handleMarkPaid(mockRegistrations[1]);
    });

    expect(outcome).toBeUndefined();
    const unchanged = result.current.localRegistrations.find((r) => r.id === 'reg-2');
    expect(unchanged?.status).toBe('pending');
  });

  // E2.6
  it('handleExportStartList calls the API with the event, distance and requested format', async () => {
    exportStartList.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });

    await act(async () => {
      await result.current.handleExportStartList('d1', 'csv');
    });

    expect(exportStartList).toHaveBeenCalledWith('evt-1', 'd1', 'csv');
  });

  it('handleExportStartList also supports the xlsx format', async () => {
    exportStartList.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });

    await act(async () => {
      await result.current.handleExportStartList('d1', 'xlsx');
    });

    expect(exportStartList).toHaveBeenCalledWith('evt-1', 'd1', 'xlsx');
  });

  it('handleExportStartList also supports the xml format (G-11)', async () => {
    exportStartList.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });

    await act(async () => {
      await result.current.handleExportStartList('d1', 'xml');
    });

    expect(exportStartList).toHaveBeenCalledWith('evt-1', 'd1', 'xml');
  });

  it('handleExportStartList does not throw when the download fails', async () => {
    exportStartList.mockRejectedValueOnce(new Error('forbidden'));
    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });

    await act(async () => {
      await expect(result.current.handleExportStartList('d1', 'csv')).resolves.toBeUndefined();
    });
  });
});
