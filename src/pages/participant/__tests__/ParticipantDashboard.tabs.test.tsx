import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ParticipantDashboard from '../ParticipantDashboard';

vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: 'Jan Testowy', email: 'jan@example.test', role: 'participant' },
    updateCurrentUser: vi.fn(),
  }),
}));

vi.mock('@/api', () => {
  const empty = () => Promise.resolve({ data: [] });
  return {
    getRegistrationsByUser: empty,
    getResultsByUser: empty,
    getPersonalRecords: empty,
    getMessages: empty,
    getTickets: empty,
    getCertificates: empty,
    getOrders: empty,
    getEvents: empty,
    uploadAvatar: vi.fn(),
    changePassword: vi.fn(),
  };
});

const renderAt = (url: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/participant" element={<ParticipantDashboard />} />
          <Route path="/participant/*" element={<ParticipantDashboard />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('ParticipantDashboard tabs', () => {
  it('renders the profile panel when the Profil tab is clicked', async () => {
    renderAt('/participant');
    await userEvent.click(screen.getByRole('tab', { name: /Profil/ }));

    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByText('Dane podstawowe')).toBeInTheDocument();
    expect(within(panel).getByRole('heading', { name: 'Zmiana hasła' })).toBeInTheDocument();
  });

  it('opens the profile tab from /participant/profile', () => {
    renderAt('/participant/profile');
    expect(screen.getByRole('tab', { name: /Profil/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Dane podstawowe')).toBeVisible();
  });

  it('opens the profile tab from /participant?tab=profile', () => {
    renderAt('/participant?tab=profile');
    expect(screen.getByRole('tab', { name: /Profil/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Dane podstawowe')).toBeVisible();
  });

  it.each(['/participant?tab=bogus', '/participant/bogus'])(
    'falls back to overview for an unknown tab (%s)',
    (url) => {
      renderAt(url);
      expect(screen.getByRole('tab', { name: /Przegląd/ })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    },
  );

  it('every tab trigger has a panel', () => {
    renderAt('/participant');
    for (const tab of screen.getAllByRole('tab')) {
      const panelId = tab.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();
      expect(document.getElementById(panelId!)).not.toBeNull();
    }
  });
});
