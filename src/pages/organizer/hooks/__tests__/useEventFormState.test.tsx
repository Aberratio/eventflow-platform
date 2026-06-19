import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEventFormState } from '../useEventFormState';
import { createEvent, getOrganizerEventLimit } from '@/api';
import type { OrganizerEventLimit, User } from '@/types';

const toast = vi.fn();
const navigate = vi.fn();

const organizer: User = {
  id: 'u-organizer',
  name: 'Organizer',
  email: 'organizer@example.com',
  role: 'organizer',
  status: 'active',
};

vi.mock('@/api', () => ({
  createEvent: vi.fn(),
  getEventById: vi.fn(),
  getOrganizerEventLimit: vi.fn(),
  getOrganizers: vi.fn(),
  updateEvent: vi.fn(),
  uploadEventDocument: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: organizer }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useParams: () => ({}),
}));

const limit: OrganizerEventLimit = { limit: 10, used: 1, available: 9 };

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const never = () => new Promise<never>(() => undefined);

const fillRequiredBasics = (form: ReturnType<typeof useEventFormState>) => {
  form.setName('Testowy Bieg');
  form.setDate('2027-05-10');
  form.setRegistrationDeadline('2027-05-01');
  form.setLocation('Park');
  form.setCity('Warszawa');
};

const addValidDistance = (form: ReturnType<typeof useEventFormState>) => {
  form.addDistance();
  form.updateDistance(0, 'name', '10 km');
  form.updateDistance(0, 'length', '10');
  form.updateDistance(0, 'price', '99');
};

describe('useEventFormState event wizard validation', () => {
  beforeEach(() => {
    toast.mockClear();
    navigate.mockClear();
    vi.mocked(getOrganizerEventLimit).mockResolvedValue({ success: true, data: limit });
    vi.mocked(createEvent).mockResolvedValue({
      success: true,
      data: { id: 'e1', name: 'Testowy Bieg' },
    } as Awaited<ReturnType<typeof createEvent>>);
  });

  it('blocks leaving the current section when required fields are missing', async () => {
    const { result } = renderHook(() => useEventFormState(), { wrapper });

    await act(async () => {
      result.current.nextStep();
    });

    expect(result.current.subStep).toBe('basic');
    expect(result.current.shownValidationSubSteps).toContain('basic');
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Uzupełnij tę sekcję',
        variant: 'destructive',
      }),
    );
  });

  it('rejects non-numeric distance values before submit', async () => {
    const { result } = renderHook(() => useEventFormState(), { wrapper });
    await waitFor(() => expect(getOrganizerEventLimit).toHaveBeenCalled());

    act(() => {
      fillRequiredBasics(result.current);
      addValidDistance(result.current);
      result.current.updateDistance(0, 'price', 'abc');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(createEvent).not.toHaveBeenCalled();
    expect(result.current.fieldValidationErrors.distance_0_price).toContain('poprawną liczbą');
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Błąd',
        variant: 'destructive',
      }),
    );
  });

  it('rejects invalid named gadgets before submit', async () => {
    const { result } = renderHook(() => useEventFormState(), { wrapper });
    await waitFor(() => expect(getOrganizerEventLimit).toHaveBeenCalled());

    act(() => {
      fillRequiredBasics(result.current);
      addValidDistance(result.current);
      result.current.addGadget();
    });
    act(() => {
      result.current.updateGadget(result.current.gadgets[0].id, {
        name: 'Koszulka',
        price: 'not-a-price',
      });
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(createEvent).not.toHaveBeenCalled();
    expect(result.current.sectionValidationErrors.gadgets).toEqual(
      expect.arrayContaining([expect.stringContaining('Cena gadzetu')]),
    );
  });

  it('blocks submit while the organizer event limit is still loading', async () => {
    vi.mocked(getOrganizerEventLimit).mockReturnValue(never());
    const { result } = renderHook(() => useEventFormState(), { wrapper });

    act(() => {
      fillRequiredBasics(result.current);
      addValidDistance(result.current);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(createEvent).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Limit wydarzeń jest jeszcze sprawdzany',
        variant: 'destructive',
      }),
    );
  });

  it('blocks submit when the organizer event limit cannot be loaded', async () => {
    vi.mocked(getOrganizerEventLimit).mockRejectedValue(new Error('Serwer limitów nie odpowiada'));
    const { result } = renderHook(() => useEventFormState(), { wrapper });
    await waitFor(() =>
      expect(result.current.eventLimitError).toBe('Serwer limitów nie odpowiada'),
    );

    act(() => {
      fillRequiredBasics(result.current);
      addValidDistance(result.current);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(createEvent).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Nie można potwierdzić limitu wydarzeń',
        variant: 'destructive',
      }),
    );
  });

  it('submits normalized numeric payload when the wizard is valid', async () => {
    const { result } = renderHook(() => useEventFormState(), { wrapper });
    await waitFor(() => expect(getOrganizerEventLimit).toHaveBeenCalled());

    act(() => {
      fillRequiredBasics(result.current);
      addValidDistance(result.current);
      result.current.updateDistance(0, 'officePrice', '120,50');
      result.current.updateDistance(0, 'limit', '250');
      result.current.addGadget();
    });
    act(() => {
      result.current.updateGadget(result.current.gadgets[0].id, {
        name: 'Koszulka',
        price: '49,99',
        stockCount: '20',
      });
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        distances: [
          expect.objectContaining({
            price: 99,
            officePrice: 120.5,
            limit: 250,
          }),
        ],
        merchandise: [
          expect.objectContaining({
            price: 49.99,
            stockCount: 20,
          }),
        ],
      }),
    );
  });
});
