import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { TeamClassificationCard } from '@/components/results/TeamClassificationCard';
import type { TeamClassificationEntry } from '@/types';
import { getTeamClassification } from '@/api';

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getTeamClassification: vi.fn(),
  };
});

const mockedGetTeamClassification = vi.mocked(getTeamClassification);

const makeTeam = (overrides: Partial<TeamClassificationEntry> = {}): TeamClassificationEntry => ({
  teamId: 't1',
  teamName: 'Górskie Wilki',
  memberCount: 4,
  aggregationRule: 'sum',
  aggregatedTimeInSeconds: 3725,
  position: 1,
  ...overrides,
});

describe('TeamClassificationCard', () => {
  // Each test uses a distinct (eventId, distanceId) pair: react-query's cache
  // is a module-level singleton shared across tests via the test-utils
  // render(), so reusing a query key would let one test observe another's
  // cached (or perpetually-pending) result.

  it('shows a loading state while the query is in flight', () => {
    mockedGetTeamClassification.mockReturnValue(new Promise(() => {}));
    render(<TeamClassificationCard eventId="e-loading" distanceId="d-loading" />);

    expect(screen.getByText('Wczytywanie...')).toBeInTheDocument();
  });

  it('shows an empty-state message when no teams have finished yet', async () => {
    mockedGetTeamClassification.mockResolvedValue({ data: [] } as never);
    render(<TeamClassificationCard eventId="e-empty" distanceId="d-empty" />);

    await waitFor(() =>
      expect(screen.getByText(/Klasyfikacja drużynowa pojawi się/)).toBeInTheDocument(),
    );
  });

  it('renders team rows with formatted aggregated time and aggregation rule label', async () => {
    mockedGetTeamClassification.mockResolvedValue({
      data: [makeTeam()],
    } as never);
    render(<TeamClassificationCard eventId="e-rows" distanceId="d-rows" />);

    await waitFor(() => expect(screen.getByText('Górskie Wilki')).toBeInTheDocument());
    expect(screen.getByText('1:02:05')).toBeInTheDocument();
    expect(screen.getByText('(Suma czasów członków)')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders a trophy indicator only for top-3 positions', async () => {
    mockedGetTeamClassification.mockResolvedValue({
      data: [
        makeTeam({ teamId: 't1', teamName: 'Top Team', position: 1 }),
        makeTeam({ teamId: 't2', teamName: 'Fourth Team', position: 4 }),
      ],
    } as never);
    const { container } = render(
      <TeamClassificationCard eventId="e-trophy" distanceId="d-trophy" />,
    );

    await waitFor(() => expect(screen.getByText('Top Team')).toBeInTheDocument());
    // one trophy icon (lucide renders an <svg>) for the position-1 row only
    const trophySvgs = container.querySelectorAll('svg.lucide-trophy');
    expect(trophySvgs).toHaveLength(1);
  });
});
