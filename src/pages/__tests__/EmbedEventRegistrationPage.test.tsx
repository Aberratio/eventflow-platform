import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import EmbedEventRegistrationPage from '../EmbedEventRegistrationPage';

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

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getEventEmbedPublicConfig: (...args: unknown[]) => mockGetEventEmbedPublicConfig(...args),
    getEventById: (...args: unknown[]) => mockGetEventById(...args),
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
  RegistrationForm: () => <div>registration-form-fixture</div>,
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
});
