import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventFormStep1 } from '../EventFormStep1';
import { useEventFormState } from '../../hooks/useEventFormState';
import { createEvent, getOrganizerEventLimit } from '@/api';
import type { OrganizerEventLimit, User } from '@/types';

// The "Biuro Zawodów" (BZ) integration toggle + pasted
// organization token, added to EventFormStep1's basic settings section
// alongside the existing isPrivate/accessCode toggle it mirrors. This wires
// the real useEventFormState hook into the real component in one tree (the
// same combination the organizer's browser actually runs), so a regression
// in the wiring between the two would be caught here, not just at the hook
// or component level in isolation.

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
  uploadEventImage: vi.fn(),
  getEventBackgrounds: vi.fn(),
  disciplineLabels: { running: 'Bieganie' },
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

/** Combines the real hook + the real component in one render tree, so typing
 * into the token field re-renders exactly like it does in the app (a form
 * object captured from a separately-rendered hook would go stale on every
 * keystroke instead). */
const Harness = () => {
  const form = useEventFormState();
  return <EventFormStep1 form={form} activeSubStep="basic" />;
};

const renderHarness = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Harness />
    </QueryClientProvider>,
  );
};

describe('EventFormStep1 Biuro Zawodow integration section', () => {
  beforeEach(() => {
    toast.mockClear();
    navigate.mockClear();
    vi.mocked(createEvent).mockClear();
    vi.mocked(getOrganizerEventLimit).mockClear();
    vi.mocked(getOrganizerEventLimit).mockResolvedValue({ success: true, data: limit });
  });

  it('renders the toggle, hides the token field until enabled, then shows it once the toggle is checked', async () => {
    const user = userEvent.setup();
    renderHarness();
    await waitFor(() => expect(getOrganizerEventLimit).toHaveBeenCalled());

    const checkbox = screen.getByLabelText('Integracja z Biurem Zawodów (BZ)');
    expect(checkbox).toBeInTheDocument();
    expect(screen.queryByLabelText('Token organizacji BZ *')).not.toBeInTheDocument();

    await user.click(checkbox);

    expect(screen.getByLabelText('Token organizacji BZ *')).toBeInTheDocument();
  });

  it('lets the organizer type a token through the real input', async () => {
    const user = userEvent.setup();
    renderHarness();
    await waitFor(() => expect(getOrganizerEventLimit).toHaveBeenCalled());

    await user.click(screen.getByLabelText('Integracja z Biurem Zawodów (BZ)'));
    const tokenInput = screen.getByLabelText('Token organizacji BZ *');
    await user.type(tokenInput, 'ORG-TYPED-1');

    expect(tokenInput).toHaveValue('ORG-TYPED-1');
  });
});
