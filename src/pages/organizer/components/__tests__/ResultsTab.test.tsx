import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { ResultsTab } from '../ResultsTab';
import type { Event, Registration, Result } from '@/types';

const getResultsByEvent = vi.fn();
const getTeamResults = vi.fn();
const getResultDocuments = vi.fn();
const publishOfficialResults = vi.fn();

vi.mock('@/api', () => ({
  getResultsByEvent: (...args: unknown[]) => getResultsByEvent(...args),
  getTeamResults: (...args: unknown[]) => getTeamResults(...args),
  getResultDocuments: (...args: unknown[]) => getResultDocuments(...args),
  publishOfficialResults: (...args: unknown[]) => publishOfficialResults(...args),
}));

const event: Event = {
  id: 'event-1',
  name: 'Bieg Testowy',
  slug: 'bieg-testowy',
  discipline: 'running',
  date: '2026-06-15',
  location: 'Park',
  city: 'Warszawa',
  description: 'Test',
  imageUrl: '/test.jpg',
  distances: [
    {
      id: 'distance-1',
      name: '10 km',
      length: 10,
      unit: 'km',
      categories: ['OPEN'],
      registeredCount: 1,
      price: 0,
    },
  ],
  organizerId: 'organizer-1',
  organizerName: 'Organizator',
  publicationStatus: 'published',
  registrationDeadline: '2026-06-01',
  featured: false,
};

const registrations: Registration[] = [];

const baseResult: Result = {
  id: 'result-1',
  eventId: 'event-1',
  eventName: 'Bieg Testowy',
  distanceId: 'distance-1',
  distanceName: '10 km',
  userId: 'user-1',
  userName: 'Jan Kowalski',
  bibNumber: '101',
  category: 'OPEN',
  time: '00:45:00',
  timeInSeconds: 2700,
  position: 1,
  categoryPosition: 1,
  status: 'finished',
  publicationStatus: 'preliminary',
};

beforeEach(() => {
  vi.clearAllMocks();
  getTeamResults.mockResolvedValue({ success: true, data: [] });
  getResultDocuments.mockResolvedValue({ success: true, data: [] });
});

describe('ResultsTab publication status (E2.3)', () => {
  it('shows a preliminary badge and a "mark official" action when results are preliminary', async () => {
    getResultsByEvent.mockResolvedValue({ success: true, data: [baseResult] });
    render(<ResultsTab event={event} registrations={registrations} />);

    await waitFor(() => expect(screen.getAllByText('Wstępne').length).toBeGreaterThan(0));
    expect(screen.getByRole('button', { name: /Oznacz jako oficjalne/i })).toBeInTheDocument();
  });

  it('calls publishOfficialResults with the event and selected distance and refreshes on success', async () => {
    const user = userEvent.setup();
    getResultsByEvent.mockResolvedValue({ success: true, data: [baseResult] });
    publishOfficialResults.mockResolvedValue({
      success: true,
      data: {
        eventId: 'event-1',
        distanceId: 'distance-1',
        publicationStatus: 'official',
        updatedCount: 1,
      },
    });
    render(<ResultsTab event={event} registrations={registrations} />);

    const button = await screen.findByRole('button', { name: /Oznacz jako oficjalne/i });
    await user.click(button);

    await waitFor(() =>
      expect(publishOfficialResults).toHaveBeenCalledWith('event-1', 'distance-1'),
    );
  });

  it('shows an official badge and no "mark official" action once results are official', async () => {
    getResultsByEvent.mockResolvedValue({
      success: true,
      data: [{ ...baseResult, publicationStatus: 'official' }],
    });
    render(<ResultsTab event={event} registrations={registrations} />);

    await waitFor(() => expect(screen.getAllByText('Oficjalne').length).toBeGreaterThan(0));
    expect(
      screen.queryByRole('button', { name: /Oznacz jako oficjalne/i }),
    ).not.toBeInTheDocument();
  });
});
