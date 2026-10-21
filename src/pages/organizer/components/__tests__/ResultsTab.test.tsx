import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { ResultsTab } from '../ResultsTab';
import type { Event, Registration, Result } from '@/types';

const getResultsByEvent = vi.fn();
const getTeamClassification = vi.fn();
const getResultDocuments = vi.fn();
const publishOfficialResults = vi.fn();
const getResultCorrections = vi.fn();

vi.mock('@/api', () => ({
  getResultsByEvent: (...args: unknown[]) => getResultsByEvent(...args),
  getTeamClassification: (...args: unknown[]) => getTeamClassification(...args),
  getResultDocuments: (...args: unknown[]) => getResultDocuments(...args),
  publishOfficialResults: (...args: unknown[]) => publishOfficialResults(...args),
  getResultCorrections: (...args: unknown[]) => getResultCorrections(...args),
  updateResult: vi.fn(),
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
  getTeamClassification.mockResolvedValue({ success: true, data: [] });
  getResultDocuments.mockResolvedValue({ success: true, data: [] });
});

describe('ResultsTab publication status', () => {
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

describe('ResultsTab team classification', () => {
  it('shows a guidance message instead of the classification for a non-relay distance', async () => {
    getResultsByEvent.mockResolvedValue({ success: true, data: [baseResult] });
    const user = userEvent.setup();
    render(<ResultsTab event={event} registrations={registrations} />);

    const teamsTab = await screen.findByRole('tab', { name: /Klasyfikacja drużynowa/i });
    await user.click(teamsTab);

    expect(
      await screen.findByText(/dostępna tylko dla dystansów sztafetowych/i),
    ).toBeInTheDocument();
    expect(getTeamClassification).not.toHaveBeenCalled();
  });

  it('fetches and shows the live-computed classification for a relay distance', async () => {
    const relayEvent: Event = {
      ...event,
      distances: [{ ...event.distances[0], startType: 'relay', teamAggregationRule: 'sum' }],
    };
    getResultsByEvent.mockResolvedValue({ success: true, data: [baseResult] });
    getTeamClassification.mockResolvedValue({
      success: true,
      data: [
        {
          teamId: 'team-1',
          teamName: 'Drużyna A',
          memberCount: 2,
          aggregationRule: 'sum',
          aggregatedTimeInSeconds: 1200,
          position: 1,
        },
      ],
    });
    const user = userEvent.setup();
    render(<ResultsTab event={relayEvent} registrations={registrations} />);

    const teamsTab = await screen.findByRole('tab', { name: /Klasyfikacja drużynowa/i });
    await user.click(teamsTab);

    expect(await screen.findByText('Drużyna A')).toBeInTheDocument();
    await waitFor(() =>
      expect(getTeamClassification).toHaveBeenCalledWith('event-1', 'distance-1'),
    );
  });
});

describe('ResultsTab result corrections', () => {
  it('opens the correction history of a result from its row', async () => {
    const user = userEvent.setup();
    getResultsByEvent.mockResolvedValue({ success: true, data: [baseResult] });
    getResultCorrections.mockResolvedValue({ success: true, data: [] });
    render(<ResultsTab event={event} registrations={registrations} />);

    await user.click(await screen.findByRole('button', { name: 'Historia korekt' }));

    expect(await screen.findByText('Ten wynik nie był korygowany.')).toBeInTheDocument();
    expect(getResultCorrections).toHaveBeenCalledWith('result-1');
  });

  it('opens the edit dialog with the reason field from the row', async () => {
    const user = userEvent.setup();
    getResultsByEvent.mockResolvedValue({ success: true, data: [baseResult] });
    render(<ResultsTab event={event} registrations={registrations} />);

    await user.click(await screen.findByRole('button', { name: 'Koryguj wynik' }));

    expect(await screen.findByLabelText(/Powód korekty/)).toBeInTheDocument();
  });
});
