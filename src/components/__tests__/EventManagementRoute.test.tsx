import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EventManagementRoute } from '../EventManagementRoute';

const getEventsByOrganizer = vi.fn();
let authState: { user: unknown; isAuthenticated: boolean; isLoading: boolean };

vi.mock('@/api', () => ({
  getEventsByOrganizer: (...a: unknown[]) => getEventsByOrganizer(...a),
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authState }));

vi.mock('@/components/skeletons', () => ({
  DashboardSkeleton: () => <p>loading</p>,
}));

const renderGuard = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={['/organizer/events/e1/overview']}>
        <Routes>
          <Route
            path="/organizer/events/:id/:tab"
            element={
              <EventManagementRoute>
                <p>management page</p>
              </EventManagementRoute>
            }
          />
          <Route path="/403" element={<p>forbidden page</p>} />
          <Route path="/logowanie" element={<p>login page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

const asUser = (role: string) => {
  authState = { user: { id: 'u1', role }, isAuthenticated: true, isLoading: false };
};

describe('EventManagementRoute', () => {
  beforeEach(() => {
    getEventsByOrganizer.mockReset();
  });

  it('lets an organizer in without asking for the co-managed list', async () => {
    asUser('organizer');
    renderGuard();

    expect(await screen.findByText('management page')).toBeInTheDocument();
    expect(getEventsByOrganizer).not.toHaveBeenCalled();
  });

  it('lets a participant who co-manages an Event in', async () => {
    asUser('participant');
    getEventsByOrganizer.mockResolvedValue({
      data: [{ id: 'e1', teamRole: 'co_manager' }],
    });
    renderGuard();

    expect(await screen.findByText('management page')).toBeInTheDocument();
    expect(getEventsByOrganizer).toHaveBeenCalledWith('u1');
  });

  it('sends a participant without any co-managed Event to the forbidden page', async () => {
    asUser('participant');
    getEventsByOrganizer.mockResolvedValue({ data: [] });
    renderGuard();

    expect(await screen.findByText('forbidden page')).toBeInTheDocument();
  });

  it('sends a signed-out visitor to the login', async () => {
    authState = { user: null, isAuthenticated: false, isLoading: false };
    renderGuard();

    expect(await screen.findByText('login page')).toBeInTheDocument();
    expect(getEventsByOrganizer).not.toHaveBeenCalled();
  });
});
