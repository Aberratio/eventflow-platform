import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { getCurrentUser } from '@/api';
import { AUTH_SESSION_EXPIRED_EVENT, STORAGE_KEYS } from '@/constants';
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

  it('hydrates cached user while validating stored bearer token', async () => {
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, 'jwt-token');
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(testUsers[2]));
    vi.mocked(getCurrentUser).mockResolvedValueOnce({ data: testUsers[2], success: true });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user?.role).toBe('organizer');
    expect(result.current.isAuthenticated).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user?.role).toBe('organizer');
  });

  it('clears cached auth when the API reports an expired session', async () => {
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, 'jwt-token');
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(testUsers[2]));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.AUTH)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.API_TOKEN)).toBeNull();
  });

  it('ignores expired-session events for a token that is no longer current', async () => {
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, 'fresh-token');
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(testUsers[2]));
    vi.mocked(getCurrentUser).mockResolvedValueOnce({ data: testUsers[2], success: true });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(AUTH_SESSION_EXPIRED_EVENT, { detail: { token: 'old-token' } }),
      );
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.AUTH)).not.toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.API_TOKEN)).toBe('fresh-token');
  });
});
