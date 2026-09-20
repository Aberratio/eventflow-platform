import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import RegistrationSuccessPage from '../RegistrationSuccessPage';
import type { Registration } from '@/types';
import type { RegistrationData } from '@/components/registration/RegistrationForm';

/**
 * E7.2 (issue 23 Answer §1, "link do zaproszenia dla pozostałych miejsc"):
 * once a captain's Zapis creates a brand-new relay Drużyna
 * (`registrationData.createTeam`), the success page is the natural
 * "what happens next" moment to hand them the shareable invitation link for
 * the still-missing teammates (`registration.teamId` doubles as the token).
 */

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
  it('shows a copyable invitation link when this Zapis just created a new Drużyna', async () => {
    mockLocationState = {
      ...baseState,
      registration: { ...baseRegistration, teamId: 'team-1', teamName: 'Błyskawice' },
      registrationData: { ...baseRegistrationData, createTeam: true },
    };

    render(<RegistrationSuccessPage />);

    expect(await screen.findByText('Zaproś resztę drużyny')).toBeInTheDocument();
    const input = screen.getByLabelText('Link zaproszenia do drużyny') as HTMLInputElement;
    expect(input.value).toBe(
      `${window.location.origin}/events/test-event/register?joinTeam=team-1`,
    );
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
  });

  it('does not show the invitation link for a non-team registration', async () => {
    mockLocationState = baseState;

    render(<RegistrationSuccessPage />);

    expect(await screen.findByText('Rejestracja zakończona!')).toBeInTheDocument();
    expect(screen.queryByText('Zaproś resztę drużyny')).not.toBeInTheDocument();
  });
});
