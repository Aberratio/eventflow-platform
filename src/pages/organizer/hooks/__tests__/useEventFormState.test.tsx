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
    vi.mocked(createEvent).mockClear();
    vi.mocked(getOrganizerEventLimit).mockClear();
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
      result.current.updateDistance(0, 'startType', 'relay');
      result.current.updateDistance(0, 'relayMinTeamSize', '2');
      result.current.updateDistance(0, 'relayMaxTeamSize', '4');
      result.current.updateDistance(0, 'relayTeamCompletionDeadline', '2027-05-05');
      result.current.updateDistance(0, 'teamAggregationRule', 'sum');
      result.current.updateDistance(0, 'teamPricingMode', 'per_team');
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
            pricingVariants: [
              expect.objectContaining({
                name: 'Zapis w biurze zawodów',
                price: 120.5,
                officeOnly: true,
                visibleInPublicForm: false,
              }),
            ],
            limit: 250,
            startType: 'relay',
            relayMinTeamSize: 2,
            relayMaxTeamSize: 4,
            relayTeamCompletionDeadline: '2027-05-05',
            teamAggregationRule: 'sum',
            teamPricingMode: 'per_team',
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

  it('defaults payment window fields and submits them normalized as numbers', async () => {
    const { result } = renderHook(() => useEventFormState(), { wrapper });
    await waitFor(() => expect(getOrganizerEventLimit).toHaveBeenCalled());

    // Bramka domyślnie 45 minut, przelew domyślnie 3 dni — zanim organizator
    // cokolwiek zmieni w formularzu.
    expect(result.current.gatewayWindowMinutes).toBe('45');
    expect(result.current.transferWindowDays).toBe('3');

    act(() => {
      fillRequiredBasics(result.current);
      addValidDistance(result.current);
      result.current.setGatewayWindowMinutes('60');
      result.current.setTransferWindowDays('5');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentConfig: expect.objectContaining({
          gatewayWindowMinutes: 60,
          transferWindowDays: 5,
        }),
      }),
    );
  });

  // The platform never creates a BZ organization itself, so
  // enabling the toggle without a pasted token must be blocked client-side too —
  // matching the server's hard 422 for the same case.
  it('rejects submit when Biuro Zawodow is enabled without a token', async () => {
    const { result } = renderHook(() => useEventFormState(), { wrapper });
    await waitFor(() => expect(getOrganizerEventLimit).toHaveBeenCalled());

    act(() => {
      fillRequiredBasics(result.current);
      addValidDistance(result.current);
      result.current.setBzIntegrationEnabled(true);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(createEvent).not.toHaveBeenCalled();
    expect(result.current.fieldValidationErrors.bzOrganizationToken).toBeTruthy();
  });

  it('submits the Biuro Zawodow toggle and token once both are set', async () => {
    const { result } = renderHook(() => useEventFormState(), { wrapper });
    await waitFor(() => expect(getOrganizerEventLimit).toHaveBeenCalled());

    act(() => {
      fillRequiredBasics(result.current);
      addValidDistance(result.current);
      result.current.setBzIntegrationEnabled(true);
      result.current.setBzOrganizationToken('ORG-XYZ-1');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        bzIntegrationEnabled: true,
        bzOrganizationToken: 'ORG-XYZ-1',
      }),
    );
  });

  // Turning the toggle off must not silently drop an already-typed token from
  // the submitted payload — the form never clears the field locally, so a
  // disable-then-save round trip through this form preserves it exactly like
  // the server does when the key is simply absent from a PATCH.
  it('keeps a previously entered BZ token in the payload after disabling the toggle', async () => {
    const { result } = renderHook(() => useEventFormState(), { wrapper });
    await waitFor(() => expect(getOrganizerEventLimit).toHaveBeenCalled());

    act(() => {
      fillRequiredBasics(result.current);
      addValidDistance(result.current);
      result.current.setBzIntegrationEnabled(true);
      result.current.setBzOrganizationToken('ORG-KEEP-1');
    });
    act(() => {
      result.current.setBzIntegrationEnabled(false);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        bzIntegrationEnabled: false,
        bzOrganizationToken: 'ORG-KEEP-1',
      }),
    );
  });

  it('rejects invalid relay team size range', async () => {
    const { result } = renderHook(() => useEventFormState(), { wrapper });
    await waitFor(() => expect(getOrganizerEventLimit).toHaveBeenCalled());

    act(() => {
      fillRequiredBasics(result.current);
      addValidDistance(result.current);
      result.current.updateDistance(0, 'startType', 'relay');
      result.current.updateDistance(0, 'relayMinTeamSize', '5');
      result.current.updateDistance(0, 'relayMaxTeamSize', '3');
      result.current.updateDistance(0, 'relayTeamCompletionDeadline', '2027-05-05');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(createEvent).not.toHaveBeenCalled();
    expect(result.current.fieldValidationErrors.distance_0_relayMaxTeamSize).toContain('Maksimum');
  });

  // The server's own default is
  // 'per_person' - a fresh relay distance the organizer never touches this
  // field on must submit that same default, not omit the key.
  it('defaults a fresh relay distance to per_person team pricing on submit', async () => {
    const { result } = renderHook(() => useEventFormState(), { wrapper });
    await waitFor(() => expect(getOrganizerEventLimit).toHaveBeenCalled());

    act(() => {
      fillRequiredBasics(result.current);
      addValidDistance(result.current);
      result.current.updateDistance(0, 'startType', 'relay');
      result.current.updateDistance(0, 'relayMinTeamSize', '2');
      result.current.updateDistance(0, 'relayMaxTeamSize', '4');
      result.current.updateDistance(0, 'relayTeamCompletionDeadline', '2027-05-05');
      result.current.updateDistance(0, 'teamAggregationRule', 'sum');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        distances: [expect.objectContaining({ teamPricingMode: 'per_person' })],
      }),
    );
  });

  it('requires a team aggregation rule for a relay distance', async () => {
    const { result } = renderHook(() => useEventFormState(), { wrapper });
    await waitFor(() => expect(getOrganizerEventLimit).toHaveBeenCalled());

    act(() => {
      fillRequiredBasics(result.current);
      addValidDistance(result.current);
      result.current.updateDistance(0, 'startType', 'relay');
      result.current.updateDistance(0, 'relayMinTeamSize', '2');
      result.current.updateDistance(0, 'relayMaxTeamSize', '4');
      result.current.updateDistance(0, 'relayTeamCompletionDeadline', '2027-05-05');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(createEvent).not.toHaveBeenCalled();
    expect(result.current.fieldValidationErrors.distance_0_teamAggregationRule).toContain('regułę');
  });
});
