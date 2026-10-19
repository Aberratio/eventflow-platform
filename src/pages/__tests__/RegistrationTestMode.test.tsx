import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EventRegistrationPage from '../EventRegistrationPage';
import RegistrationSuccessPage from '../RegistrationSuccessPage';
import type { RegistrationData } from '@/components/registration/RegistrationForm';

// G-08: the manager's preview of a Draft only talks to the server when the Event is in test mode
// (the server then answers with a dry run); the success page words a dry run as a test.

const mockCreateRegistration = vi.fn();
const mockNavigate = vi.fn();
const mockState: { location: unknown; event: Record<string, unknown> } = {
  location: null,
  event: {},
};

const baseEvent = vi.hoisted(() => {
  const future = (d: number) => new Date(Date.now() + d * 86400000).toISOString();
  return {
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
    publicationStatus: 'draft',
    registrationDeadline: future(60),
    featured: false,
    distances: [
      { id: 'd1', name: '10 km', length: 10, unit: 'km', categories: ['Open'], registeredCount: 0, price: 80 },
    ],
  };
});

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getEventBySlug: () => Promise.resolve({ data: mockState.event }),
    getCare: vi.fn().mockResolvedValue({ data: { myCompetitors: [] } }),
    createRegistration: (...args: unknown[]) => mockCreateRegistration(...args),
  };
});

vi.mock('@/contexts/AuthContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 'o1', name: 'Organizer', email: 'o@example.com', role: 'organizer' },
      isAuthenticated: true,
    }),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ slug: 'test-event' }),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: mockState.location }),
  };
});

vi.mock('@/components/registration/RegistrationForm', () => ({
  RegistrationForm: (props: { onComplete: (data: RegistrationData) => void }) => (
    <button
      onClick={() =>
        props.onComplete({
          distanceId: 'd1',
          distanceName: '10 km',
          category: 'Open',
          price: 80,
          totalAmount: 80,
        } as RegistrationData)
      }
    >
      submit-fixture
    </button>
  ),
}));

describe('registration preview of a Draft (G-08)', () => {
  beforeEach(() => {
    mockCreateRegistration.mockReset();
    mockNavigate.mockReset();
  });

  it('does not call the server from the preview of a Draft without test mode, and says so', async () => {
    mockState.event = { ...baseEvent, isTest: false };
    const user = userEvent.setup();
    render(<EventRegistrationPage previewMode />);

    expect(await screen.findByText(/Włącz tryb testowy/)).toBeInTheDocument();
    await user.click(await screen.findByText('submit-fixture'));

    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it('posts the registration from the preview of a Draft in test mode', async () => {
    mockState.event = { ...baseEvent, isTest: true };
    mockCreateRegistration.mockResolvedValue({
      data: { id: 'ghost', isTest: true, status: 'pending', totalAmount: 80 },
    });
    const user = userEvent.setup();
    render(<EventRegistrationPage previewMode />);

    await user.click(await screen.findByText('submit-fixture'));

    await vi.waitFor(() => expect(mockCreateRegistration).toHaveBeenCalledTimes(1));
    await vi.waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        '/events/test-event/register/success',
        expect.anything(),
      ),
    );
  });
});

describe('RegistrationSuccessPage for a dry run (G-08)', () => {
  it('words the dry run as a test, shows the Rozliczenie and no payment hints', async () => {
    mockState.location = {
      registration: {
        id: 'ghost',
        isTest: true,
        status: 'pending',
        distanceName: '10 km',
        category: 'Open',
        totalAmount: 80,
        settlementItems: [{ id: 's1', name: 'Opłata startowa', basis: 'distance_price', amount: 80, sortOrder: 1 }],
      },
      registrationData: { distanceName: '10 km', category: 'Open', totalAmount: 80, price: 80 },
      eventId: 'e1',
      eventName: 'Test Event',
      eventSlug: 'test-event',
      eventDate: new Date().toISOString(),
      eventCity: 'Warszawa',
    };

    render(
      <MemoryRouter>
        <RegistrationSuccessPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(
        'Zapis testowy – sprawdzono konfigurację, nic nie zostało zapisane ani opłacone',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Opłata startowa')).toBeInTheDocument();
    expect(screen.queryByText(/Płatność nie została jeszcze zrealizowana/)).not.toBeInTheDocument();
    expect(screen.queryByText('Rejestracja wstępna zakończona!')).not.toBeInTheDocument();
  });
});
