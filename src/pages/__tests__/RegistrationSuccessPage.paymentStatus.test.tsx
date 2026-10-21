import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import RegistrationSuccessPage from '../RegistrationSuccessPage';
import type { Registration } from '@/types';
import type { RegistrationData } from '@/components/registration/RegistrationForm';

/**
 * The success page derives "paid / not paid" from the server's Zapis
 * status, never from the payment route — a pending gateway Zapis must not say
 * "Płatność zrealizowana automatycznie".
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

const registrationData: RegistrationData = {
  distanceId: 'd1',
  distanceName: '10 km',
  category: 'Open',
  price: 80,
  merchandiseOrders: [],
  merchandise: [],
  modifiersTotal: 0,
  totalAmount: 80,
};

const makeState = (
  status: Registration['status'],
  paymentType: 'admin_gateway' | 'organizer_bank',
  totalAmount: number,
) => ({
  registration: {
    id: 'r1',
    eventId: 'e1',
    eventName: 'Test Event',
    userId: 'u1',
    userName: 'Jan Kowalski',
    userEmail: 'jan@example.com',
    distanceId: 'd1',
    distanceName: '10 km',
    category: 'Open',
    registeredAt: new Date().toISOString(),
    status,
    totalAmount,
  } as Registration,
  registrationData: { ...registrationData, totalAmount },
  eventId: 'e1',
  eventName: 'Test Event',
  eventSlug: 'test-event',
  eventDate: new Date().toISOString(),
  eventCity: 'Warszawa',
  paymentConfig: {
    type: paymentType,
    bankAccountNumber: '11 1111 1111 1111 1111 1111 1111',
    bankAccountHolder: 'Fundacja Test',
  },
});

describe('RegistrationSuccessPage — status-driven payment display', () => {
  it('shows "Do zapłaty" and the amber note for a pending gateway Zapis', () => {
    mockLocationState = makeState('pending', 'admin_gateway', 80);

    render(<RegistrationSuccessPage />);

    expect(screen.getByText('Do zapłaty')).toBeInTheDocument();
    expect(screen.getByText(/Płatność nie została jeszcze zrealizowana/)).toBeInTheDocument();
    expect(screen.getByText('Rejestracja wstępna zakończona!')).toBeInTheDocument();
    expect(screen.queryByText('Razem zapłacono')).not.toBeInTheDocument();
    expect(screen.queryByText('Płatność zrealizowana automatycznie')).not.toBeInTheDocument();
  });

  it('shows "Razem zapłacono" for a confirmed gateway Zapis', () => {
    mockLocationState = makeState('confirmed', 'admin_gateway', 80);

    render(<RegistrationSuccessPage />);

    expect(screen.getByText('Razem zapłacono')).toBeInTheDocument();
    expect(screen.getByText('Płatność zrealizowana automatycznie')).toBeInTheDocument();
    expect(screen.queryByText(/Płatność nie została jeszcze zrealizowana/)).not.toBeInTheDocument();
  });

  it('hides the bank transfer data for a confirmed zero-due bank Zapis', () => {
    mockLocationState = makeState('confirmed', 'organizer_bank', 0);

    render(<RegistrationSuccessPage />);

    expect(screen.getByText('Rejestracja zakończona!')).toBeInTheDocument();
    expect(screen.queryByText('Dane do przelewu bankowego')).not.toBeInTheDocument();
  });

  it('still shows the bank transfer data for a pending bank Zapis', () => {
    mockLocationState = makeState('pending', 'organizer_bank', 80);

    render(<RegistrationSuccessPage />);

    expect(screen.getByText('Dane do przelewu bankowego')).toBeInTheDocument();
    expect(screen.queryByText(/Płatność nie została jeszcze zrealizowana/)).not.toBeInTheDocument();
  });
});
