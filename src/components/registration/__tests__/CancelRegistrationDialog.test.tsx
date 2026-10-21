import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@/test/test-utils';
import type { Event, RegistrationChange, Registration } from '@/types';
import { CancelRegistrationDialog } from '../CancelRegistrationDialog';
import { describeRegistrationChange } from '@/lib/registrationChanges';

const event = {
  id: 'e1',
  name: 'Bieg Testowy',
  date: '2030-06-20T00:00:00',
  publicationStatus: 'published',
} as Event;

const registration = (over: Partial<Registration> = {}): Registration =>
  ({
    id: 'r1',
    eventId: 'e1',
    distanceName: '10 km',
    status: 'confirmed',
    totalAmount: 80,
    ...over,
  }) as Registration;

describe('CancelRegistrationDialog (R-02)', () => {
  it('announces a refund request for a paid registration and confirms on click', () => {
    const onConfirm = vi.fn();
    render(
      <CancelRegistrationDialog
        open
        onOpenChange={vi.fn()}
        registration={registration()}
        event={event}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText(/złożymy za Ciebie wniosek o zwrot/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tak, rezygnuję' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('says there is no refund for an unpaid registration', () => {
    render(
      <CancelRegistrationDialog
        open
        onOpenChange={vi.fn()}
        registration={registration({ status: 'pending', totalAmount: 80 })}
        event={event}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText(/nie będzie żadnego zwrotu/)).toBeInTheDocument();
  });

  it('disables both buttons while the request is in flight', () => {
    render(
      <CancelRegistrationDialog
        open
        onOpenChange={vi.fn()}
        registration={registration()}
        event={event}
        pending
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Rezygnuję…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Wróć' })).toBeDisabled();
  });
});

describe('describeRegistrationChange', () => {
  const change = (over: Partial<RegistrationChange>): RegistrationChange => ({
    id: 'c1',
    registrationId: 'r1',
    type: 'cancelled',
    from: null,
    to: null,
    actorId: 'u1',
    actorRole: 'owner',
    createdAt: '2026-06-01T10:00:00+02:00',
    ...over,
  });

  it('describes an owner cancellation with a refund request', () => {
    expect(describeRegistrationChange(change({ to: { refundRequested: true } }))).toBe(
      'Zrezygnowano z udziału — złożono wniosek o zwrot',
    );
  });

  it('describes an organizer cancellation and the other types', () => {
    expect(describeRegistrationChange(change({ actorRole: 'manager' }))).toBe('Zapis anulowany');
    expect(describeRegistrationChange(change({ type: 'distance_changed' }))).toBe(
      'Zmieniono dystans',
    );
    expect(describeRegistrationChange(change({ type: 'transferred' }))).toBe(
      'Zapis przeniesiono na inną osobę',
    );
  });
});
