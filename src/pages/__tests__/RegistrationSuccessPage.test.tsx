import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, resetQueryClient, screen, waitFor } from '@/test/test-utils';
import RegistrationSuccessPage from '../RegistrationSuccessPage';
import type { Registration } from '@/types';
import type { RegistrationData } from '@/components/registration/RegistrationForm';

/**
 * E7.2 (issue 23 Answer §1, "link do zaproszenia dla pozostałych miejsc"):
 * once a captain's Zapis creates a brand-new relay Drużyna
 * (`registrationData.createTeam`), the success page is the natural
 * "what happens next" moment to hand them the shareable invitation link for
 * the still-missing teammates. PP.54: the link carries the captain's secret invite token, which
 * the page fetches from the server (`getTeamInvite`) — the team id alone is public and is no
 * longer an invitation.
 */

const mockGetTeamInvite = vi.fn();

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getTeamInvite: (...args: unknown[]) => mockGetTeamInvite(...args),
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

let mockLocationState: unknown = null;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ slug: 'test-event' }),
    useLocation: () => ({ state: mockLocationState, pathname: '', search: '', hash: '', key: '' }),
  };
});

const baseRegistrationData: RegistrationData = {
  distanceId: 'd1',
  distanceName: 'Sztafeta 4x400m',
  category: 'Open',
  price: 80,
  merchandiseOrders: [],
  merchandise: [],
  modifiersTotal: 0,
  totalAmount: 80,
};

const baseRegistration: Registration = {
  id: 'r1',
  eventId: 'e1',
  eventName: 'Test Event',
  userId: 'u1',
  userName: 'Jan Kowalski',
  userEmail: 'jan@example.com',
  distanceId: 'd1',
  distanceName: 'Sztafeta 4x400m',
  category: 'Open',
  registeredAt: new Date().toISOString(),
  status: 'confirmed',
  totalAmount: 80,
};

const baseState = {
  registration: baseRegistration,
  registrationData: baseRegistrationData,
  eventId: 'e1',
  eventName: 'Test Event',
  eventSlug: 'test-event',
  eventDate: new Date().toISOString(),
  eventCity: 'Warszawa',
};

describe('RegistrationSuccessPage — E7.2 team invitation link', () => {
  beforeEach(() => {
    resetQueryClient();
    mockGetTeamInvite.mockReset();
    mockGetTeamInvite.mockResolvedValue({
      data: { teamId: 'team-1', eventId: 'e1', distanceId: 'd1', inviteToken: 'tok-1' },
    });
  });

  it('shows a copyable invitation link when this Zapis just created a new Drużyna', async () => {
    mockLocationState = {
      ...baseState,
      registration: { ...baseRegistration, teamId: 'team-1', teamName: 'Błyskawice' },
      registrationData: { ...baseRegistrationData, createTeam: true },
    };

    render(<RegistrationSuccessPage />);

    expect(await screen.findByText('Zaproś resztę drużyny')).toBeInTheDocument();
    const input = screen.getByLabelText('Link zaproszenia do drużyny') as HTMLInputElement;
    await waitFor(() =>
      expect(input.value).toBe(
        `${window.location.origin}/events/test-event/register?joinTeam=team-1&invite=tok-1`,
      ),
    );
    expect(mockGetTeamInvite).toHaveBeenCalledWith('team-1');
  });

  it('points to the participant dashboard, without an input, when the token cannot be fetched', async () => {
    mockGetTeamInvite.mockRejectedValue(new Error('team_not_captain'));
    mockLocationState = {
      ...baseState,
      registration: { ...baseRegistration, teamId: 'team-1', teamName: 'Błyskawice' },
      registrationData: { ...baseRegistrationData, createTeam: true },
    };

    render(<RegistrationSuccessPage />);

    expect(
      await screen.findByText(/Link zaproszenia znajdziesz w panelu uczestnika/),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Link zaproszenia do drużyny')).not.toBeInTheDocument();
  });

  it('does not show the invitation link when this Zapis only joined an existing team', async () => {
    mockLocationState = {
      ...baseState,
      registration: { ...baseRegistration, teamId: 'team-1', teamName: 'Błyskawice' },
      registrationData: { ...baseRegistrationData, createTeam: undefined, teamId: 'team-1' },
    };

    render(<RegistrationSuccessPage />);

    expect(await screen.findByText('Rejestracja zakończona!')).toBeInTheDocument();
    expect(screen.queryByText('Zaproś resztę drużyny')).not.toBeInTheDocument();
    expect(mockGetTeamInvite).not.toHaveBeenCalled();
  });

  it('does not show the invitation link for a non-team registration', async () => {
    mockLocationState = baseState;

    render(<RegistrationSuccessPage />);

    expect(await screen.findByText('Rejestracja zakończona!')).toBeInTheDocument();
    expect(screen.queryByText('Zaproś resztę drużyny')).not.toBeInTheDocument();
  });

  it('names the registered participant in the legacy transfer title', async () => {
    mockLocationState = {
      ...baseState,
      registration: { ...baseRegistration, userName: 'Zosia Kowalska', status: 'pending' },
      paymentConfig: {
        type: 'organizer_bank',
        bankAccountNumber: '11 1111 1111 1111 1111 1111 1111',
        bankAccountHolder: 'Organizator',
        transferTitle: '{eventName} - {participantName}',
      },
    };

    render(<RegistrationSuccessPage />);

    expect(await screen.findByText('Test Event - Zosia Kowalska')).toBeInTheDocument();
    expect(screen.queryByText(/Jan Kowalski/)).not.toBeInTheDocument();
  });
});
