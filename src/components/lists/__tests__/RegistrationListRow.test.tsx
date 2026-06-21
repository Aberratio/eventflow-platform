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
  status: 'active',
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
