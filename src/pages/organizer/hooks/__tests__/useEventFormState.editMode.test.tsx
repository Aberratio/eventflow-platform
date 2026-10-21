import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEventFormState } from '../useEventFormState';
import { getEventById, getOrganizerEventLimit, getOrganizers } from '@/api';
import { isTierExpired } from '@/api/pricing';
import type { Event, OrganizerEventLimit, User } from '@/types';

// EventFormStep2's price-tier expiry preview (PriceTierPreview + the
// inline isTierExpired check) reads `dist.registeredCount` off the
// DistanceFormData produced by this hook. Previously it referenced an
// undefined `existingEvent` variable in the component (tsc errors), so the
// preview was dead code that could never reflect the real server-side count
// (`event_distances.registered_count`). This test
// pins the hook's responsibility in the fix: when editing an existing event,
// the loaded distance's registeredCount must reach `distances[i]`.

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
  useParams: () => ({ id: 'event-1' }),
}));

const limit: OrganizerEventLimit = { limit: 10, used: 1, available: 9 };

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const existingEvent: Event = {
  id: 'event-1',
  name: 'Bieg Testowy',
  slug: 'bieg-testowy',
  discipline: 'running',
  date: '2027-05-10',
  location: 'Park',
  city: 'Warszawa',
  description: 'Test',
  imageUrl: '/test.jpg',
  organizerId: 'u-organizer',
  organizerName: 'Organizator',
  publicationStatus: 'draft',
  registrationDeadline: '2027-05-01',
  featured: false,
  bzIntegrationEnabled: true,
  bzOrganizationToken: 'ORG-EXISTING-TOKEN',
  distances: [
    {
      id: 'dist-1',
      name: '10 km',
      length: 10,
      unit: 'km',
      categories: [],
      registeredCount: 37,
      price: 99,
      priceTiers: [
        {
          id: 'tier-1',
          name: 'Early Bird',
          discountType: 'fixed',
          discountValue: 10,
          participantLimit: 20,
        },
      ],
    },
    {
      id: 'dist-2',
      name: 'Sztafeta 4x100',
      length: 0.4,
      unit: 'km',
      categories: [],
      registeredCount: 5,
      price: 200,
      startType: 'relay',
      relayMinTeamSize: 4,
      relayMaxTeamSize: 4,
      teamAggregationRule: 'sum',
      teamPricingMode: 'per_team',
    },
  ],
};

describe('useEventFormState edit mode', () => {
  beforeEach(() => {
    toast.mockClear();
    navigate.mockClear();
    vi.mocked(getEventById).mockReset();
    vi.mocked(getOrganizers).mockReset();
    vi.mocked(getOrganizerEventLimit).mockReset();
    vi.mocked(getEventById).mockResolvedValue({ success: true, data: existingEvent });
    vi.mocked(getOrganizerEventLimit).mockResolvedValue({ success: true, data: limit });
  });

  it('threads the loaded distance registeredCount into the editable form distances', async () => {
    const { result } = renderHook(() => useEventFormState(), { wrapper });

    await waitFor(() => expect(result.current.distances).toHaveLength(2));
    await waitFor(() => expect(result.current.distances[0].registeredCount).toBe(37));
  });

  it('makes the real registered count reach the price-tier expiry check, not a hardcoded 0', async () => {
    const { result } = renderHook(() => useEventFormState(), { wrapper });

    await waitFor(() => expect(result.current.distances[0]?.registeredCount).toBe(37));

    const [dist] = result.current.distances;
    const [tier] = dist.priceTiers;
    // participantLimit is 20 and registeredCount is 37, so the tier must be
    // reported expired using the real count (a hardcoded 0 would report it
    // as still active, which is exactly the regression this ticket fixes).
    expect(isTierExpired(tier, dist.registeredCount)).toBe(true);
    expect(isTierExpired(tier, 0)).toBe(false);
  });

  // Editing an existing Event must load its saved BZ integration
  // toggle/token into the form state — the same round-trip other per-Event
  // fields (e.g. registeredCount above) already get through this hook.
  it('loads the existing event BZ integration toggle and token into the editable form state', async () => {
    const { result } = renderHook(() => useEventFormState(), { wrapper });

    await waitFor(() => expect(result.current.bzIntegrationEnabled).toBe(true));
    expect(result.current.bzOrganizationToken).toBe('ORG-EXISTING-TOKEN');
  });

  // TeamPricingMode must round-trip through
  // the same explicit-field-list load site as startType/relayMinTeamSize, or
  // it silently resets to the default on the organizer's next edit.
  it('loads the existing relay distance teamPricingMode into the editable form state', async () => {
    const { result } = renderHook(() => useEventFormState(), { wrapper });

    await waitFor(() => expect(result.current.distances).toHaveLength(2));
    expect(result.current.distances[1].teamPricingMode).toBe('per_team');
  });
});
