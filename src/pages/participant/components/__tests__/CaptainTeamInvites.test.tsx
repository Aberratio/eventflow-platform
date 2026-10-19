import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, resetQueryClient, screen, waitFor } from '@/test/test-utils';
import type { Event, Registration } from '@/types';
import CaptainTeamInvites from '../CaptainTeamInvites';

/**
 * PP.54: the dashboard block "Twoje drużyny" — lets a captain (also on a gateway event, where the
 * success page is skipped) copy the invitation link. Shown only for teams the user captains; the
 * secret token is fetched lazily, on click.
 */

const mockGetTeamById = vi.fn();
const mockGetTeamInvite = vi.fn();
const mockGetTeamMembers = vi.fn();
const mockToast = vi.fn();

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getTeamById: (...args: unknown[]) => mockGetTeamById(...args),
    getTeamInvite: (...args: unknown[]) => mockGetTeamInvite(...args),
    getTeamMembers: (...args: unknown[]) => mockGetTeamMembers(...args),
  };
});

vi.mock('@/contexts/AuthContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 'u1', name: 'Jan Kowalski', email: 'jan@example.com', role: 'participant' },
      isAuthenticated: true,
    }),
  };
});

vi.mock('@/hooks/use-toast', () => ({
  toast: (...args: unknown[]) => mockToast(...args),
  useToast: () => ({ toast: (...args: unknown[]) => mockToast(...args) }),
}));

const event = { id: 'e1', name: 'Bieg Testowy', slug: 'bieg-testowy' } as unknown as Event;

const registration = (over: Partial<Registration>): Registration =>
  ({
    id: 'r1',
    eventId: 'e1',
    userId: 'u1',
    distanceId: 'd1',
    status: 'confirmed',
    ...over,
  }) as Registration;

const team = (id: string, name: string, createdByUserId: string) => ({
  data: {
    id,
    eventId: 'e1',
    distanceId: 'd1',
    name,
    memberCount: 2,
    minSize: 2,
    maxSize: 4,
    complete: false,
    createdByUserId,
  },
});

describe('CaptainTeamInvites', () => {
  beforeEach(() => {
    resetQueryClient();
    mockGetTeamById.mockReset();
    mockGetTeamInvite.mockReset();
    mockGetTeamMembers.mockReset();
    mockToast.mockReset();
  });

  it('renders nothing when the user captains no team', async () => {
    mockGetTeamById.mockResolvedValue(team('team-1', 'Cudza', 'someone-else'));

    const { container } = render(
      <CaptainTeamInvites items={[{ registration: registration({ teamId: 'team-1' }), event }]} />,
    );

    await waitFor(() => expect(mockGetTeamById).toHaveBeenCalledWith('team-1'));
    expect(screen.queryByText('Twoje drużyny')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no Zapis belongs to a team', () => {
    render(<CaptainTeamInvites items={[{ registration: registration({}), event }]} />);
    expect(screen.queryByText('Twoje drużyny')).not.toBeInTheDocument();
    expect(mockGetTeamById).not.toHaveBeenCalled();
  });

  it('lists only the team the user captains, not one where they are only a member', async () => {
    mockGetTeamById.mockImplementation((id: string) =>
      Promise.resolve(
        id === 'team-own' ? team(id, 'Moja drużyna', 'u1') : team(id, 'Cudza drużyna', 'x'),
      ),
    );

    render(
      <CaptainTeamInvites
        items={[
          { registration: registration({ id: 'r1', teamId: 'team-own' }), event },
          { registration: registration({ id: 'r2', teamId: 'team-member' }), event },
        ]}
      />,
    );

    expect(await screen.findByText('Twoje drużyny')).toBeInTheDocument();
    expect(screen.getByText('Moja drużyna')).toBeInTheDocument();
    expect(screen.queryByText('Cudza drużyna')).not.toBeInTheDocument();
    expect(mockGetTeamInvite).not.toHaveBeenCalled();
  });

  it('ignores cancelled Zapisy', async () => {
    render(
      <CaptainTeamInvites
        items={[{ registration: registration({ teamId: 'team-own', status: 'cancelled' }), event }]}
      />,
    );

    expect(mockGetTeamById).not.toHaveBeenCalled();
    expect(screen.queryByText('Twoje drużyny')).not.toBeInTheDocument();
  });

  it('copies the built invitation link on click', async () => {
    mockGetTeamById.mockResolvedValue(team('team-own', 'Moja drużyna', 'u1'));
    mockGetTeamInvite.mockResolvedValue({
      data: { teamId: 'team-own', eventId: 'e1', distanceId: 'd1', inviteToken: 'tok-1' },
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(
      <CaptainTeamInvites
        items={[{ registration: registration({ teamId: 'team-own' }), event }]}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Kopiuj link zaproszenia' }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/events/bieg-testowy/register?joinTeam=team-own&invite=tok-1`,
      ),
    );
    expect(mockGetTeamInvite).toHaveBeenCalledWith('team-own');
    expect(mockToast).toHaveBeenCalledWith({ title: 'Skopiowano link zaproszenia' });
  });

  it('shows an error toast when the invitation cannot be fetched', async () => {
    mockGetTeamById.mockResolvedValue(team('team-own', 'Moja drużyna', 'u1'));
    mockGetTeamInvite.mockRejectedValue(new Error('team_not_captain'));

    render(
      <CaptainTeamInvites
        items={[{ registration: registration({ teamId: 'team-own' }), event }]}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Kopiuj link zaproszenia' }));

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Nie udało się pobrać linku zaproszenia',
        variant: 'destructive',
      }),
    );
  });

  it('opens the roster with the swap action for the captain (G-04)', async () => {
    mockGetTeamById.mockResolvedValue(team('team-own', 'Moja drużyna', 'u1'));
    mockGetTeamMembers.mockResolvedValue({
      success: true,
      data: [
        {
          registrationId: 'r1',
          name: 'Jan Kowalski',
          status: 'confirmed',
          bibNumber: null,
          competitorId: 'c1',
        },
      ],
    });

    render(
      <CaptainTeamInvites
        items={[{ registration: registration({ teamId: 'team-own' }), event }]}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Skład i wymiana zawodnika' }));

    expect(await screen.findByText('Skład drużyny Moja drużyna')).toBeInTheDocument();
    expect(mockGetTeamMembers).toHaveBeenCalledWith('team-own');
    expect(await screen.findByRole('button', { name: 'Wymień zawodnika' })).toBeInTheDocument();
  });
});
