import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChallengeDetailsPage from '../ChallengeDetailsPage';
import type { ChallengeParticipation } from '@/types';

// jsdom does not implement the Pointer Events methods Radix's Select uses;
// stub them the same way ShopPage.test.tsx/AddDiscountCodeDialog.test.tsx do.
Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
  value: () => false,
});
Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
  value: () => undefined,
});
Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
  value: () => undefined,
});
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: () => undefined,
});

// E6.5 (issue 15 §4-5): "Uczestnictwo odblokowuje zakup Produktu" — the
// reward-selection UI on ChallengeDetailsPage must only appear once the real
// tree-based completion (participation.isCompleted, server-computed) is
// true, must disappear/show a claimed state once rewardGranted flips, and
// must surface the shop's existing out-of-stock error the same way CartPage
// does (a toast with the server's message), not a bespoke UX.

const { mockToast, mockClaimChallengeReward, baseChallenge, baseParticipation } = vi.hoisted(
  () => ({
    mockToast: vi.fn(),
    mockClaimChallengeReward: vi.fn(),
    baseChallenge: {
      id: 'chal-1',
      name: 'Korona Gór',
      slug: 'korona-gor',
      description: 'Ukończ wszystkie biegi',
      events: [{ eventId: 'evt-1', eventName: 'Bieg 1', eventDate: '2026-05-01' }],
      products: [{ productId: 'prod-ring', purpose: 'reward' as const, sortOrder: 0 }],
      rule: { minCompleted: 1 },
      rewards: [
        {
          id: 'prod-ring',
          productId: 'prod-ring',
          name: 'Pierścień Korony',
          type: 'product' as const,
          price: 199,
          sizes: ['S', 'M', 'L'],
        },
      ],
      status: 'active' as const,
      createdBy: 'admin-1',
    },
    baseParticipation: {
      id: 'part-1',
      challengeId: 'chal-1',
      userId: 'user-1',
      userName: 'Tester',
      joinedAt: '2026-01-01T00:00:00.000Z',
      entries: [],
      completedCount: 1,
      isCompleted: true,
      rewardGranted: false,
    },
  }),
);

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getChallengeBySlug: vi.fn().mockResolvedValue({ data: baseChallenge, success: true }),
    getChallengeParticipations: vi.fn(),
    getChallengeRanking: vi.fn().mockResolvedValue({
      data: { hasPoints: true, entries: [] },
      success: true,
    }),
    getDeliveryMethods: vi.fn().mockResolvedValue({
      data: [{ id: 'pickup', name: 'Odbior osobisty', price: 0, estimatedDays: 'w dniu zawodow' }],
      success: true,
    }),
    getShopPaymentMethods: vi.fn().mockResolvedValue({
      data: [{ id: 'card', name: 'Karta' }],
      success: true,
    }),
    claimChallengeReward: mockClaimChallengeReward,
  };
});

vi.mock('@/contexts/AuthContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({ user: { id: 'user-1', role: 'participant' } }),
  };
});

vi.mock('@/hooks/use-toast', () => ({
  toast: (...args: unknown[]) => mockToast(...args),
  useToast: () => ({ toast: mockToast }),
}));

const setup = async (participation: ChallengeParticipation | null) => {
  const apiModule = await import('@/api');
  vi.mocked(apiModule.getChallengeParticipations).mockResolvedValue({
    data: participation ? [participation] : [],
    success: true,
  });

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/challenges/korona-gor']}>
        <Routes>
          <Route path="/challenges/:slug" element={<ChallengeDetailsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('ChallengeDetailsPage reward claim (E6.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not show the reward-claim trigger before the challenge is completed', async () => {
    await setup({ ...baseParticipation, isCompleted: false, completedCount: 0 });

    expect(await screen.findByText('Korona Gór')).toBeInTheDocument();
    expect(screen.queryByTestId('claim-reward-trigger')).not.toBeInTheDocument();
    expect(screen.getByText('Ukończ Wyzwanie, aby odblokować wybór nagrody.')).toBeInTheDocument();
  });

  it('shows the reward-claim trigger once completed and not yet claimed', async () => {
    await setup({ ...baseParticipation, isCompleted: true, rewardGranted: false });

    expect(await screen.findByTestId('claim-reward-trigger')).toBeInTheDocument();
  });

  it('hides the trigger and shows a claimed state once rewardGranted is true', async () => {
    await setup({
      ...baseParticipation,
      isCompleted: true,
      rewardGranted: true,
      rewardGrantedAt: '2026-06-01T10:00:00.000Z',
    });

    await waitFor(() => expect(screen.getByText(/Nagroda odebrana/)).toBeInTheDocument());
    expect(screen.queryByTestId('claim-reward-trigger')).not.toBeInTheDocument();
  });

  it('submits a claim with the selected reward, size, delivery and payment method', async () => {
    mockClaimChallengeReward.mockResolvedValue({
      data: { ...baseParticipation, rewardGranted: true },
      success: true,
    });
    const user = userEvent.setup();
    await setup({ ...baseParticipation, isCompleted: true, rewardGranted: false });

    await user.click(await screen.findByTestId('claim-reward-trigger'));
    const dialog = await screen.findByRole('dialog');

    // Delivery method (pickup, the only option) and payment method (card)
    // must both be explicitly selected before the claim is enabled — same
    // "select before you can check out" pattern as CartPage.
    await user.click(within(dialog).getByLabelText('Metoda dostawy'));
    await user.click(await screen.findByText('Odbior osobisty (bezpłatnie)'));
    await user.click(within(dialog).getByLabelText('Metoda płatności'));
    await user.click(await screen.findByText('Karta'));

    const submit = within(dialog).getByRole('button', { name: /Potwierdź odbiór nagrody/ });
    await waitFor(() => expect(submit).not.toBeDisabled());
    await user.click(submit);

    await waitFor(() => expect(mockClaimChallengeReward).toHaveBeenCalledTimes(1));
    expect(mockClaimChallengeReward).toHaveBeenCalledWith(
      'chal-1',
      expect.objectContaining({
        productId: 'prod-ring',
        deliveryMethod: expect.objectContaining({ id: 'pickup' }),
        paymentMethod: expect.objectContaining({ id: 'card' }),
      }),
    );
  });

  it('shows the server out-of-stock error as a toast, mirroring the shop checkout pattern', async () => {
    mockClaimChallengeReward.mockRejectedValue(
      new Error('Requested quantity exceeds available stock for one or more products.'),
    );
    const user = userEvent.setup();
    await setup({ ...baseParticipation, isCompleted: true, rewardGranted: false });

    await user.click(await screen.findByTestId('claim-reward-trigger'));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByLabelText('Metoda dostawy'));
    await user.click(await screen.findByText('Odbior osobisty (bezpłatnie)'));
    await user.click(within(dialog).getByLabelText('Metoda płatności'));
    await user.click(await screen.findByText('Karta'));

    const submit = within(dialog).getByRole('button', { name: /Potwierdź odbiór nagrody/ });
    await waitFor(() => expect(submit).not.toBeDisabled());
    await user.click(submit);

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Nie udało się odebrać nagrody',
          description: 'Requested quantity exceeds available stock for one or more products.',
        }),
      ),
    );
  });
});
