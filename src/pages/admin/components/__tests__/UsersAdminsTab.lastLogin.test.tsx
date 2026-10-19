import { screen } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { UsersAdminsTab } from '../UsersAdminsTab';
import { getAllUsers } from '@/api/fetchAllPages';
import type { User } from '@/types';

// D-05: the tab pages through every user via getAllUsers.
vi.mock('@/api/fetchAllPages', async () => {
  const actual = await vi.importActual<typeof import('@/api/fetchAllPages')>('@/api/fetchAllPages');
  return { ...actual, getAllUsers: vi.fn() };
});

const user = (over: Partial<User>): User =>
  ({ id: 'u', name: 'Ada Admin', email: 'ada@example.com', role: 'admin', ...over }) as User;

// G-07 (umowa §5.8): the server exposes users.last_login_at as `lastLoginAt` (ISO or null).
describe('UsersAdminsTab last login (G-07)', () => {
  it('shows the last login date, or "Nigdy" before the first login', async () => {
    vi.mocked(getAllUsers).mockResolvedValue({
      data: [
        user({ id: 'a1', name: 'Ada Admin', lastLoginAt: '2026-09-15T08:30:00+02:00' }),
        user({ id: 'a2', name: 'Bob Brak', email: 'bob@example.com', lastLoginAt: null }),
      ],
      total: 2,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    });

    render(<UsersAdminsTab />);

    expect(await screen.findByText('Ostatnie logowanie')).toBeInTheDocument();
    expect(screen.getByText(/15\.09\.2026/)).toBeInTheDocument();
    expect(screen.getByText('Nigdy')).toBeInTheDocument();
  });
});
