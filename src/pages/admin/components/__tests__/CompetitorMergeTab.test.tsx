import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompetitorMergeTab } from '../CompetitorMergeTab';
import type { Competitor, CompetitorMergeComparison, CompetitorMergeConflict } from '@/types';

// The
// comparison + conflict-resolution UI. Covers: finding two profiles,
// requiring an explicit field decision for every differing field (
// no default, no "profile with an account wins"),
// requiring a winner for a detected registration conflict before the merge
// can be reviewed, the confirmation step before the permanent merge fires,
// and the server's field_decisions_required/conflict_pending responses
// (200 with a status discriminator, not an HTTP error — see routes.php)
// being surfaced back into the UI instead of only being toasted away.

const { survivorCandidate, absorbedCandidate, comparisonFixture, mockMergeCompetitors } =
  vi.hoisted(() => {
    const survivor: Competitor = {
      id: 'comp-survivor',
      firstName: 'Ala',
      lastName: 'Testowa',
      birthDate: '2015-01-01',
      identityCode: 'zqr_survivor',
    };

    const absorbed: Competitor = {
      id: 'comp-absorbed',
      firstName: 'Ala',
      lastName: 'Testowa',
      birthDate: '2014-06-06',
      identityCode: 'zqr_absorbed',
    };

    const fixture = (
      conflicts: import('@/types').CompetitorMergeConflict[] = [],
    ): import('@/types').CompetitorMergeComparison => ({
      competitors: [
        {
          competitor: survivor,
          registrations: [
            {
              id: 'reg-survivor-1',
              eventId: 'evt-1',
              eventName: 'Bieg Testowy',
              userId: 'user-1',
              userName: 'Ala Testowa',
              userEmail: 'ala@example.test',
              distanceId: 'dist-1',
              distanceName: '10 km',
              category: 'Open',
              registeredAt: '2026-01-01T00:00:00.000Z',
              status: 'confirmed',
            },
          ],
          lifetimeRecords: [],
          challengeParticipations: [],
          caregivers: [],
        },
        {
          competitor: absorbed,
          registrations: [],
          lifetimeRecords: [],
          challengeParticipations: [],
          caregivers: [],
        },
      ],
      conflicts,
    });

    return {
      survivorCandidate: survivor,
      absorbedCandidate: absorbed,
      comparisonFixture: fixture,
      mockMergeCompetitors: vi.fn(),
    };
  });

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    searchCompetitorsForMerge: vi
      .fn()
      .mockResolvedValue({ data: [survivorCandidate, absorbedCandidate] }),
    getCompetitorMergeComparison: vi.fn().mockResolvedValue({ data: comparisonFixture() }),
    mergeCompetitors: (payload: unknown) => mockMergeCompetitors(payload),
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const renderTab = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CompetitorMergeTab />
    </QueryClientProvider>,
  );
};

async function searchAndPickBoth(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/szukaj zawodnika/i), 'Testowa');
  await user.click(screen.getByRole('button', { name: /^Szukaj$/i }));

  const items = await screen.findAllByRole('button', { name: /dodaj do porównania/i });
  await user.click(items[0]);
  const remaining = await screen.findAllByRole('button', { name: /dodaj do porównania/i });
  await user.click(remaining[0]);
}

beforeEach(async () => {
  vi.clearAllMocks();
  mockMergeCompetitors.mockResolvedValue({
    data: { status: 'merged', survivor: survivorCandidate, absorbed: absorbedCandidate },
  });
  // `clearAllMocks` only wipes call history, not an implementation installed via
  // `mockResolvedValue` — reinstall the plain (no-conflict) fixture every test so
  // a conflict-injecting test doesn't leak its override into the next one.
  const { getCompetitorMergeComparison, searchCompetitorsForMerge } = await import('@/api');
  vi.mocked(getCompetitorMergeComparison).mockResolvedValue({
    success: true,
    data: comparisonFixture(),
  });
  vi.mocked(searchCompetitorsForMerge).mockResolvedValue({
    success: true,
    data: [survivorCandidate, absorbedCandidate],
  });
});

describe('CompetitorMergeTab', () => {
  it('lets a moderator find two candidates and shows both side by side', async () => {
    const user = userEvent.setup();
    renderTab();

    await searchAndPickBoth(user);

    expect(await screen.findAllByText(/Ala Testowa/)).not.toHaveLength(0);
    // Registrations for the profile that has one are visible in the comparison.
    expect(await screen.findByText(/Bieg Testowy/)).toBeInTheDocument();
  });

  it('requires an explicit decision for every differing field before merge can be reviewed', async () => {
    const user = userEvent.setup();
    renderTab();
    await searchAndPickBoth(user);

    await user.click(screen.getAllByRole('radio')[0]);

    const reviewButton = screen.getByRole('button', { name: /przejrzyj i scal/i });
    expect(reviewButton).toBeDisabled();

    // Birth dates differ between the two profiles — resolving it should unlock review.
    const birthDateFieldset = screen.getByRole('group', { name: /^Data urodzenia$/i });
    const survivorOption = within(birthDateFieldset).getAllByRole('radio')[0];
    await user.click(survivorOption);

    await waitFor(() => expect(reviewButton).toBeEnabled());
  });

  it('blocks the merge on a registration conflict until a winner is chosen, then submits the resolution', async () => {
    const { getCompetitorMergeComparison } = await import('@/api');
    // Give the absorbed side a conflicting registration for the same event+distance
    // as the survivor's one from the fixture, so both ids resolve to a real row.
    const conflict: CompetitorMergeConflict = {
      eventId: 'evt-1',
      eventName: 'Bieg Testowy',
      distanceId: 'dist-1',
      distanceName: '10 km',
      registrationIds: ['reg-survivor-1', 'reg-absorbed-1'],
    };
    const comparisonWithConflict: CompetitorMergeComparison = {
      competitors: [
        comparisonFixture().competitors[0],
        {
          ...comparisonFixture().competitors[1],
          registrations: [
            {
              id: 'reg-absorbed-1',
              eventId: 'evt-1',
              eventName: 'Bieg Testowy',
              userId: 'user-2',
              userName: 'Ala Testowa',
              userEmail: 'ala2@example.test',
              distanceId: 'dist-1',
              distanceName: '10 km',
              category: 'Open',
              registeredAt: '2026-01-01T00:00:00.000Z',
              status: 'confirmed',
            },
          ],
        },
      ],
      conflicts: [conflict],
    };
    vi.mocked(getCompetitorMergeComparison).mockResolvedValue({
      success: true,
      data: comparisonWithConflict,
    });

    const user = userEvent.setup();
    renderTab();
    await searchAndPickBoth(user);

    // Pick the survivor as the merge target first — the conflict section only
    // renders once both sides of the comparison are known.
    await user.click(screen.getAllByRole('radio')[0]);

    expect(await screen.findByText(/konflikt zapisów/i)).toBeInTheDocument();
    const reviewButton = screen.getByRole('button', { name: /przejrzyj i scal/i });
    expect(reviewButton).toBeDisabled();

    const birthDateFieldset = screen.getByRole('group', { name: /^Data urodzenia$/i });
    await user.click(within(birthDateFieldset).getAllByRole('radio')[0]);

    const conflictFieldset = screen.getByRole('group', { name: /bieg testowy · 10 km/i });
    await user.click(within(conflictFieldset).getAllByRole('radio')[0]);

    await waitFor(() => expect(reviewButton).toBeEnabled());
    await user.click(reviewButton);

    await user.click(await screen.findByRole('button', { name: /^Scal profile$/i }));

    await waitFor(() => expect(mockMergeCompetitors).toHaveBeenCalled());
    const payload = mockMergeCompetitors.mock.calls[0][0] as { conflictResolutions: unknown[] };
    expect(payload.conflictResolutions).toHaveLength(1);
  });

  it('shows a confirmation dialog before executing the permanent merge, and reports success', async () => {
    const user = userEvent.setup();
    renderTab();
    await searchAndPickBoth(user);

    await user.click(screen.getAllByRole('radio')[0]);
    const birthDateFieldset = screen.getByRole('group', { name: /^Data urodzenia$/i });
    await user.click(within(birthDateFieldset).getAllByRole('radio')[0]);

    const reviewButton = screen.getByRole('button', { name: /przejrzyj i scal/i });
    await waitFor(() => expect(reviewButton).toBeEnabled());
    await user.click(reviewButton);

    expect(await screen.findByText(/potwierdź scalenie profili/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Scal profile$/i }));

    await waitFor(() => expect(mockMergeCompetitors).toHaveBeenCalledTimes(1));
  });

  it('surfaces a field_decisions_required response from the server without treating it as an HTTP error', async () => {
    mockMergeCompetitors.mockResolvedValueOnce({
      data: { status: 'field_decisions_required', fields: ['birthDate'] },
    });

    const user = userEvent.setup();
    renderTab();
    await searchAndPickBoth(user);

    await user.click(screen.getAllByRole('radio')[0]);
    const birthDateFieldset = screen.getByRole('group', { name: /^Data urodzenia$/i });
    await user.click(within(birthDateFieldset).getAllByRole('radio')[0]);

    const reviewButton = screen.getByRole('button', { name: /przejrzyj i scal/i });
    await waitFor(() => expect(reviewButton).toBeEnabled());
    await user.click(reviewButton);
    await user.click(await screen.findByRole('button', { name: /^Scal profile$/i }));

    expect(await screen.findByText(/brakuje decyzji/i)).toBeInTheDocument();
  });
});
