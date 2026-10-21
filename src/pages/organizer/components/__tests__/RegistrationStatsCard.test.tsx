import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { RegistrationStatsCard } from '../RegistrationStatsCard';
import type { RegistrationStats } from '@/types';

const getRegistrationStats = vi.fn();

vi.mock('@/api', () => ({
  getRegistrationStats: (...args: unknown[]) => getRegistrationStats(...args),
}));

const baseStats: RegistrationStats = {
  byDistance: [{ distanceId: 'd1', distanceName: '10 km', count: 42 }],
  byPaymentStatus: [
    { status: 'paid', label: 'Opłacone', count: 30 },
    { status: 'pending', label: 'Oczekujące', count: 10 },
    { status: 'expired', label: 'Wygasłe', count: 1 },
    { status: 'cancelled', label: 'Anulowane', count: 1 },
    { status: 'refunded', label: 'Zwrócone', count: 0 },
  ],
  signupCurve: [
    { date: '2026-09-01', count: 2 },
    { date: '2026-09-02', count: 5 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RegistrationStatsCard', () => {
  it('renders the built-in distance, payment-status and signup-curve breakdowns', async () => {
    getRegistrationStats.mockResolvedValue({ success: true, data: baseStats });

    render(<RegistrationStatsCard eventId="event-1" />);

    expect(await screen.findByText('10 km')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Opłacone')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    // Accessible text alternative to the signup-curve chart.
    expect(screen.getByText('2026-09-01')).toBeInTheDocument();
    expect(screen.getByText('2026-09-02')).toBeInTheDocument();

    expect(getRegistrationStats).toHaveBeenCalledWith('event-1');
  });

  it('omits gender/club/age-category sections entirely when the server omits the keys', async () => {
    getRegistrationStats.mockResolvedValue({ success: true, data: baseStats });

    render(<RegistrationStatsCard eventId="event-1" />);

    await waitFor(() => expect(screen.getByText('10 km')).toBeInTheDocument());

    expect(screen.queryByText('Płeć')).not.toBeInTheDocument();
    expect(screen.queryByText('Klub')).not.toBeInTheDocument();
    expect(screen.queryByText('Kategorie wiekowe')).not.toBeInTheDocument();
  });

  it('renders gender/club/age-category sections when the server includes them', async () => {
    getRegistrationStats.mockResolvedValue({
      success: true,
      data: {
        ...baseStats,
        byGender: [
          { key: 'M', label: 'Mężczyzna', count: 20 },
          { key: 'K', label: 'Kobieta', count: 22 },
        ],
        byClub: [{ key: 'AZS Warszawa', label: 'AZS Warszawa', count: 3 }],
        ageCategories: [
          {
            distanceId: 'd1',
            distanceName: '10 km',
            counts: [{ key: 'k18-29', label: 'K18-29', count: 5 }],
          },
        ],
      } satisfies RegistrationStats,
    });

    render(<RegistrationStatsCard eventId="event-1" />);

    expect(await screen.findByText('Płeć')).toBeInTheDocument();
    expect(screen.getByText('Mężczyzna')).toBeInTheDocument();
    expect(screen.getByText('Klub')).toBeInTheDocument();
    expect(screen.getByText('AZS Warszawa')).toBeInTheDocument();
    expect(screen.getByText('Kategorie wiekowe')).toBeInTheDocument();
    expect(screen.getByText('K18-29')).toBeInTheDocument();
  });

  it('shows an empty-state message when there are no signups yet', async () => {
    getRegistrationStats.mockResolvedValue({
      success: true,
      data: { byDistance: [], byPaymentStatus: [], signupCurve: [] } satisfies RegistrationStats,
    });

    render(<RegistrationStatsCard eventId="event-1" />);

    await waitFor(() => expect(screen.getAllByText('Brak zapisów.').length).toBeGreaterThan(0));
  });
});
