import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FiltersContent } from '../FiltersContent';
import type { EventFiltersState } from '@/hooks/useEventFilters';
import type { EventSeries } from '@/types';

// Regression test: `queryFn: getSeries` used to pass react-query's
// QueryFunctionContext straight through as the (unused) filters argument at
// runtime, and the resulting `unknown`-typed response would throw on the
// following `.map` call, crashing the series filter section. The fix wraps
// it as `() => getSeries()`. This asserts the API is called with no stray
// argument and that the resolved series actually render.

const getSeries = vi.fn();

vi.mock('@/api', () => ({
  disciplineLabels: {
    running: 'Bieganie',
    cycling: 'Kolarstwo',
    triathlon: 'Triathlon',
    multisport: 'Multisport',
  },
  getSeries: (...args: unknown[]) => getSeries(...args),
}));

const defaultFilters: EventFiltersState = {
  search: '',
  disciplines: [],
  cities: [],
  statuses: [],
  eventTypes: [],
  seriesId: null,
  distanceRanges: [],
  organizerId: null,
  hasEarlyBird: false,
  selectedYear: 2026,
};

const testSeries: EventSeries[] = [
  {
    id: 'series-1',
    name: 'Grand Prix Warszawy',
    slug: 'grand-prix-warszawy',
    type: 'cup',
    description: 'Opis',
    organizerId: 'organizer-1',
    organizerName: 'Organizator',
    eventIds: [],
    status: 'active',
  },
];

const renderFiltersContent = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <FiltersContent
        filters={defaultFilters}
        updateFilter={vi.fn()}
        toggleArrayFilter={vi.fn()}
        clearFilters={vi.fn()}
        hasActiveFilters={false}
        cities={[]}
        organizers={[]}
        filteredCount={0}
      />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FiltersContent', () => {
  it('calls getSeries with no arguments and renders the resolved series once the section is opened', async () => {
    getSeries.mockResolvedValue({ data: testSeries });
    const user = userEvent.setup();

    renderFiltersContent();

    // The "Seria" section is collapsed by default, so its options only mount once opened.
    await user.click(screen.getByText('Seria'));

    expect(await screen.findByText('Grand Prix Warszawy')).toBeInTheDocument();
    expect(getSeries).toHaveBeenCalledTimes(1);
    expect(getSeries).toHaveBeenCalledWith();
  });
});
