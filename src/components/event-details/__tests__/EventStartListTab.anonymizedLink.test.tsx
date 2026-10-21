import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { EventStartListTab } from '../EventStartListTab';
import type { Event, PublicStartListEntry } from '@/types';

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getTeamsForDistance: vi.fn().mockResolvedValue({ success: true, data: [] }),
  };
});

const mockEvent: Event = {
  id: 'event-1',
  name: 'Bieg Testowy',
  slug: 'bieg-testowy',
  date: '2026-09-15',
  city: 'Warszawa',
  location: 'Park',
  discipline: 'running',
  distances: [
    {
      id: 'd1',
      name: '10 km',
      length: 10,
      unit: 'km',
      price: 80,
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

const baseEntry = (overrides: Partial<PublicStartListEntry>): PublicStartListEntry => ({
  id: overrides.id ?? 'r',
  distanceId: 'd1',
  distanceName: '10 km',
  category: 'Open',
  userId: overrides.userId ?? null,
  userName: overrides.userName ?? 'Zawodnik Testowy',
  bibNumber: overrides.bibNumber ?? '101',
  status: 'confirmed',
  registeredAt: '2026-09-01T10:00:00Z',
  hasMerchandise: false,
  formFields: [],
  ...overrides,
});

describe('EventStartListTab anonymized entries', () => {
  it('renders no /athlete/ link for an entry with userId: null, and links a non-null userId', () => {
    const registrations: PublicStartListEntry[] = [
      baseEntry({ id: 'r1', userId: null, userName: 'Zawodnik anonimowy', bibNumber: '101' }),
      baseEntry({ id: 'r2', userId: 'u-2', userName: 'Jan Kowalski', bibNumber: '102' }),
    ];

    render(<EventStartListTab event={mockEvent} registrations={registrations} />);

    expect(screen.queryByRole('link', { name: 'Zawodnik anonimowy' })).not.toBeInTheDocument();
    expect(screen.getByText('Zawodnik anonimowy')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'Jan Kowalski' });
    expect(link).toHaveAttribute('href', '/athlete/u-2');
  });
});
