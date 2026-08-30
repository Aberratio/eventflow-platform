import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { VirtualResultsSubmissionDialog } from '../VirtualResultsSubmissionDialog';
import type { Event } from '@/types';

const submitVirtualResult = vi.fn();
const toast = vi.fn();

vi.mock('@/api', () => ({
  submitVirtualResult: (...args: unknown[]) => submitVirtualResult(...args),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast }),
}));

const event: Event = {
  id: 'event-virtual',
  name: 'Wirtualny Bieg',
  slug: 'wirtualny-bieg',
  discipline: 'running',
  date: '2026-06-21',
  location: 'Wirtualnie',
  city: 'Online',
  description: 'Test',
  imageUrl: 'https://example.test/event.jpg',
  distances: [
    {
      id: 'distance-5k',
      name: '5 km',
      length: 5,
      unit: 'km',
      categories: ['Open'],
      registeredCount: 1,
      price: 30,
    },
  ],
  organizerId: 'organizer',
  organizerName: 'Organizer',
  publicationStatus: 'published',
  registrationDeadline: '2026-06-01',
  featured: false,
  isVirtual: true,
};

describe('VirtualResultsSubmissionDialog', () => {
  it('submits selected distance, formatted time, proof url and notes', async () => {
    submitVirtualResult.mockResolvedValue({ success: true, data: {} });
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSubmitted = vi.fn();

    render(
      <VirtualResultsSubmissionDialog
        open
        onOpenChange={onOpenChange}
        event={event}
        registeredDistanceId="distance-5k"
        onSubmitted={onSubmitted}
      />,
    );

    await user.type(screen.getByPlaceholderText('GG'), '1');
    await user.type(screen.getByPlaceholderText('MM'), '02');
    await user.type(screen.getByPlaceholderText('SS'), '03');
    await user.type(
      screen.getByPlaceholderText('https://strava.com/activities/...'),
      'https://strava.test/1',
    );
    await user.type(
      screen.getByPlaceholderText('Np. Bieg w parku miejskim w Krakowie...'),
      'Dobry bieg',
    );
    await user.click(screen.getByRole('button', { name: 'Zgłoś wynik' }));

    await waitFor(() => {
      expect(submitVirtualResult).toHaveBeenCalledWith({
        eventId: 'event-virtual',
        distanceId: 'distance-5k',
        submittedTime: '01:02:03',
        submittedTimeInSeconds: 3723,
        proofUrl: 'https://strava.test/1',
        notes: 'Dobry bieg',
      });
    });
    expect(onSubmitted).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
