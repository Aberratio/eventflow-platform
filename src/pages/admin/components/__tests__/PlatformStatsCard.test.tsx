import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render, resetQueryClient } from '@/test/test-utils';
import { PlatformStatsCard } from '../PlatformStatsCard';
import type { PlatformStats } from '@/types';

const getPlatformStats = vi.fn();

vi.mock('@/api', () => ({
  getPlatformStats: (...args: unknown[]) => getPlatformStats(...args),
}));

const baseStats: PlatformStats = {
  eventsByStatus: [
    { status: 'draft', count: 3 },
    { status: 'submitted', count: 1 },
    { status: 'approved', count: 0 },
    { status: 'published', count: 12 },
    { status: 'finished', count: 8 },
    { status: 'rejected', count: 0 },
    { status: 'cancelled', count: 2 },
  ],
  organizerCount: 17,
  activePackageCredits: 9,
};

beforeEach(() => {
  vi.clearAllMocks();
  resetQueryClient();
});

describe('PlatformStatsCard', () => {
  it('renders the organizer count, active package credits and events-by-status breakdown', async () => {
    getPlatformStats.mockResolvedValue({ success: true, data: baseStats });

    render(<PlatformStatsCard />);

    expect(await screen.findByText('17')).toBeInTheDocument();
    expect(screen.getByText('Organizatorów')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('Aktywnych pakietów')).toBeInTheDocument();

    expect(screen.getAllByText('Wersja robocza').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Aktywne').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Zakończone').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Odwołane').length).toBeGreaterThan(0);
    // 'approved' has no app-level label (server never rests there) — falls
    // back to the raw status string rather than crashing.
    expect(screen.getAllByText('approved').length).toBeGreaterThan(0);

    expect(getPlatformStats).toHaveBeenCalled();
  });

  it('renders nothing once loaded if the request fails (e.g. non-admin, 403)', async () => {
    getPlatformStats.mockRejectedValue(new Error('forbidden'));

    const { container } = render(<PlatformStatsCard />);

    await waitFor(() => expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument());
    expect(container).toBeEmptyDOMElement();
  });

  it('shows zero counts without crashing when there are no events or organizers yet', async () => {
    getPlatformStats.mockResolvedValue({
      success: true,
      data: {
        eventsByStatus: [
          { status: 'draft', count: 0 },
          { status: 'submitted', count: 0 },
          { status: 'approved', count: 0 },
          { status: 'published', count: 0 },
          { status: 'finished', count: 0 },
          { status: 'rejected', count: 0 },
          { status: 'cancelled', count: 0 },
        ],
        organizerCount: 0,
        activePackageCredits: 0,
      } satisfies PlatformStats,
    });

    render(<PlatformStatsCard />);

    await waitFor(() => expect(screen.getByText('Organizatorów')).toBeInTheDocument());
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});
