import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminChallengesTab } from '../AdminChallengesTab';
import type { Challenge, ChallengeParticipation } from '@/types';

// E6.4 (issue 15 §3): the Moderator/Admin manual-verification review screen —
// shared between /admin and /moderator via `basePath` (ModeratorChallengesTab
// just re-exports this component). These tests cover the two pieces this
// ticket adds on top of the pre-existing approve/reject buttons: a visible
// link to the submitted proof, and capturing an optional rejection reason
// (reviewChallengeEntry's `reason` param already existed on the contract but
// was never actually wired up from this screen before).

const mockReviewChallengeEntry = vi.fn().mockResolvedValue({ data: { id: 'entry-pending' } });

const { challenge, participation } = vi.hoisted(() => ({
  challenge: {
    id: 'chal-1',
    name: 'Korona Krakowa',
    slug: 'korona-krakowa',
    description: 'Opis',
    events: [
      { eventId: 'evt-ext-1', eventName: 'Polmaraton Korony 2015', eventDate: '2015-09-06' },
    ],
    rule: { minCompleted: 1 },
    rewards: [],
    status: 'active',
    createdBy: 'admin-1',
  } satisfies Challenge,
  participation: {
    id: 'part-1',
    challengeId: 'chal-1',
    userId: 'user-1',
    userName: 'Jan Kowalski',
    joinedAt: '2026-01-01T00:00:00.000Z',
    completedCount: 0,
    isCompleted: false,
    rewardGranted: false,
    entries: [
      {
        id: 'entry-pending',
        challengeId: 'chal-1',
        userId: 'user-1',
        eventId: 'evt-ext-1',
        status: 'pending',
        proofUrl: 'https://example.test/dowod.jpg',
        submittedTime: '01:45:30',
      },
    ],
  } satisfies ChallengeParticipation,
}));

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getChallenges: vi.fn().mockResolvedValue({ data: [challenge] }),
    getChallengeParticipations: vi.fn().mockResolvedValue({ data: [participation] }),
    reviewChallengeEntry: (...args: unknown[]) => mockReviewChallengeEntry(...args),
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const renderTab = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminChallengesTab basePath="/moderator" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  mockReviewChallengeEntry.mockResolvedValue({ data: { id: 'entry-pending' } });
});

describe('AdminChallengesTab manual verification review (E6.4)', () => {
  it('shows a link to the submitted proof for a pending manual entry', async () => {
    renderTab();

    const proofLink = await screen.findByRole('link', { name: /zobacz dow[oó]d/i });
    expect(proofLink).toHaveAttribute('href', 'https://example.test/dowod.jpg');
  });

  it('approves an entry without asking for a reason', async () => {
    const user = userEvent.setup();
    renderTab();

    await screen.findByRole('link', { name: /zobacz dow[oó]d/i });
    await user.click(screen.getByRole('button', { name: /^Zatwierdź$/i }));

    await waitFor(() => {
      expect(mockReviewChallengeEntry).toHaveBeenCalledWith('entry-pending', 'approved', undefined);
    });
  });

  it('opens a reason dialog on reject and sends the typed reason', async () => {
    const user = userEvent.setup();
    renderTab();

    await screen.findByRole('link', { name: /zobacz dow[oó]d/i });
    await user.click(screen.getByRole('button', { name: /^Odrzuć$/i }));

    const reasonField = await screen.findByLabelText(/powód odrzucenia/i);
    await user.type(reasonField, 'Dowód nieczytelny');
    await user.click(screen.getByRole('button', { name: /^Odrzuć zgłoszenie$/i }));

    await waitFor(() => {
      expect(mockReviewChallengeEntry).toHaveBeenCalledWith(
        'entry-pending',
        'rejected',
        'Dowód nieczytelny',
      );
    });
  });
});

describe('AdminChallengesTab proof link safety (PP.50)', () => {
  it('does not render a link for a javascript: proofUrl', async () => {
    const entry = participation.entries[0];
    const original = entry.proofUrl;
    entry.proofUrl = 'javascript:window.__xss=1';
    try {
      const { container } = renderTab();
      await screen.findByText('Jan Kowalski');
      expect(container.querySelector('a[href^="javascript" i]')).toBeNull();
      expect(screen.queryByRole('link', { name: /zobacz dow[oó]d/i })).toBeNull();
    } finally {
      entry.proofUrl = original;
    }
  });

  it('renders a noopener link for an https proofUrl', async () => {
    renderTab();
    const proofLink = await screen.findByRole('link', { name: /zobacz dow[oó]d/i });
    expect(proofLink).toHaveAttribute('href', 'https://example.test/dowod.jpg');
    expect(proofLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
