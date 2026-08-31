import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import EventRegistrationPage from '../EventRegistrationPage';
import type { RegistrationData } from '@/components/registration/RegistrationForm';

// E1.2: the client must never send computed money amounts to the server as
// authoritative — this test exercises the real `handleComplete` in
// EventRegistrationPage and asserts the payload forwarded to
// `createRegistration` carries only IDs/selections.

const mockCreateRegistration = vi.fn().mockResolvedValue({ data: { id: 'r1' } });
const mockNavigate = vi.fn();

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
  RegistrationForm: ({ onComplete }: { onComplete: (data: RegistrationData) => void }) => (
    <button onClick={() => onComplete(fixedSubmitData)}>submit-fixture</button>
  ),
}));

describe('EventRegistrationPage handleComplete — E1.2 money-free payload', () => {
  beforeEach(() => {
    mockCreateRegistration.mockClear();
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
    expect(payload.paymentDetails?.startFeeAmount).toBeUndefined();
    expect(payload.paymentDetails?.insuranceAmount).toBeUndefined();
    expect(payload.paymentDetails?.merchandisePayments).toBeUndefined();
  });
});
