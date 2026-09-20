import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@/test/test-utils';
import { EventStartListTab } from '../EventStartListTab';
import type { Event, Registration } from '@/types';

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getTeamsForDistance: vi.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: 'team-real-1',
          eventId: 'event-1',
          distanceId: 'd1',
          name: 'Błyskawice',
          memberCount: 3,
          minSize: 2,
          maxSize: 4,
          complete: false,
        },
        {
          id: 'team-real-2',
          eventId: 'event-1',
          distanceId: 'd1',
          name: 'Sokoły',
          memberCount: 4,
          minSize: 2,
          maxSize: 4,
          complete: true,
        },
      ],
    }),
  };
});

const mockEvent: Event = {
  id: 'event-1',
  name: 'Sztafeta Testowa',
  slug: 'sztafeta-testowa',
  date: '2026-09-15',
  city: 'Warszawa',
  location: 'Park Łazienkowski',
  discipline: 'running',
  distances: [
    {
      id: 'd1',
      name: 'Sztafeta 4x5km',
      length: 20,
      unit: 'km',
      price: 150,
      categories: ['Open'],
      registeredCount: 0,
    },
  ],
  organizerId: 'o1',
  organizerName: 'Org',
  description: 'Opis',
  registrationStatus: 'open',
  imageUrl: '/test.jpg',
  publicationStatus: 'published',
  registrationDeadline: '2026-09-10',
  featured: false,
};

const baseReg = (overrides: Partial<Registration>): Registration => ({
  id: overrides.id ?? 'r',
  eventId: 'event-1',
  eventName: 'Sztafeta Testowa',
  userId: `u-${overrides.id}`,
  userName: overrides.userName ?? 'Zawodnik Testowy',
  userEmail: 'test@example.com',
  distanceId: 'd1',
  distanceName: 'Sztafeta 4x5km',
  category: 'Open',
  registeredAt: '2026-09-01T10:00:00Z',
  status: 'confirmed',
  bibNumber: overrides.bibNumber,
  ...overrides,
});

describe('EventStartListTab team grouping (E7.4)', () => {
  it('clusters registrations sharing a real teamId under one labeled group with a completeness indicator', async () => {
    const registrations: Registration[] = [
      baseReg({ id: 'r1', userName: 'Adam Kowalski', bibNumber: '101', teamId: 'team-real-1', teamName: 'Błyskawice' }),
      baseReg({ id: 'r2', userName: 'Bartek Nowak', bibNumber: '102', teamId: 'team-real-1', teamName: 'Błyskawice' }),
      baseReg({ id: 'r3', userName: 'Celina Lis', bibNumber: '103', teamId: 'team-real-2', teamName: 'Sokoły' }),
      baseReg({ id: 'r4', userName: 'Darek Wolny', bibNumber: '104' }),
    ];

    render(<EventStartListTab event={mockEvent} registrations={registrations} />);

    // Individual (non-relay) registration renders as before, ungrouped.
    expect(screen.getByText('Darek Wolny')).toBeInTheDocument();

    // Group headers appear once team data resolves, each with a completeness indicator.
    const partialHeader = await screen.findByText(/Drużyna: Błyskawice/);
    const partialGroup = partialHeader.closest('th') as HTMLElement;
    expect(within(partialGroup).getByText('3/4 zawodników')).toBeInTheDocument();

    const fullHeader = screen.getByText(/Drużyna: Sokoły/);
    const fullGroup = fullHeader.closest('th') as HTMLElement;
    expect(within(fullGroup).getByText('4/4 zawodników')).toBeInTheDocument();

    // Both members of the Błyskawice team are still individually rendered
    // (own bib number each, per Answer §4 — grouping is a view, not a merge).
    await waitFor(() => {
      expect(screen.getByText('101')).toBeInTheDocument();
      expect(screen.getByText('102')).toBeInTheDocument();
    });
    expect(screen.getByText('Adam Kowalski')).toBeInTheDocument();
    expect(screen.getByText('Bartek Nowak')).toBeInTheDocument();
  });

  it('does not group registrations whose teamId does not resolve to a real team, or that only share a legacy free-text teamName', async () => {
    const registrations: Registration[] = [
      baseReg({ id: 'r1', userName: 'Ewa Stale', bibNumber: '201', teamId: 'stale-team-id', teamName: 'Klub X' }),
      baseReg({ id: 'r2', userName: 'Filip Klub', bibNumber: '202', teamName: 'Klub X' }),
    ];

    render(<EventStartListTab event={mockEvent} registrations={registrations} />);

    await waitFor(() => {
      expect(screen.getByText('Ewa Stale')).toBeInTheDocument();
    });
    expect(screen.getByText('Filip Klub')).toBeInTheDocument();
    expect(screen.queryByText(/^Drużyna:/)).not.toBeInTheDocument();
  });
});
