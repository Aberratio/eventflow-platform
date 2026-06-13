import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import type { User, UserRole } from '@/types';

const testUsers: User[] = [
  { id: 'u-participant', name: 'Participant', email: 'jan@example.com', role: 'participant' },
  { id: 'u-admin', name: 'Admin', email: 'admin@test.com', role: 'admin' },
  { id: 'u-organizer', name: 'Organizer', email: 'organizer@test.com', role: 'organizer' },
];

vi.mock('@/api', () => ({
  getCurrentUser: vi.fn(async () => ({ data: null, success: true })),
  getUsers: vi.fn(async ({ role }: { role?: UserRole } = {}) => {
    const data = role ? testUsers.filter((user) => user.role === role) : testUsers;
    return {
      data,
      total: data.length,
      page: 1,
      pageSize: data.length,
      totalPages: 1,
    };
  }),
  login: vi.fn(async ({ email, password }: { email: string; password: string }) => {
    const user = password === 'demo1234' ? testUsers.find((item) => item.email === email) : null;
    return { data: user ?? null, success: Boolean(user) };
  }),
  logout: vi.fn(async () => ({ data: undefined, success: true })),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts unauthenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('login sets user by role', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('participant');
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.role).toBe('participant');
  });

  it('loginWithCredentials validates password', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    let ok: boolean;
    await act(async () => {
      ok = await result.current.loginWithCredentials('wrong@test.com', 'wrong');
    });
    expect(ok!).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('loginWithCredentials succeeds with correct credentials', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    let ok: boolean;
    await act(async () => {
      ok = await result.current.loginWithCredentials('jan@example.com', 'demo1234');
    });
    expect(ok!).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('logout clears user and storage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('admin');
    });
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('zmierzymyczas_auth')).toBeNull();
  });

  it('persists session to localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('organizer');
    });
    const stored = JSON.parse(localStorage.getItem('zmierzymyczas_auth')!);
    expect(stored.role).toBe('organizer');
  });
});
