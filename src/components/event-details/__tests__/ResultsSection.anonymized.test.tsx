import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/test-utils';
import type { Event, Result } from '@/types';
import { ResultsSection } from '../ResultsSection';

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return { ...actual, getResultDocuments: vi.fn().mockResolvedValue({ data: [] }) };
});

const event = {
  id: 'event',
  name: 'Bieg Testowy',
  slug: 'bieg-testowy',
  discipline: 'running',
  date: '2026-06-21',
  location: 'Kraków',
  city: 'Kraków',
  description: '',
  imageUrl: '',
  distances: [{ id: 'd10', name: '10 km', length: 10, unit: 'km', categories: ['Open'] }],
  organizerId: 'org',
  organizerName: 'Org',
  publicationStatus: 'published',
  registrationDeadline: '2026-06-01',
  featured: false,
} as unknown as Event;

const result = (over: Partial<Result>): Result =>
  ({
    id: 'r',
    eventId: 'event',
    eventName: 'Bieg Testowy',
    distanceId: 'd10',
    distanceName: '10 km',
    userId: 'u1',
    userName: 'Jan Kowalski',
    bibNumber: '1',
    category: 'Open',
    time: '0:41:10',
    timeInSeconds: 2470,
    position: 1,
    categoryPosition: 1,
    status: 'finished',
    ...over,
  }) as Result;

describe('ResultsSection with anonymised competitors', () => {
  it('links named competitors to their profile but not anonymised ones', () => {
    render(
      <ResultsSection
        event={event}
        eventResults={[
          result({ id: 'a', userId: 'u1', userName: 'Jan Kowalski' }),
          result({
            id: 'b',
            userId: null,
            userName: 'Anonim #1a2b3c4d',
            bibNumber: '2',
            time: '0:45:00',
            timeInSeconds: 2700,
            position: 2,
            categoryPosition: 2,
          }),
        ]}
      />,
    );

    const links = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(links).toContain('/athlete/u1');
    expect(links.some((href) => href?.includes('/athlete/null'))).toBe(false);
    expect(screen.getAllByText('Anonim #1a2b3c4d').length).toBeGreaterThan(0);
  });
});
