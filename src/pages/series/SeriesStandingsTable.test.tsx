import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { SeriesStandingsTable } from './SeriesStandingsTable';
import type { Event } from '@/types';

describe('SeriesStandingsTable event column links', () => {
  it('links event headers by slug', () => {
    render(
      <SeriesStandingsTable
        standings={[
          {
            userId: 'u1',
            userName: 'Jan',
            totalPoints: 10,
            eventsCount: 1,
            eventPoints: { 'evt-9': 10 },
          },
        ]}
        completedEvents={[{ id: 'evt-9', slug: 'bieg-9', name: 'Bieg dziewiaty' } as Event]}
        genderFilter="all"
        onGenderFilterChange={vi.fn()}
        onExportCSV={vi.fn()}
        onExportPDF={vi.fn()}
        onClearFilters={vi.fn()}
      />,
    );
    expect(screen.getByRole('link', { name: 'Bieg dziewiaty' })).toHaveAttribute(
      'href',
      '/events/bieg-9',
    );
  });
});
