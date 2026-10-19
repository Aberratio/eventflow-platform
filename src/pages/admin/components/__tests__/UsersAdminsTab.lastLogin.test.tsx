import { screen } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { UsersAdminsTab } from '../UsersAdminsTab';
import { getUsers } from '@/api';
import type { User } from '@/types';

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return { ...actual, getUsers: vi.fn() };
});

const user = (over: Partial<User>): User =>
  ({ id: 'u', name: 'Ada Admin', email: 'ada@example.com', role: 'admin', ...over }) as User;

// G-07 (umowa §5.8): the server exposes users.last_login_at as `lastLoginAt` (ISO or null).
describe('UsersAdminsTab last login (G-07)', () => {
  it('shows the last login date, or "Nigdy" before the first login', async () => {
    vi.mocked(getUsers).mockResolvedValue({
      data: [
        user({ id: 'a1', name: 'Ada Admin', lastLoginAt: '2026-09-15T08:30:00+02:00' }),
        user({ id: 'a2', name: 'Bob Brak', email: 'bob@example.com', lastLoginAt: null }),
      ],
      total: 2,
      page: 1,
      pageSize: 1000,
      totalPages: 1,
    });

    render(<UsersAdminsTab />);

    expect(await screen.findByText('Ostatnie logowanie')).toBeInTheDocument();
    expect(screen.getByText(/15\.09\.2026/)).toBeInTheDocument();
    expect(screen.getByText('Nigdy')).toBeInTheDocument();
  });

  // Umowa §5.8: "ostatnie logowanie" dotyczy administratorów i moderatorów.
  it('lists moderators too, with their last login date', async () => {
    vi.mocked(getUsers).mockResolvedValue({
      data: [
        user({
          id: 'm1',
          name: 'Mira Moderator',
          email: 'mira@example.com',
          role: 'moderator',
          lastLoginAt: '2026-09-20T10:00:00+02:00',
        }),
        user({
          id: 'p1',
          name: 'Pawel Uczestnik',
          email: 'pawel@example.com',
          role: 'participant',
        }),
      ],
      total: 2,
      page: 1,
      pageSize: 1000,
      totalPages: 1,
    });

    render(<UsersAdminsTab />);

    expect(await screen.findByText('Mira Moderator')).toBeInTheDocument();
    expect(screen.getByText('Moderator')).toBeInTheDocument();
    expect(screen.getByText(/20.09.2026/)).toBeInTheDocument();
    expect(screen.queryByText('Pawel Uczestnik')).not.toBeInTheDocument();
  });
});
