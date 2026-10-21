import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ApiRequestError } from '@/api/errors';
import TeamInvitationPage from '../TeamInvitationPage';

const getTeamInvitation = vi.fn();
const acceptTeamInvitation = vi.fn();
const logout = vi.fn();
let authState: { user: unknown; isAuthenticated: boolean; isLoading: boolean };

vi.mock('@/api', () => ({
  getTeamInvitation: (...a: unknown[]) => getTeamInvitation(...a),
  acceptTeamInvitation: (...a: unknown[]) => acceptTeamInvitation(...a),
  // The page shell renders the site footer, which reads the info pages.
  getInfoPages: () => Promise.resolve({ success: true, data: [] }),
}));

vi.mock('@/contexts/AuthContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return { ...actual, useAuth: () => ({ ...authState, logout }) };
});

const TOKEN = 'a'.repeat(64);
const preview = {
  success: true,
  data: {
    eventName: 'Bieg Testowy',
    inviterName: 'Jan Organizator',
    email: 'o***@example.com',
    status: 'invited',
    expiresAt: '2999-01-01 00:00:00',
  },
};

const LoginProbe = () => {
  const location = useLocation();
  return <p>login returnTo={(location.state as { returnTo?: string } | null)?.returnTo}</p>;
};

const renderPage = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[`/team-invitations/${TOKEN}`]}>
        <Routes>
          <Route path="/team-invitations/:token" element={<TeamInvitationPage />} />
          <Route path="/logowanie" element={<LoginProbe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('TeamInvitationPage', () => {
  beforeEach(() => {
    getTeamInvitation.mockReset();
    acceptTeamInvitation.mockReset();
    logout.mockReset();
    logout.mockResolvedValue(undefined);
    authState = {
      user: { id: 'u1', role: 'participant', email: 'ola@example.com' },
      isAuthenticated: true,
      isLoading: false,
    };
  });

  it('shows the preview and accepts for a signed-in Account', async () => {
    getTeamInvitation.mockResolvedValue(preview);
    acceptTeamInvitation.mockResolvedValue({
      success: true,
      data: { eventId: 'e1', eventName: 'Bieg Testowy', teamRole: 'co_manager', status: 'active' },
    });
    renderPage();

    expect(await screen.findByText(/Jan Organizator zaprasza/)).toBeInTheDocument();
    expect(screen.getByText('o***@example.com')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Akceptuj' }));

    expect(acceptTeamInvitation).toHaveBeenCalledWith(TOKEN);
    expect(await screen.findByText('Jesteś w zespole wydarzenia')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Przejdź do zarządzania/ })).toHaveAttribute(
      'href',
      '/organizer/events/e1/overview',
    );
  });

  it('sends a signed-out visitor to the login and back to the invitation', async () => {
    authState = { user: null, isAuthenticated: false, isLoading: false };
    getTeamInvitation.mockResolvedValue(preview);
    renderPage();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Zaloguj się, aby zaakceptować' }),
    );

    expect(
      await screen.findByText(`login returnTo=/team-invitations/${TOKEN}`),
    ).toBeInTheDocument();
    expect(acceptTeamInvitation).not.toHaveBeenCalled();
  });

  it('explains a wrong-account 403 and offers to switch accounts', async () => {
    getTeamInvitation.mockResolvedValue(preview);
    acceptTeamInvitation.mockRejectedValue(
      new ApiRequestError('x', 'invitation_email_mismatch', 403),
    );
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Akceptuj' }));

    expect(
      await screen.findByText(
        'To zaproszenie wysłano na inny adres e-mail. Zaloguj się na właściwe konto.',
      ),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Wyloguj się i zaloguj na właściwe konto' }),
    );
    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText(`login returnTo=/team-invitations/${TOKEN}`),
    ).toBeInTheDocument();
  });

  it('explains an expired invitation (410 on accept)', async () => {
    getTeamInvitation.mockResolvedValue(preview);
    acceptTeamInvitation.mockRejectedValue(new ApiRequestError('x', 'invitation_expired', 410));
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Akceptuj' }));

    expect(
      await screen.findByText('To zaproszenie wygasło. Poproś organizatora o nowe.'),
    ).toBeInTheDocument();
  });

  it('shows the expired message when the preview itself is 410', async () => {
    getTeamInvitation.mockRejectedValue(new ApiRequestError('x', 'invitation_expired', 410));
    renderPage();

    expect(await screen.findByText('Nie można użyć zaproszenia')).toBeInTheDocument();
    expect(
      screen.getByText('To zaproszenie wygasło. Poproś organizatora o nowe.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Akceptuj' })).not.toBeInTheDocument();
  });

  it('shows the not-found message for an unknown or revoked invitation', async () => {
    getTeamInvitation.mockRejectedValue(new ApiRequestError('x', 'invitation_not_found', 404));
    renderPage();

    expect(
      await screen.findByText('To zaproszenie nie istnieje albo zostało odwołane.'),
    ).toBeInTheDocument();
  });
});
