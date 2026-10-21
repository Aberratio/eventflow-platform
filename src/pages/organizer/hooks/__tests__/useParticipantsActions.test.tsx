import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useParticipantsActions } from '../useParticipantsActions';
import { Event, Registration } from '@/types';

const approveRefund = vi.fn();
const completeRefund = vi.fn();
const markRegistrationPaid = vi.fn();
const exportStartList = vi.fn();
const updateRegistration = vi.fn();

vi.mock('@/api', () => ({
  approveRefund: (...args: unknown[]) => approveRefund(...args),
  completeRefund: (...args: unknown[]) => completeRefund(...args),
  markRegistrationPaid: (...args: unknown[]) => markRegistrationPaid(...args),
  exportStartList: (...args: unknown[]) => exportStartList(...args),
  updateRegistration: (...args: unknown[]) => updateRegistration(...args),
}));

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

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('useParticipantsActions', () => {
  it('initializes with correct counts', () => {
    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });
    expect(result.current.activeCount).toBe(3);
    expect(result.current.removedCount).toBe(0);
    expect(result.current.unpaidCount).toBe(2);
  });

  it('handleStatusChange updates registration status', () => {
    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });

    act(() => {
      result.current.handleStatusChange(mockRegistrations[1], 'confirmed');
    });

    const updated = result.current.localRegistrations.find((r) => r.id === 'reg-2');
    expect(updated?.status).toBe('confirmed');
    expect(result.current.unpaidCount).toBe(1);
  });

  it('handleRemoveParticipant sets status to removed', () => {
    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });

    act(() => {
      result.current.handleRemoveParticipant(mockRegistrations[0]);
    });

    const removed = result.current.localRegistrations.find((r) => r.id === 'reg-1');
    expect(removed?.status).toBe('removed');
    expect(removed?.removedAt).toBeDefined();
    expect(result.current.removedCount).toBe(1);
    expect(result.current.activeCount).toBe(2);
  });

  it('handleRestoreParticipant restores removed participant', () => {
    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });

    act(() => {
      result.current.handleRemoveParticipant(mockRegistrations[0]);
    });
    expect(result.current.removedCount).toBe(1);

    act(() => {
      result.current.handleRestoreParticipant(result.current.localRegistrations[0]);
    });
    const restored = result.current.localRegistrations.find((r) => r.id === 'reg-1');
    expect(restored?.status).toBe('pending');
    expect(restored?.removedAt).toBeUndefined();
    expect(result.current.removedCount).toBe(0);
  });

  it('handleBulkDelete removes multiple participants', () => {
    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });

    act(() => {
      result.current.handleBulkDelete(new Set(['reg-1', 'reg-2']));
    });

    expect(result.current.removedCount).toBe(2);
    expect(result.current.activeCount).toBe(1);
  });

  it('handleDeleteUnpaid removes only pending registrations', () => {
    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });

    act(() => {
      result.current.handleDeleteUnpaid();
    });

    expect(result.current.removedCount).toBe(2); // reg-2, reg-3 were pending
    expect(result.current.activeCount).toBe(1); // reg-1 was confirmed
  });

  it('handleAssignBib saves the number through the API and updates local state (R-13)', async () => {
    updateRegistration.mockResolvedValueOnce({
      success: true,
      data: { ...mockRegistrations[1], bibNumber: '202' },
    });
    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });

    let saved = false;
    await act(async () => {
      saved = await result.current.handleAssignBib('reg-2', '202', 'Anna Nowak');
    });

    expect(saved).toBe(true);
    expect(updateRegistration).toHaveBeenCalledWith('reg-2', { bibNumber: '202' });
    const updated = result.current.localRegistrations.find((r) => r.id === 'reg-2');
    expect(updated?.bibNumber).toBe('202');
  });

  it('handleAssignBib keeps the old number when the server rejects it (409 collision)', async () => {
    updateRegistration.mockRejectedValueOnce(new Error('Numer startowy 101 jest już przypisany.'));
    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });

    let saved = true;
    await act(async () => {
      saved = await result.current.handleAssignBib('reg-2', '101', 'Anna Nowak');
    });

    expect(saved).toBe(false);
    const unchanged = result.current.localRegistrations.find((r) => r.id === 'reg-2');
    expect(unchanged?.bibNumber).toBe('');
  });

  it('handlePaymentUpdate updates payment details', () => {
    const { result } = renderHook(() => useParticipantsActions(mockEvent, mockRegistrations), {
      wrapper,
    });

    const paymentDetails = {
      startFeePaid: true,
      startFeeAmount: 100,
      startFeePaidAt: '2026-01-15T10:00:00Z',
      insurancePaid: false,
      merchandisePayments: [],
    };

    act(() => {
      result.current.handlePaymentUpdate('reg-1', paymentDetails);
    });

    const updated = result.current.localRegistrations.find((r) => r.id === 'reg-1');
    expect(updated?.paymentDetails).toEqual(paymentDetails);
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
