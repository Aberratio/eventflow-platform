import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiRequestError } from '@/api/errors';
import { EventTeamTab } from '../EventTeamTab';

const getEventTeam = vi.fn();
const inviteEventTeamMember = vi.fn();
const resendEventTeamInvitation = vi.fn();
const revokeEventTeamMember = vi.fn();

vi.mock('@/api', () => ({
  getEventTeam: (...a: unknown[]) => getEventTeam(...a),
  inviteEventTeamMember: (...a: unknown[]) => inviteEventTeamMember(...a),
  resendEventTeamInvitation: (...a: unknown[]) => resendEventTeamInvitation(...a),
  revokeEventTeamMember: (...a: unknown[]) => revokeEventTeamMember(...a),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

const member = (patch: Record<string, unknown>) => ({
  id: 'm1',
  eventId: 'e1',
  userId: null,
  role: 'co_manager',
  status: 'invited',
  email: 'ola@example.com',
  name: null,
  inviteExpiresAt: '2999-01-01 00:00:00',
  invitedBy: 'o1',
  createdAt: '2026-10-01 10:00:00',
  acceptedAt: null,
  revokedAt: null,
  ...patch,
});

const roster = (members: unknown[]) => ({
  success: true,
  data: { owner: { id: 'o1', name: 'Jan Właściciel', email: 'jan@example.com' }, members },
});

const renderTab = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <EventTeamTab eventId="e1" />
    </QueryClientProvider>,
  );

describe('EventTeamTab', () => {
  beforeEach(() => {
    getEventTeam.mockReset();
    inviteEventTeamMember.mockReset();
    resendEventTeamInvitation.mockReset();
    revokeEventTeamMember.mockReset();
  });

  it('lists the Owner and the Co-managers with their status, hiding revoked ones', async () => {
    getEventTeam.mockResolvedValue(
      roster([
        member({ id: 'a', email: 'pending@example.com' }),
        member({ id: 'b', email: 'active@example.com', name: 'Ewa Aktywna', status: 'active' }),
        member({ id: 'c', email: 'gone@example.com', status: 'revoked' }),
      ]),
    );
    renderTab();

    const list = await screen.findByRole('list', { name: 'Członkowie zespołu' });
    expect(within(list).getByText('Jan Właściciel')).toBeInTheDocument();
    expect(within(list).getByText('Właściciel')).toBeInTheDocument();
    expect(within(list).getByText('pending@example.com')).toBeInTheDocument();
    expect(within(list).getByText('Zaproszony')).toBeInTheDocument();
    expect(within(list).getByText('Ewa Aktywna')).toBeInTheDocument();
    expect(within(list).getByText('Aktywny')).toBeInTheDocument();
    expect(within(list).queryByText('gone@example.com')).not.toBeInTheDocument();
  });

  it('invites by e-mail and refreshes the roster', async () => {
    getEventTeam.mockResolvedValue(roster([]));
    inviteEventTeamMember.mockResolvedValue({ success: true, data: member({}) });
    renderTab();
    await screen.findByText('Nie ma jeszcze współzarządzających.');

    await userEvent.type(screen.getByLabelText('Adres e-mail'), ' ola@example.com ');
    await userEvent.click(screen.getByRole('button', { name: 'Wyślij zaproszenie' }));

    await waitFor(() =>
      expect(inviteEventTeamMember).toHaveBeenCalledWith('e1', 'ola@example.com'),
    );
    await waitFor(() => expect(getEventTeam).toHaveBeenCalledTimes(2));
  });

  it('shows the error message from the server when the invitation is refused', async () => {
    getEventTeam.mockResolvedValue(roster([]));
    inviteEventTeamMember.mockRejectedValue(
      new ApiRequestError(
        'Ta osoba jest już współzarządzającym tego wydarzenia.',
        'team_member_active',
        409,
      ),
    );
    renderTab();
    await screen.findByText('Nie ma jeszcze współzarządzających.');

    await userEvent.type(screen.getByLabelText('Adres e-mail'), 'ola@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Wyślij zaproszenie' }));

    expect(
      await screen.findByText('Ta osoba jest już współzarządzającym tego wydarzenia.'),
    ).toBeInTheDocument();
  });

  it('resends a pending invitation', async () => {
    getEventTeam.mockResolvedValue(roster([member({})]));
    resendEventTeamInvitation.mockResolvedValue({ success: true, data: member({}) });
    renderTab();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Wyślij ponownie zaproszenie: ola@example.com' }),
    );

    await waitFor(() => expect(resendEventTeamInvitation).toHaveBeenCalledWith('e1', 'm1'));
  });

  it('asks for confirmation before revoking and revokes only after it', async () => {
    getEventTeam.mockResolvedValue(
      roster([member({ id: 'm9', status: 'active', email: 'ewa@example.com' })]),
    );
    revokeEventTeamMember.mockResolvedValue({ success: true, data: member({ status: 'revoked' }) });
    renderTab();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Odbierz dostęp: ewa@example.com' }),
    );
    expect(revokeEventTeamMember).not.toHaveBeenCalled();

    const dialog = await screen.findByRole('alertdialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Odbierz dostęp' }));

    await waitFor(() => expect(revokeEventTeamMember).toHaveBeenCalledWith('e1', 'm9'));
  });

  it('does not revoke when the confirmation is cancelled', async () => {
    getEventTeam.mockResolvedValue(roster([member({ status: 'active' })]));
    renderTab();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Odbierz dostęp: ola@example.com' }),
    );
    const dialog = await screen.findByRole('alertdialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Anuluj' }));

    expect(revokeEventTeamMember).not.toHaveBeenCalled();
  });

  it('shows a load error from the server', async () => {
    getEventTeam.mockRejectedValue(
      new ApiRequestError('Nie masz uprawnień do wykonania tej operacji.', 'forbidden', 403),
    );
    renderTab();

    expect(
      await screen.findByText('Nie masz uprawnień do wykonania tej operacji.'),
    ).toBeInTheDocument();
  });
});
