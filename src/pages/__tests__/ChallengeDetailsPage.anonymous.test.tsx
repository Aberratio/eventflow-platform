import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChallengeDetailsPage from '../ChallengeDetailsPage';

// D-08: an anonymous visitor used to get no call to action at all.

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getChallengeBySlug: vi.fn().mockResolvedValue({
      data: {
        id: 'chal-1',
        name: 'Korona Gór',
        slug: 'korona-gor',
        description: 'Ukończ wszystkie biegi',
        events: [],
        products: [],
        rule: { minCompleted: 1 },
        rewards: [],
        status: 'active',
        createdBy: 'admin-1',
      },
      success: true,
    }),
    getChallengeParticipations: vi.fn().mockResolvedValue({ data: [], success: true }),
    getChallengeRanking: vi.fn().mockResolvedValue({
      data: { hasPoints: true, entries: [] },
      success: true,
    }),
  };
});

vi.mock('@/contexts/AuthContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return { ...actual, useAuth: () => ({ user: null }) };
});

const LoginProbe = () => {
  const location = useLocation();
  return <div>login returnTo={(location.state as { returnTo?: string } | null)?.returnTo}</div>;
};

describe('ChallengeDetailsPage anonymous visitor', () => {
  it('offers a login CTA that returns to the challenge', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/challenges/korona-gor']}>
          <Routes>
            <Route path="/challenges/:slug" element={<ChallengeDetailsPage />} />
            <Route path="/logowanie" element={<LoginProbe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const cta = await screen.findByRole('link', { name: 'Zaloguj się, aby dołączyć' });
    expect(cta).toHaveAttribute('href', '/logowanie');
    await userEvent.setup().click(cta);
    expect(await screen.findByText('login returnTo=/challenges/korona-gor')).toBeInTheDocument();
  });
});
