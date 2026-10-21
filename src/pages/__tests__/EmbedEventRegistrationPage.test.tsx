import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import EmbedEventRegistrationPage from '../EmbedEventRegistrationPage';
import { ApiRequestError } from '@/api/errors';

const { testEvent } = vi.hoisted(() => {
  const future = (daysFromNow: number) =>
    new Date(Date.now() + daysFromNow * 86400000).toISOString();
  return {
    testEvent: {
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
          name: '10 km',
          length: 10,
          unit: 'km',
          categories: ['Open'],
          registeredCount: 0,
          price: 80,
        },
      ],
    },
  };
});

const mockGetEventEmbedPublicConfig = vi.fn();
const mockGetEventById = vi.fn().mockResolvedValue({ data: testEvent });
const mockCreateRegistration = vi.fn();
const mockQuoteRegistration = vi.fn();
const mockNavigateToPaymentGateway = vi.fn();

vi.mock('@/lib/paymentGatewayNavigation', () => ({
  navigateToPaymentGateway: (...args: unknown[]) => mockNavigateToPaymentGateway(...args),
}));

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getEventEmbedPublicConfig: (...args: unknown[]) => mockGetEventEmbedPublicConfig(...args),
    getEventById: (...args: unknown[]) => mockGetEventById(...args),
    createRegistration: (...args: unknown[]) => mockCreateRegistration(...args),
    quoteRegistration: (...args: unknown[]) => mockQuoteRegistration(...args),
  };
});

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(() => ({
    user: { id: 'u1', name: 'Jan Kowalski', email: 'jan@example.com', role: 'participant' },
    isAuthenticated: true,
  })),
}));

vi.mock('@/contexts/AuthContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: mockUseAuth,
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'e1' }),
  };
});

vi.mock('@/components/registration/RegistrationForm', () => ({
  RegistrationForm: ({
    onComplete,
    quote,
  }: {
    onComplete?: (data: Record<string, unknown>) => void;
    quote?: (data: Record<string, unknown>) => Promise<unknown>;
  }) => (
    <div>
      registration-form-fixture
      <button
        onClick={() => void quote?.({ distanceId: 'd1', distanceName: '10 km', category: 'Open' })}
      >
        quote-fixture
      </button>
      <button
        onClick={() => onComplete?.({ distanceId: 'd1', distanceName: '10 km', category: 'Open' })}
      >
        submit-fixture
      </button>
    </div>
  ),
}));

describe('EmbedEventRegistrationPage', () => {
  const originalReferrer = document.referrer;

  beforeEach(() => {
    mockGetEventEmbedPublicConfig.mockReset();
    mockGetEventById.mockClear();
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', name: 'Jan Kowalski', email: 'jan@example.com', role: 'participant' },
      isAuthenticated: true,
    });
    mockCreateRegistration.mockReset();
    mockQuoteRegistration.mockReset();
    mockNavigateToPaymentGateway.mockReset();
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(document, 'referrer', { value: originalReferrer, configurable: true });
  });

  it('shows a disabled message when embedding is not enabled for the event', async () => {
    mockGetEventEmbedPublicConfig.mockResolvedValue({
      data: { enabled: false, allowedOrigins: [] },
    });

    render(<EmbedEventRegistrationPage />);

    expect(
      await screen.findByText('Ten formularz nie jest udostępniony do osadzenia.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('registration-form-fixture')).not.toBeInTheDocument();
  });

  it('renders the form when enabled and the allowlist is empty (no restriction configured)', async () => {
    mockGetEventEmbedPublicConfig.mockResolvedValue({
      data: { enabled: true, allowedOrigins: [] },
    });

    render(<EmbedEventRegistrationPage />);

    expect(await screen.findByText('registration-form-fixture')).toBeInTheDocument();
  });

  it('renders the form when enabled and document.referrer matches an allowed origin', async () => {
    mockGetEventEmbedPublicConfig.mockResolvedValue({
      data: { enabled: true, allowedOrigins: ['https://example.com'] },
    });
    Object.defineProperty(document, 'referrer', {
      value: 'https://example.com/some/page',
      configurable: true,
    });

    render(<EmbedEventRegistrationPage />);

    expect(await screen.findByText('registration-form-fixture')).toBeInTheDocument();
  });

  it('blocks with a message when the allowlist is non-empty and the referrer does not match', async () => {
    mockGetEventEmbedPublicConfig.mockResolvedValue({
      data: { enabled: true, allowedOrigins: ['https://example.com'] },
    });
    Object.defineProperty(document, 'referrer', {
      value: 'https://not-allowed.example.org',
      configurable: true,
    });

    render(<EmbedEventRegistrationPage />);

    expect(
      await screen.findByText('Ta strona nie jest uprawniona do osadzenia tego formularza.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('registration-form-fixture')).not.toBeInTheDocument();
  });

  it('blocks with a message when the allowlist is non-empty and the referrer is missing', async () => {
    mockGetEventEmbedPublicConfig.mockResolvedValue({
      data: { enabled: true, allowedOrigins: ['https://example.com'] },
    });
    // document.referrer already '' from beforeEach — simulates a browser
    // that omits it entirely.

    render(<EmbedEventRegistrationPage />);

    expect(
      await screen.findByText('Ta strona nie jest uprawniona do osadzenia tego formularza.'),
    ).toBeInTheDocument();
  });

  it('login link breaks out of the iframe (target=_top) because /login is not frameable', async () => {
    mockGetEventEmbedPublicConfig.mockResolvedValue({
      data: { enabled: true, allowedOrigins: [] },
    });
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false });

    render(<EmbedEventRegistrationPage />);

    const loginLink = await screen.findByRole('link', { name: 'Zaloguj się' });
    expect(loginLink).toHaveAttribute('href', '/login');
    expect(loginLink).toHaveAttribute('target', '_top');
  });

  it('prices through the server quote endpoint instead of a local preview', async () => {
    mockGetEventEmbedPublicConfig.mockResolvedValue({
      data: { enabled: true, allowedOrigins: [] },
    });
    mockQuoteRegistration.mockResolvedValue({ data: { totalAmount: 50, settlementItems: [] } });
    const user = userEvent.setup();

    render(<EmbedEventRegistrationPage />);
    await user.click(await screen.findByText('quote-fixture'));

    await vi.waitFor(() => expect(mockQuoteRegistration).toHaveBeenCalledTimes(1));
    const payload = mockQuoteRegistration.mock.calls[0][0];
    expect(payload.eventId).toBe(testEvent.id);
    expect(payload.distanceId).toBe('d1');
    expect(payload.paymentDetails).toBeUndefined();
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it('does not claim any payment when creating the registration', async () => {
    mockGetEventEmbedPublicConfig.mockResolvedValue({
      data: { enabled: true, allowedOrigins: [] },
    });
    mockCreateRegistration.mockResolvedValue({ data: { id: 'r1', status: 'pending' } });
    const user = userEvent.setup();

    render(<EmbedEventRegistrationPage />);
    await user.click(await screen.findByText('submit-fixture'));

    await vi.waitFor(() => expect(mockCreateRegistration).toHaveBeenCalledTimes(1));
    const payload = mockCreateRegistration.mock.calls[0][0];
    expect(payload.paymentDetails).toBeUndefined();
    expect(payload.distanceId).toBe('d1');
  });

  it('redirects to the payment gateway when the server opened a session', async () => {
    mockGetEventEmbedPublicConfig.mockResolvedValue({
      data: { enabled: true, allowedOrigins: [] },
    });
    mockCreateRegistration.mockResolvedValue({
      data: {
        id: 'r1',
        status: 'pending',
        paymentSession: { transactionId: 't', redirectUrl: 'https://gw.example/pay' },
      },
    });
    const user = userEvent.setup();

    render(<EmbedEventRegistrationPage />);
    await user.click(await screen.findByText('submit-fixture'));

    await vi.waitFor(() =>
      expect(mockNavigateToPaymentGateway).toHaveBeenCalledWith('https://gw.example/pay'),
    );
  });

  it('confirmation does not claim an e-mail was sent', async () => {
    mockGetEventEmbedPublicConfig.mockResolvedValue({
      data: { enabled: true, allowedOrigins: [] },
    });
    mockCreateRegistration.mockResolvedValue({
      data: { id: 'r1', status: 'confirmed', distanceName: '10 km' },
    });
    const user = userEvent.setup();

    render(<EmbedEventRegistrationPage />);
    await user.click(await screen.findByText('submit-fixture'));

    expect(await screen.findByText('Zapisano się!')).toBeInTheDocument();
    expect(
      screen.getByText(/Szczegóły zapisu znajdziesz po zalogowaniu w panelu uczestnika\./),
    ).toBeInTheDocument();
    expect(screen.queryByText(/wysłaliśmy/i)).not.toBeInTheDocument();
  });

  it('shows the server message in a closed state on 409 registration_closed', async () => {
    mockGetEventEmbedPublicConfig.mockResolvedValue({
      data: { enabled: true, allowedOrigins: [] },
    });
    mockCreateRegistration.mockRejectedValue(
      new ApiRequestError('Termin zapisów minął.', 'registration_closed', 409),
    );
    const user = userEvent.setup();

    render(<EmbedEventRegistrationPage />);
    await user.click(await screen.findByText('submit-fixture'));

    expect(await screen.findByText('Zapisy są zamknięte')).toBeInTheDocument();
    expect(screen.getByText('Termin zapisów minął.')).toBeInTheDocument();
    expect(screen.queryByText('registration-form-fixture')).not.toBeInTheDocument();
  });

  it('shows the test-mode message with the Rozliczenie and no gateway on a dry run', async () => {
    mockGetEventEmbedPublicConfig.mockResolvedValue({
      data: { enabled: true, allowedOrigins: [] },
    });
    mockCreateRegistration.mockResolvedValue({
      data: {
        id: 'ghost',
        isTest: true,
        status: 'pending',
        totalAmount: 80,
        settlementItems: [{ id: 's1', name: 'Opłata startowa', amount: 80, sortOrder: 1 }],
        paymentSession: { transactionId: 't', redirectUrl: 'https://gw.example/pay' },
      },
    });
    const user = userEvent.setup();

    render(<EmbedEventRegistrationPage />);
    await user.click(await screen.findByText('submit-fixture'));

    expect(await screen.findByText('Zapis testowy')).toBeInTheDocument();
    expect(screen.getByText(/nic nie zostało zapisane ani opłacone/)).toBeInTheDocument();
    expect(screen.getByText('Opłata startowa')).toBeInTheDocument();
    expect(mockNavigateToPaymentGateway).not.toHaveBeenCalled();
    expect(screen.queryByText('Zapisano się!')).not.toBeInTheDocument();
  });
});
