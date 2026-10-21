import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@/test/test-utils';
import EventRegistrationPage from '../EventRegistrationPage';

/**
 * * a captain's shareable invitation link is `?joinTeam={teamId}&invite={token}` on the same
 * registration route (the team id is public, the `invite` token is the secret the server
 * requires to join; a link without it is outdated). `EventRegistrationPage` resolves it via
 * `GET /teams/{teamId}` (`getTeamById`) before the invitee ever sees the
 * form — these tests cover the three outcomes: valid link pre-fills the
 * form, a full team shows a clear message, an invalid/mismatched team shows
 * a clear message. Neither error case may crash or silently fall back to
 * the generic picker.
 */

const mockGetTeamById = vi.fn();
const mockCreateRegistration = vi.fn();

const { relayEvent } = vi.hoisted(() => {
  const future = (daysFromNow: number) =>
    new Date(Date.now() + daysFromNow * 86400000).toISOString();
  return {
    relayEvent: {
      id: 'e1',
      name: 'Test Event',
      slug: 'test-event',
      discipline: 'running',
      date: future(90),
      location: 'Park',
      city: 'Warszawa',
      description: 'Test',
      imageUrl: '/test.jpg',
      organizerId: 'o1',
      organizerName: 'Organizer',
      publicationStatus: 'published',
      registrationDeadline: future(60),
      featured: false,
      distances: [
        {
          id: 'd1',
          name: 'Sztafeta 4x400m',
          length: 1.6,
          unit: 'km',
          categories: ['Open'],
          registeredCount: 0,
          price: 80,
          startType: 'relay',
          relayMinTeamSize: 2,
          relayMaxTeamSize: 4,
        },
      ],
    },
  };
});

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getEventBySlug: vi.fn().mockResolvedValue({ data: relayEvent }),
    getCare: vi.fn().mockResolvedValue({ data: { myCompetitors: [] } }),
    getTeamById: (...args: unknown[]) => mockGetTeamById(...args),
    createRegistration: (...args: unknown[]) => mockCreateRegistration(...args),
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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ slug: 'test-event' }),
  };
});

let capturedInitialTeamJoin: unknown;
let capturedOnComplete: ((data: Record<string, unknown>) => Promise<void>) | undefined;
vi.mock('@/components/registration/RegistrationForm', () => ({
  RegistrationForm: (props: {
    initialTeamJoin?: unknown;
    onComplete: (data: Record<string, unknown>) => Promise<void>;
  }) => {
    capturedInitialTeamJoin = props.initialTeamJoin;
    capturedOnComplete = props.onComplete;
    return <div>form-rendered</div>;
  },
}));

const setUrl = (search: string) => {
  window.history.pushState({}, '', `/events/test-event/register${search}`);
};

describe('EventRegistrationPage — `?joinTeam=&invite=` invitation link', () => {
  beforeEach(() => {
    mockGetTeamById.mockReset();
    mockCreateRegistration.mockReset();
    capturedInitialTeamJoin = undefined;
    capturedOnComplete = undefined;
    setUrl('');
  });

  it('renders the registration form normally when no joinTeam param is present', async () => {
    render(<EventRegistrationPage />);
    expect(await screen.findByText('form-rendered')).toBeInTheDocument();
    expect(capturedInitialTeamJoin).toBeNull();
  });

  it('pre-selects the team when the link resolves to a real, joinable team for this event', async () => {
    mockGetTeamById.mockResolvedValue({
      data: {
        id: 'team-1',
        eventId: 'e1',
        distanceId: 'd1',
        name: 'Błyskawice',
        memberCount: 2,
        minSize: 2,
        maxSize: 4,
        complete: false,
      },
    });
    setUrl('?joinTeam=team-1&invite=tok-1');

    render(<EventRegistrationPage />);

    expect(await screen.findByText('form-rendered')).toBeInTheDocument();
    await waitFor(() => {
      expect(capturedInitialTeamJoin).toEqual({
        teamId: 'team-1',
        distanceId: 'd1',
        inviteToken: 'tok-1',
      });
    });
  });

  it('shows a clear message, not the form, when the linked team is already full', async () => {
    mockGetTeamById.mockResolvedValue({
      data: {
        id: 'team-full',
        eventId: 'e1',
        distanceId: 'd1',
        name: 'Pełna',
        memberCount: 4,
        minSize: 2,
        maxSize: 4,
        complete: true,
      },
    });
    setUrl('?joinTeam=team-full&invite=tok-1');

    render(<EventRegistrationPage />);

    expect(await screen.findByText('Drużyna jest już pełna')).toBeInTheDocument();
    expect(screen.queryByText('form-rendered')).not.toBeInTheDocument();
  });

  it('shows a clear message, not the form, when the linked team id does not exist', async () => {
    mockGetTeamById.mockRejectedValue(new Error('team_not_found'));
    setUrl('?joinTeam=does-not-exist&invite=tok-1');

    render(<EventRegistrationPage />);

    expect(await screen.findByText('Nieprawidłowy link zaproszenia')).toBeInTheDocument();
    expect(screen.queryByText('form-rendered')).not.toBeInTheDocument();
  });

  it('shows a clear message, not the form, when the linked team belongs to a different event', async () => {
    mockGetTeamById.mockResolvedValue({
      data: {
        id: 'team-other-event',
        eventId: 'e-other',
        distanceId: 'd9',
        name: 'Inna drużyna',
        memberCount: 1,
        minSize: 2,
        maxSize: 4,
        complete: false,
      },
    });
    setUrl('?joinTeam=team-other-event&invite=tok-1');

    render(<EventRegistrationPage />);

    expect(await screen.findByText('Nieprawidłowy link zaproszenia')).toBeInTheDocument();
    expect(screen.getByText('Ten link zaproszenia dotyczy innego wydarzenia.')).toBeInTheDocument();
    expect(screen.queryByText('form-rendered')).not.toBeInTheDocument();
  });

  const joinableTeam = {
    data: {
      id: 'team-1',
      eventId: 'e1',
      distanceId: 'd1',
      name: 'Błyskawice',
      memberCount: 2,
      minSize: 2,
      maxSize: 4,
      complete: false,
    },
  };

  it('shows the outdated-link message, not the form, when the invite token is missing', async () => {
    mockGetTeamById.mockResolvedValue(joinableTeam);
    setUrl('?joinTeam=team-1');

    render(<EventRegistrationPage />);

    expect(await screen.findByText('Nieprawidłowy link zaproszenia')).toBeInTheDocument();
    expect(screen.getByText(/Ten link zaproszenia jest nieaktualny/)).toBeInTheDocument();
    expect(screen.queryByText('form-rendered')).not.toBeInTheDocument();
    expect(capturedInitialTeamJoin).toBeUndefined();
  });

  it('submits the invite token together with the team id when joining', async () => {
    mockGetTeamById.mockResolvedValue(joinableTeam);
    mockCreateRegistration.mockResolvedValue({
      data: { id: 'r1', teamId: 'team-1', status: 'confirmed' },
    });
    setUrl('?joinTeam=team-1&invite=tok-1');

    render(<EventRegistrationPage />);
    expect(await screen.findByText('form-rendered')).toBeInTheDocument();
    await waitFor(() => expect(capturedOnComplete).toBeDefined());

    await act(async () => {
      await capturedOnComplete!({
        distanceId: 'd1',
        distanceName: 'Sztafeta 4x400m',
        category: 'Open',
        teamId: 'team-1',
        teamInviteToken: 'tok-1',
        merchandise: [],
        merchandiseOrders: [],
        modifiersTotal: 0,
        totalAmount: 80,
      });
    });

    expect(mockCreateRegistration).toHaveBeenCalledWith(
      expect.objectContaining({ teamId: 'team-1', teamInviteToken: 'tok-1' }),
    );
  });
});
