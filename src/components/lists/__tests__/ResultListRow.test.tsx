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

describe('ResultListRow place by gender (G-03)', () => {
  it('shows the place by gender next to the open and category places', () => {
    render(
      <ResultListRow result={{ ...result, gender: 'K', genderPosition: 3 }} showEvent={false} />,
    );
    expect(screen.getAllByText(/Kobiety/)[0]).toHaveTextContent('Kobiety: 3');
  });

  it('shows nothing when the gender place is unknown', () => {
    render(
      <ResultListRow result={{ ...result, gender: 'M', genderPosition: 0 }} showEvent={false} />,
    );
    expect(screen.queryByText(/Mężczyźni/)).not.toBeInTheDocument();
  });
});
