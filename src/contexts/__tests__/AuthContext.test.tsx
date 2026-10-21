import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { getCurrentUser, login } from '@/api';
import { ApiRequestError } from '@/api/errors';
import { AUTH_SESSION_EXPIRED_EVENT, STORAGE_KEYS } from '@/constants';
import type { User, UserRole } from '@/types';
import { toast } from 'sonner';

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
  loginByRole: vi.fn(async (role: UserRole) => {
    const user = testUsers.find((item) => item.role === role) ?? null;
    return { data: user, success: Boolean(user) };
  }),
  logout: vi.fn(async () => ({ data: undefined, success: true })),
}));

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

/** Behaves like http.adapter.ts on a protected 401: drops the token, announces it, rejects. */
const fakeAdapterRejects = async (token: string): Promise<never> => {
  await Promise.resolve(); // a real request answers asynchronously, after the listeners are mounted
  localStorage.removeItem(STORAGE_KEYS.API_TOKEN);
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT, { detail: { token } }));
  throw new ApiRequestError('Twoja sesja wygasła. Zaloguj się ponownie.', 'unauthorized', 401);
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(toast).mockClear();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('starts unauthenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('login sets user by role', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.loginWithCredentials('jan@example.com', 'demo1234');
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

  it('loginWithCredentials rejects with account_blocked for a blocked account', async () => {
    const message =
      'Twoje konto zostało zablokowane. Jeśli uważasz, że to pomyłka, napisz do nas: kontakt@zmierzymyczas.pl.';
    vi.mocked(login).mockRejectedValueOnce(new ApiRequestError(message, 'account_blocked', 403));
    const { result } = renderHook(() => useAuth(), { wrapper });

    let error: unknown;
    await act(async () => {
      try {
        await result.current.loginWithCredentials('jan@example.com', 'demo1234');
      } catch (e) {
        error = e;
      }
    });

    expect(error).toBeInstanceOf(ApiRequestError);
    expect((error as ApiRequestError).code).toBe('account_blocked');
    expect((error as ApiRequestError).message).toBe(message);
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('zmierzymyczas_auth')).toBeNull();
  });

  it('loginWithCredentials still resolves false for other API errors', async () => {
    vi.mocked(login).mockRejectedValueOnce(
      new ApiRequestError('Invalid email or password', 'invalid_credentials', 401),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.loginWithCredentials('jan@example.com', 'bad');
    });

    expect(ok).toBe(false);
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
      await result.current.loginWithCredentials('admin@test.com', 'demo1234');
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
      await result.current.loginWithCredentials('organizer@test.com', 'demo1234');
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
    expect(toast).not.toHaveBeenCalled();
  });

  it('logs out when the adapter removed the token before announcing the expired session', async () => {
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, 'jwt-token');
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(testUsers[2]));
    vi.mocked(getCurrentUser).mockResolvedValueOnce({ data: testUsers[2], success: true });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      localStorage.removeItem(STORAGE_KEYS.API_TOKEN);
      window.dispatchEvent(
        new CustomEvent(AUTH_SESSION_EXPIRED_EVENT, { detail: { token: 'jwt-token' } }),
      );
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.AUTH)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.API_TOKEN)).toBeNull();
    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith('Sesja zakończona', expect.anything());
  });

  it('clears the session when mount-time validation is rejected by the adapter', async () => {
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, 'jwt-token');
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(testUsers[2]));
    vi.mocked(getCurrentUser).mockImplementationOnce(() => fakeAdapterRejects('jwt-token'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.AUTH)).toBeNull();
    expect(toast).toHaveBeenCalledTimes(1);
  });

  it('keeps a newer session when a stale validation for an old token fails after re-login', async () => {
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, 'old-token');
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(testUsers[2]));
    let rejectStale: (error: Error) => void = () => undefined;
    vi.mocked(getCurrentUser).mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectStale = reject;
        }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, 'fresh-token');
    await act(async () => {
      await result.current.loginWithCredentials('organizer@test.com', 'demo1234');
    });
    await act(async () => {
      // The adapter does not drop or announce a token that is no longer current.
      rejectStale(
        new ApiRequestError('Twoja sesja wygasła. Zaloguj się ponownie.', 'unauthorized', 401),
      );
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.API_TOKEN)).toBe('fresh-token');
    expect(toast).not.toHaveBeenCalled();
  });

  it('does not toast for an anonymous 401', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(AUTH_SESSION_EXPIRED_EVENT, { detail: { token: null } }),
      );
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(toast).not.toHaveBeenCalled();
  });

  it('refreshUser re-fetches /users/me and updates the stored user (e.g. after a role change mid-session)', async () => {
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, 'jwt-token');
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(testUsers[0]));
    vi.mocked(getCurrentUser).mockResolvedValueOnce({ data: testUsers[0], success: true });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user?.role).toBe('participant');

    const promotedUser: User = { ...testUsers[0], role: 'organizer' };
    vi.mocked(getCurrentUser).mockResolvedValueOnce({ data: promotedUser, success: true });

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(result.current.user?.role).toBe('organizer');
    expect(JSON.parse(localStorage.getItem('zmierzymyczas_auth')!).role).toBe('organizer');
  });

  it('refreshUser is a no-op when there is no session', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    let refreshed: User | null = null;
    await act(async () => {
      refreshed = await result.current.refreshUser();
    });

    expect(refreshed).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
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
    expect(toast).not.toHaveBeenCalled();
  });
});
