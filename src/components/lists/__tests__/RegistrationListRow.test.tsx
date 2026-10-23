import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { RegistrationListRow } from '../RegistrationListRow';
import type { Event, Registration, VirtualResultSubmission } from '@/types';

const event: Event = {
  id: 'virtual-event',
  name: 'Wirtualny Bieg Testowy',
  slug: 'wirtualny-bieg-testowy',
  discipline: 'running',
  date: '2026-06-21',
  startDate: '2026-06-01',
  endDate: '2026-06-30',
  location: 'Wirtualnie',
  city: 'Online',
  description: 'Test',
  imageUrl: 'https://example.test/event.jpg',
  distances: [
    {
      id: 'distance-10k',
      name: '10 km',
      length: 10,
      unit: 'km',
      categories: ['Open'],
      registeredCount: 1,
      price: 50,
    },
  ],
  organizerId: 'organizer',
  organizerName: 'Organizer',
  publicationStatus: 'published',
  registrationDeadline: '2026-05-31',
  featured: false,
  isVirtual: true,
};

const registration: Registration = {
  id: 'registration',
  eventId: event.id,
  eventName: event.name,
  userId: 'participant',
  userName: 'Participant',
  userEmail: 'participant@example.test',
  distanceId: 'distance-10k',
  distanceName: '10 km',
  category: 'Open',
  registeredAt: '2026-05-20T10:00:00Z',
  status: 'confirmed',
  bibNumber: '123',
};

describe('RegistrationListRow self-service cancellation', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const liveEvent: Event = {
    ...event,
    isVirtual: false,
    date: '2026-09-20',
    startDate: undefined,
    endDate: undefined,
  };

  it('offers "Zrezygnuj" inside the window and calls onCancel', () => {
    vi.setSystemTime(new Date('2026-06-01T10:00:00Z'));
    const onCancel = vi.fn();

    render(
      <RegistrationListRow registration={registration} event={liveEvent} onCancel={onCancel} />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Zrezygnuj' })[0]);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('offers "Zmień dystans" inside the window and hides it after the cut-off', () => {
    vi.setSystemTime(new Date('2026-06-01T10:00:00Z'));
    const onChangeDistance = vi.fn();

    const { unmount } = render(
      <RegistrationListRow
        registration={registration}
        event={liveEvent}
        onChangeDistance={onChangeDistance}
      />,
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Zmień dystans' })[0]);
    expect(onChangeDistance).toHaveBeenCalledTimes(1);
    unmount();

    vi.setSystemTime(new Date('2026-09-15T10:00:00Z'));
    render(
      <RegistrationListRow
        registration={registration}
        event={liveEvent}
        onChangeDistance={onChangeDistance}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Zmień dystans' })).not.toBeInTheDocument();
  });

  it('does not offer "Zmień dystans" for a relay-team registration', () => {
    vi.setSystemTime(new Date('2026-06-01T10:00:00Z'));

    render(
      <RegistrationListRow
        registration={{ ...registration, teamId: 'team-1' }}
        event={liveEvent}
        onChangeDistance={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Zmień dystans' })).not.toBeInTheDocument();
  });

  it('hides the button after the cut-off and explains why', () => {
    vi.setSystemTime(new Date('2026-09-15T10:00:00Z'));

    render(
      <RegistrationListRow registration={registration} event={liveEvent} onCancel={vi.fn()} />,
    );

    expect(screen.queryByRole('button', { name: 'Zrezygnuj' })).not.toBeInTheDocument();
    expect(screen.getAllByText(/Termin samodzielnej rezygnacji minął/)).not.toHaveLength(0);
  });

  it('shows the organizer message when self-service is switched off', () => {
    vi.setSystemTime(new Date('2026-06-01T10:00:00Z'));

    render(
      <RegistrationListRow
        registration={registration}
        event={{ ...liveEvent, selfServiceEnabled: false }}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Zrezygnuj' })).not.toBeInTheDocument();
    expect(screen.getAllByText(/Organizator wyłączył samodzielną rezygnację/)).not.toHaveLength(0);
  });

  it('offers the history when asked to', () => {
    const onShowHistory = vi.fn();

    render(
      <RegistrationListRow
        registration={registration}
        event={liveEvent}
        onShowHistory={onShowHistory}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Historia zapisu' })[0]);
    expect(onShowHistory).toHaveBeenCalledTimes(1);
  });
});

describe('RegistrationListRow virtual result action', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows submitting a virtual result during the event window', async () => {
    vi.setSystemTime(new Date('2026-06-21T10:00:00Z'));
    const onSubmitResult = vi.fn();

    render(
      <RegistrationListRow
        registration={registration}
        event={event}
        onSubmitResult={onSubmitResult}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Wprowadź wynik' })[0]);

    expect(onSubmitResult).toHaveBeenCalledTimes(1);
  });

  it('shows closed window text after endDate when no result was submitted', () => {
    vi.setSystemTime(new Date('2026-07-01T10:00:00Z'));

    render(<RegistrationListRow registration={registration} event={event} />);

    expect(screen.getAllByText('Okno startowe zamknięte')).not.toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Wprowadź wynik' })).not.toBeInTheDocument();
  });

  it('allows resubmitting rejected result while the event window is active', async () => {
    vi.setSystemTime(new Date('2026-06-21T10:00:00Z'));
    const onSubmitResult = vi.fn();
    const virtualSubmission: VirtualResultSubmission = {
      id: 'submission',
      eventId: event.id,
      eventName: event.name,
      distanceId: 'distance-10k',
      distanceName: '10 km',
      userId: 'participant',
      userName: 'Participant',
      userEmail: 'participant@example.test',
      submittedTime: '00:50:00',
      submittedTimeInSeconds: 3000,
      submittedAt: '2026-06-20T10:00:00Z',
      status: 'rejected',
      rejectionReason: 'Brak dowodu',
    };

    render(
      <RegistrationListRow
        registration={registration}
        event={event}
        virtualSubmission={virtualSubmission}
        onSubmitResult={onSubmitResult}
      />,
    );

    expect(screen.getAllByText('Odrzucony')).not.toHaveLength(0);

    fireEvent.click(screen.getAllByRole('button', { name: 'Zgłoś ponownie' })[0]);

    expect(onSubmitResult).toHaveBeenCalledTimes(1);
  });
});

describe('RegistrationListRow start code', () => {
  it('shows a "Kod startowy" trigger when the registration has a qrCode', () => {
    render(
      <RegistrationListRow
        registration={{ ...registration, qrCode: `pqr_${'a'.repeat(48)}` }}
        event={event}
      />,
    );

    expect(screen.getAllByRole('button', { name: /Kod startowy/ }).length).toBeGreaterThan(0);
  });

  it('reveals the raw token on click, next to the QR image', () => {
    const qrCode = `pqr_${'b'.repeat(48)}`;

    render(<RegistrationListRow registration={{ ...registration, qrCode }} event={event} />);

    fireEvent.click(screen.getAllByRole('button', { name: /Kod startowy/ })[0]);

    expect(screen.getAllByText(qrCode).length).toBeGreaterThan(0);
  });

  it('does not render the trigger when the registration has no qrCode (older data)', () => {
    render(
      <RegistrationListRow registration={{ ...registration, qrCode: undefined }} event={event} />,
    );

    expect(screen.queryByRole('button', { name: /Kod startowy/ })).not.toBeInTheDocument();
  });
});

describe('RegistrationListRow check-in status', () => {
  it('shows no check-in badge when the registration has never been checked in', () => {
    render(<RegistrationListRow registration={registration} event={event} />);

    expect(screen.queryByText(/Odprawiono/)).not.toBeInTheDocument();
  });

  it('shows "Odprawiono o HH:mm" once Biuro Zawodów reports a check-in timestamp', () => {
    render(
      <RegistrationListRow
        registration={{ ...registration, checkedInAt: '2026-06-01T07:42:00+02:00' }}
        event={event}
      />,
    );

    expect(screen.getAllByText(/Odprawiono o/).length).toBeGreaterThan(0);
  });
});

describe('RegistrationListRow refund action', () => {
  it('offers "Poproś o zwrot" for a paid registration with no refund cycle yet', () => {
    const onRequestRefund = vi.fn();

    render(
      <RegistrationListRow
        registration={registration}
        event={event}
        onRequestRefund={onRequestRefund}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: /Poproś o zwrot/ })[0]);

    expect(onRequestRefund).toHaveBeenCalledTimes(1);
  });

  it('hides the refund action once a refund cycle is already in flight', () => {
    render(
      <RegistrationListRow
        registration={{ ...registration, refund: { status: 'requested' } }}
        event={event}
        onRequestRefund={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /Poproś o zwrot/ })).not.toBeInTheDocument();
    expect(screen.getAllByText('Zwrot: oczekuje na zatwierdzenie').length).toBeGreaterThan(0);
  });

  it('does not offer the refund action for an unpaid (pending) registration', () => {
    render(
      <RegistrationListRow
        registration={{ ...registration, status: 'pending' }}
        event={event}
        onRequestRefund={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /Poproś o zwrot/ })).not.toBeInTheDocument();
  });
});

describe('RegistrationListRow pending actions', () => {
  const liveEvent: Event = { ...event, isVirtual: false, startDate: undefined, endDate: undefined };

  it('sends one refund request when "Poproś o zwrot" is clicked twice', () => {
    const onRequestRefund = vi.fn(() => new Promise<void>(() => {}));
    render(
      <RegistrationListRow
        registration={registration}
        event={liveEvent}
        onRequestRefund={onRequestRefund}
      />,
    );

    const [button, ...others] = screen.getAllByRole('button', { name: /Poproś o zwrot/ });
    fireEvent.click(button);
    fireEvent.click(button);
    others.forEach((other) => fireEvent.click(other));

    expect(onRequestRefund).toHaveBeenCalledTimes(1);
    screen.getAllByRole('button', { name: /Poproś o zwrot|Ponów płatność/ }).forEach((b) => expect(b).toBeDisabled());
  });

  it('starts one payment retry when "Ponów płatność" is clicked twice', () => {
    const onRetryPayment = vi.fn(() => new Promise<void>(() => {}));
    render(
      <RegistrationListRow
        registration={{
          ...registration,
          status: 'expired',
          paymentExpiresAt: '2026-05-21T10:00:00Z',
        }}
        event={{ ...liveEvent, date: '2099-06-21', registrationDeadline: '2099-05-31' }}
        onRetryPayment={onRetryPayment}
      />,
    );

    const [button, ...others] = screen.getAllByRole('button', { name: /Ponów płatność/ });
    fireEvent.click(button);
    fireEvent.click(button);
    others.forEach((other) => fireEvent.click(other));

    expect(onRetryPayment).toHaveBeenCalledTimes(1);
    screen.getAllByRole('button', { name: /Poproś o zwrot|Ponów płatność/ }).forEach((b) => expect(b).toBeDisabled());
  });
});
