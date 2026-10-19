import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { ResultListRow } from '../ResultListRow';
import type { Event, Result } from '@/types';

const result = {
  id: 'r1',
  eventId: 'evt-123',
  eventName: 'Bieg Testowy',
  distanceId: 'd1',
  distanceName: '10 km',
  userId: 'u1',
  userName: 'Jan Kowalski',
  bibNumber: '1',
  category: 'M30',
  time: '00:40:00',
  timeInSeconds: 2400,
  position: 1,
  categoryPosition: 1,
  status: 'finished',
} as Result;

describe('ResultListRow event link (L-03)', () => {
  it('links to the event results tab by slug, not to a nonexistent /results page', () => {
    render(
      <ResultListRow
        result={result}
        event={{ id: 'evt-123', slug: 'bieg-testowy', date: '2026-05-01' } as Event}
        showDownload
      />,
    );
    expect(screen.getByRole('link', { name: 'Wyniki wydarzenia' })).toHaveAttribute(
      'href',
      '/events/bieg-testowy/results',
    );
  });
});
