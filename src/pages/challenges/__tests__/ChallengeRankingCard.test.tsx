import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChallengeRankingCard } from '../ChallengeRankingCard';
import type { ChallengeRanking } from '@/types';

// E6.6 (issue 15 §6, "Ranking: publiczny, z respektowaniem anonimizacji"):
// the ranking table renders exactly what the server sends — rank/name/points
// — and never re-derives or reveals a name for a row the server already
// masked (CompetitorNamePresenter runs server-side; this component has no
// access to a real name for an anonymized row at all).

const { mockGetChallengeRanking } = vi.hoisted(() => ({
  mockGetChallengeRanking: vi.fn(),
}));

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getChallengeRanking: mockGetChallengeRanking,
  };
});

const renderCard = (ranking: ChallengeRanking) => {
  mockGetChallengeRanking.mockResolvedValue({ data: ranking, success: true });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ChallengeRankingCard challengeId="chal-1" />
    </QueryClientProvider>,
  );
};

describe('ChallengeRankingCard (E6.6)', () => {
  it('renders rank, name and points for a point-based ranking, including a masked row', async () => {
    renderCard({
      hasPoints: true,
      entries: [
        {
          rank: 1,
          userId: 'u-1',
          name: 'Anna Kowalska',
          isAnonymized: false,
          points: 200,
          isCompleted: true,
        },
        {
          rank: 1,
          userId: 'u-2',
          name: 'Zawodnik anonimowy',
          isAnonymized: true,
          points: 200,
          isCompleted: true,
        },
        {
          rank: 3,
          userId: 'u-3',
          name: 'Piotr Nowak',
          isAnonymized: false,
          points: 100,
          isCompleted: false,
        },
      ],
    });

    expect(await screen.findByText('Anna Kowalska')).toBeInTheDocument();
    expect(screen.getByText('Zawodnik anonimowy')).toBeInTheDocument();
    expect(screen.getByText('Piotr Nowak')).toBeInTheDocument();

    // The masked row's real identity never appears anywhere in the table.
    expect(screen.queryByText(/Anonim.*Kowalski|Anonim.*Nowak/)).not.toBeInTheDocument();

    const rows = screen.getAllByRole('row');
    // header + 3 entries
    expect(rows).toHaveLength(4);

    const tiedRow = rows.find((row) => within(row).queryByText('Zawodnik anonimowy'));
    expect(tiedRow).toBeDefined();
    expect(within(tiedRow!).getByText('1')).toBeInTheDocument();
    expect(within(tiedRow!).getByText('200')).toBeInTheDocument();

    const thirdRow = rows.find((row) => within(row).queryByText('Piotr Nowak'));
    expect(within(thirdRow!).getByText('3')).toBeInTheDocument();
    expect(within(thirdRow!).getByText('100')).toBeInTheDocument();
  });

  it('labels the points column as completion status when the Wyzwanie has no point total', async () => {
    renderCard({
      hasPoints: false,
      entries: [
        {
          rank: 1,
          userId: 'u-1',
          name: 'Completed Runner',
          isAnonymized: false,
          points: 1,
          isCompleted: true,
        },
        {
          rank: 2,
          userId: 'u-2',
          name: 'In Progress Runner',
          isAnonymized: false,
          points: 0,
          isCompleted: false,
        },
      ],
    });

    expect(await screen.findByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Ukończono')).toBeInTheDocument();
    expect(screen.getByText('W trakcie')).toBeInTheDocument();
  });

  it('shows an empty state when nobody has joined yet', async () => {
    renderCard({ hasPoints: true, entries: [] });

    expect(
      await screen.findByText('Nikt jeszcze nie dołączył do tego Wyzwania.'),
    ).toBeInTheDocument();
  });
  it('keys rows per Zawodnik: a ward without an account next to others raises no duplicate-key warning', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderCard({
      hasPoints: false,
      entries: [
        {
          rank: 1,
          userId: 'u-1',
          competitorId: 'c-1',
          name: 'Jan Rodzic',
          isAnonymized: false,
          points: 1,
          isCompleted: true,
        },
        {
          rank: 1,
          userId: null,
          competitorId: 'c-2',
          name: 'Zosia Rodzic',
          isAnonymized: false,
          points: 1,
          isCompleted: true,
        },
        {
          rank: 1,
          userId: null,
          competitorId: 'c-3',
          name: 'Ola Rodzic',
          isAnonymized: false,
          points: 1,
          isCompleted: true,
        },
      ],
    });

    expect(await screen.findByText('Zosia Rodzic')).toBeInTheDocument();
    expect(screen.getByText('Ola Rodzic')).toBeInTheDocument();
    const keyWarnings = errorSpy.mock.calls.filter((call) => String(call[0]).includes('same key'));
    expect(keyWarnings).toHaveLength(0);
    errorSpy.mockRestore();
  });
});
