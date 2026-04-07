import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

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

  it('login sets user by role', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login('participant'));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.role).toBe('participant');
  });

  it('loginWithCredentials validates password', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    let ok: boolean;
    act(() => { ok = result.current.loginWithCredentials('wrong@test.com', 'wrong'); });
    expect(ok!).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('loginWithCredentials succeeds with correct credentials', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    let ok: boolean;
    act(() => { ok = result.current.loginWithCredentials('jan@example.com', 'demo1234'); });
    expect(ok!).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('logout clears user and storage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login('admin'));
    expect(result.current.isAuthenticated).toBe(true);

    act(() => result.current.logout());
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('zmierzymyczas_auth')).toBeNull();
  });

  it('persists session to localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login('organizer'));
    const stored = JSON.parse(localStorage.getItem('zmierzymyczas_auth')!);
    expect(stored.role).toBe('organizer');
  });
});
