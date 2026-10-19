import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import EventRegistrationPage from '../EventRegistrationPage';
import type { RegistrationData } from '@/components/registration/RegistrationForm';
import { getCare } from '@/api';
import { ApiRequestError } from '@/api/errors';

// E1.2: the client must never send computed money amounts to the server as
// authoritative — this test exercises the real `handleComplete` in
// EventRegistrationPage and asserts the payload forwarded to
// `createRegistration` carries only IDs/selections.

const mockCreateRegistration = vi.fn().mockResolvedValue({ data: { id: 'r1' } });
const mockNavigate = vi.fn();
// PP.44: records the props the page hands to the (mocked) RegistrationForm.
const mockFormProps: { current: Record<string, unknown> | null } = { current: null };
const mockNavigateToPaymentGateway = vi.fn();

vi.mock('@/lib/paymentGatewayNavigation', () => ({
  navigateToPaymentGateway: (...args: unknown[]) => mockNavigateToPaymentGateway(...args),
}));

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

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getEventBySlug: vi.fn().mockResolvedValue({ data: testEvent }),
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
    useNavigate: () => mockNavigate,
  };
});

const fixedSubmitData: RegistrationData = {
  distanceId: 'd1',
  distanceName: '10 km',
  category: 'Open',
  birthDate: '1990-01-01',
  price: 30, // PREVIEW-only, must NOT reach the server as-is
  discountCode: 'SZUTRY25',
  discountAmount: 7, // PREVIEW-only
  merchandiseOrders: [
    {
      merchandiseId: 'm1',
      merchandiseName: 'Koszulka',
      size: 'M',
      color: 'Red',
      quantity: 1,
      price: 65, // PREVIEW-only
    },
  ],
  merchandise: [{ merchandiseId: 'm1', size: 'M', color: 'Red', quantity: 1 }],
  insurancePrice: 19.6, // PREVIEW-only
  modifiersTotal: 0,
  totalAmount: 122.6, // PREVIEW-only
  teamName: undefined,
  pricingVariantId: 'variant-standard',
  insuranceVariantId: 'insurance-basic',
};

vi.mock('@/components/registration/RegistrationForm', () => ({
  RegistrationForm: (props: { onComplete: (data: RegistrationData) => void }) => {
    mockFormProps.current = props as unknown as Record<string, unknown>;
    return <button onClick={() => props.onComplete(fixedSubmitData)}>submit-fixture</button>;
  },
}));

describe('EventRegistrationPage handleComplete — E1.2 money-free payload', () => {
  beforeEach(() => {
    mockCreateRegistration.mockClear();
    mockNavigate.mockClear();
    mockNavigateToPaymentGateway.mockClear();
  });

  it('forwards only IDs/selections to createRegistration, never computed money', async () => {
    const user = userEvent.setup();
    render(<EventRegistrationPage />);

    const button = await screen.findByText('submit-fixture');
    await user.click(button);

    expect(mockCreateRegistration).toHaveBeenCalledTimes(1);
    const payload = mockCreateRegistration.mock.calls[0][0];

    // Contract-shaped selection fields must be present.
    expect(payload.pricingVariantId).toBe('variant-standard');
    expect(payload.discountCode).toBe('SZUTRY25');
    expect(payload.insuranceVariantId).toBe('insurance-basic');
    expect(payload.merchandise).toEqual([
      { merchandiseId: 'm1', size: 'M', color: 'Red', quantity: 1 },
    ]);

    // No computed money field may be forwarded.
    expect(payload.price).toBeUndefined();
    expect(payload.discountAmount).toBeUndefined();
    expect(payload.pricePaid).toBeUndefined();
    expect(payload.totalAmount).toBeUndefined();
    expect(payload.insurancePrice).toBeUndefined();
    expect(payload.merchandiseOrders).toBeUndefined();
    // PP.52: the client never claims a payment either — the server owns the status.
    expect(payload.paymentDetails).toBeUndefined();
  });

  it('redirects to the payment gateway when the server opened a session', async () => {
    mockCreateRegistration.mockResolvedValueOnce({
      data: {
        id: 'r1',
        status: 'pending',
        paymentSession: { transactionId: 't', redirectUrl: 'https://gw.example/pay' },
      },
    });
    const user = userEvent.setup();
    render(<EventRegistrationPage />);

    await user.click(await screen.findByText('submit-fixture'));

    await vi.waitFor(() =>
      expect(mockNavigateToPaymentGateway).toHaveBeenCalledWith('https://gw.example/pay'),
    );
    expect(mockNavigate).not.toHaveBeenCalledWith(
      expect.stringContaining('/register/success'),
      expect.anything(),
    );
  });

  it('goes to the success page when no gateway session is returned', async () => {
    mockCreateRegistration.mockResolvedValueOnce({ data: { id: 'r1', status: 'pending' } });
    const user = userEvent.setup();
    render(<EventRegistrationPage />);

    await user.click(await screen.findByText('submit-fixture'));

    await vi.waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        '/events/test-event/register/success',
        expect.anything(),
      ),
    );
    expect(mockNavigateToPaymentGateway).not.toHaveBeenCalled();
  });

  it('passes the selected ward to the form and registers the ward', async () => {
    vi.mocked(getCare).mockResolvedValueOnce({
      data: {
        myCompetitors: [
          {
            id: 'rel-1',
            competitorId: 'c-zosia',
            firstName: 'Zosia',
            lastName: 'Kowalska',
            birthDate: '2016-05-10',
            identityCode: 'zqr_x',
            createdAt: '2026-01-01',
          },
        ],
      },
    } as Awaited<ReturnType<typeof getCare>>);
    const user = userEvent.setup();
    render(<EventRegistrationPage />);

    await user.click(await screen.findByLabelText('Zapisuję kogoś innego'));

    await vi.waitFor(() =>
      expect(mockFormProps.current?.participant).toEqual({
        key: 'c-zosia',
        name: 'Zosia Kowalska',
        birthDate: '2016-05-10',
        gender: undefined,
      }),
    );

    await user.click(await screen.findByText('submit-fixture'));
    expect(mockCreateRegistration).toHaveBeenCalledTimes(1);
    expect(mockCreateRegistration.mock.calls[0][0].competitorId).toBe('c-zosia');
  });

  it('shows the server message in a closed state on 409 registration_closed, not a generic error', async () => {
    mockCreateRegistration.mockRejectedValueOnce(
      new ApiRequestError(
        'Zapisy zostały zamknięte przez organizatora.',
        'registration_closed',
        409,
      ),
    );
    const user = userEvent.setup();
    render(<EventRegistrationPage />);

    await user.click(await screen.findByText('submit-fixture'));

    expect(await screen.findByText('Zapisy są zamknięte')).toBeInTheDocument();
    expect(screen.getByText('Zapisy zostały zamknięte przez organizatora.')).toBeInTheDocument();
    expect(screen.queryByText('submit-fixture')).not.toBeInTheDocument();
  });

  it('sends a test-mode dry run to the success page without the gateway', async () => {
    mockCreateRegistration.mockResolvedValueOnce({
      data: {
        id: 'ghost',
        isTest: true,
        status: 'pending',
        totalAmount: 80,
        paymentSession: { transactionId: 't', redirectUrl: 'https://gw.example/pay' },
      },
    });
    const user = userEvent.setup();
    render(<EventRegistrationPage />);

    await user.click(await screen.findByText('submit-fixture'));

    await vi.waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        '/events/test-event/register/success',
        expect.objectContaining({
          state: expect.objectContaining({
            registration: expect.objectContaining({ isTest: true }),
          }),
        }),
      ),
    );
    expect(mockNavigateToPaymentGateway).not.toHaveBeenCalled();
  });
});
