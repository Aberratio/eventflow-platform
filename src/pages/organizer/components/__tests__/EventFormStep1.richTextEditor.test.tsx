import { useLayoutEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventFormStep1 } from '../EventFormStep1';
import { useEventFormState } from '../../hooks/useEventFormState';
import { getEventById, getOrganizerEventLimit } from '@/api';
import type { Event, OrganizerEventLimit, User } from '@/types';

// Regression: the event wizard's description step hosts RichTextEditor, the component whose
// TipTap lifecycle crashed on this exact page (see rich-text-editor.test.tsx for the isolated repro).
// This test wires the real useEventFormState hook + the real EventFormStep1 component together, the
// same combination the organizer's browser runs, and fires the destroy timer the same way.

const FireTimersAfterCommit = () => {
  useLayoutEffect(() => {
    vi.advanceTimersByTime(5);
  }, []);
  return null;
};

const toast = vi.fn();
const navigate = vi.fn();
let paramsReturn: Record<string, string> = {};

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
  disciplineLabels: { running: 'Bieganie', cycling: 'Kolarstwo' },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: organizer }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useParams: () => paramsReturn,
}));

const limit: OrganizerEventLimit = { limit: 10, used: 1, available: 9 };

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
      <FireTimersAfterCommit />
    </QueryClientProvider>,
  );
};

describe('EventFormStep1 description editor', () => {
  beforeEach(() => {
    paramsReturn = {};
    toast.mockClear();
    navigate.mockClear();
    vi.mocked(getOrganizerEventLimit).mockClear();
    vi.mocked(getOrganizerEventLimit).mockResolvedValue({ success: true, data: limit });
    vi.mocked(getEventById).mockReset();
  });

  it('create: renders the description editor instead of crashing', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    expect(() => renderHarness()).not.toThrow();

    vi.useRealTimers();

    await waitFor(() => {
      expect(document.querySelector('.ProseMirror')).toBeTruthy();
    });
  });

  it('edit: loads the stored description into the editor', async () => {
    paramsReturn = { id: 'e1' };
    const event = {
      id: 'e1',
      description: '<p>Opis <a href="mailto:biuro@example.pl">mail</a></p>',
      distances: [],
      documents: [],
    } as unknown as Event;
    vi.mocked(getEventById).mockResolvedValue({ success: true, data: event });

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    expect(() => renderHarness()).not.toThrow();

    vi.useRealTimers();

    await waitFor(() => {
      expect(document.querySelector('.ProseMirror a[href="mailto:biuro@example.pl"]')).toBeTruthy();
    });
  });

  // Added once DisciplineMultiSelect (also rendered by this sub-step) no longer nests a
  // <button> inside the combobox trigger <button>. Kept in this file rather than
  // DisciplineMultiSelect.test.tsx because it exercises the real page-level markup, not the
  // component in isolation.
  it('has no nested interactive elements', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { container } = renderHarness();
    vi.useRealTimers();

    await waitFor(() => expect(document.querySelector('.ProseMirror')).toBeTruthy());

    expect(container.querySelectorAll('button button, button a, a button').length).toBe(0);
  });
});
