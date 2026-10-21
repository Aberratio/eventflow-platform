import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, waitFor, resetQueryClient } from '@/test/test-utils';
import EventRegistrationPage from '../EventRegistrationPage';

/**
 * React-hooks/exhaustive-deps flagged the unauthenticated-redirect
 * `useEffect` in EventRegistrationPage for a missing `slug` dependency. The
 * effect builds `returnTo: /events/${slug}/register` for the post-login
 * redirect — if `slug` isn't a dependency, a stale closure could carry an
 * old slug into that URL after the route's slug param changes without a
 * full remount (e.g. the user pastes/clicks a different event's register
 * link while still logged out). This test asserts the redirect always
 * targets the CURRENT slug, including across a slug change on an already
 * mounted instance.
 */

const mockNavigate = vi.fn();

const { makeEvent } = vi.hoisted(() => {
  const future = (daysFromNow: number) =>
    new Date(Date.now() + daysFromNow * 86400000).toISOString();
  return {
    makeEvent: (slug: string) => ({
      id: `id-${slug}`,
      name: `Event ${slug}`,
      slug,
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
    }),
  };
});

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getEventBySlug: vi.fn((slug: string) => Promise.resolve({ data: makeEvent(slug) })),
    getCare: vi.fn().mockResolvedValue({ data: { myCompetitors: [] } }),
  };
});

vi.mock('@/contexts/AuthContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return {
    ...actual,
    // Logged-out user: this is the branch that reads `slug` for `returnTo`.
    useAuth: () => ({ user: null, isAuthenticated: false }),
  };
});

let currentSlug = 'event-a';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ slug: currentSlug }),
    useNavigate: () => mockNavigate,
  };
});

describe('EventRegistrationPage login redirect — slug dependency', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    currentSlug = 'event-a';
    resetQueryClient();
  });

  it('redirects to /login with a returnTo matching the current slug, including after a slug change', async () => {
    const { rerender } = render(<EventRegistrationPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: { returnTo: '/events/event-a/register' },
      });
    });

    mockNavigate.mockClear();
    currentSlug = 'event-b';
    rerender(<EventRegistrationPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: { returnTo: '/events/event-b/register' },
      });
    });
  });
});
