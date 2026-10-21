import {
  getCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  updateUser as apiUpdateUser,
} from '@/api';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User } from '@/types';
import { SelfUpdateUserPayload } from '@/api/payloads';
import { AUTH_SESSION_EXPIRED_EVENT, STORAGE_KEYS } from '@/constants';
import { appLogger } from '@/lib/logger';
import { ApiRequestError } from '@/api/errors';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Resolves false for bad credentials; rejects with ApiRequestError (code 'account_blocked') for a blocked account. */
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateCurrentUser: (data: SelfUpdateUserPayload) => Promise<User | null>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = STORAGE_KEYS.AUTH;

const getStorage = () => (typeof window === 'undefined' ? null : window.localStorage);

const getStoredUser = (): User | null => {
  const storage = getStorage();
  if (!storage?.getItem(STORAGE_KEYS.API_TOKEN)) {
    storage?.removeItem(AUTH_STORAGE_KEY);
    return null;
  }

  const value = storage.getItem(AUTH_STORAGE_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as User;
  } catch {
    storage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

const isAuthSessionExpiredEvent = (event: Event): event is CustomEvent<{ token?: string | null }> =>
  event instanceof CustomEvent;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(() =>
    Boolean(getStorage()?.getItem(STORAGE_KEYS.API_TOKEN)),
  );

  const clearSession = useCallback(() => {
    setUser(null);
    appLogger.setCurrentUser(null);
    getStorage()?.removeItem(AUTH_STORAGE_KEY);
    getStorage()?.removeItem(STORAGE_KEYS.API_TOKEN);
  }, []);

  const clearSessionForToken = useCallback(
    (token?: string | null): boolean => {
      const current = getStorage()?.getItem(STORAGE_KEYS.API_TOKEN);
      // A 401 for an older token must not end a newer session (re-login while an old request was
      // in flight). An empty slot means the adapter already dropped this token: clear the session.
      if (token && current && current !== token) {
        return false;
      }
      clearSession();
      return true;
    },
    [clearSession],
  );

  useEffect(() => {
    const storage = getStorage();
    const validatingToken = storage?.getItem(STORAGE_KEYS.API_TOKEN);
    if (!validatingToken) {
      clearSession();
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    getCurrentUser()
      .then((response) => {
        if (cancelled) return;
        if (!response.data) {
          clearSessionForToken(validatingToken);
          return;
        }
        setUser(response.data);
        getStorage()?.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.data));
        appLogger.setCurrentUser({
          id: response.data.id,
          role: response.data.role,
          name: response.data.name,
          email: response.data.email,
        });
      })
      .catch(() => {
        if (!cancelled) clearSessionForToken(validatingToken);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession, clearSessionForToken]);

  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const token = isAuthSessionExpiredEvent(event) ? event.detail?.token : undefined;
      const cleared = clearSessionForToken(token);
      // Only a real token the server rejected is a session ending; an anonymous 401 (no token) is not.
      if (cleared && token) {
        toast('Sesja zakończona', {
          description: 'Twoja sesja wygasła lub została zakończona. Zaloguj się ponownie.',
        });
      }
    };
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [clearSessionForToken]);

  const loginWithCredentials = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiLogin({ email, password });
      if (!response.data) return false;
      setUser(response.data);
      setIsLoading(false);
      getStorage()?.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.data));
      appLogger.setCurrentUser({
        id: response.data.id,
        role: response.data.role,
        name: response.data.name,
        email: response.data.email,
      });
      appLogger.auth('login', `Logged in ${response.data.name} (${response.data.role})`, {
        userId: response.data.id,
        userRole: response.data.role,
        userName: response.data.name,
        metadata: { method: 'api' },
      });
      return true;
    } catch (error) {
      appLogger.auth('login_failed', `Failed login for ${email}`, { metadata: { email } });
      // A blocked account is not a credentials problem; the page shows the server message.
      if (error instanceof ApiRequestError && error.code === 'account_blocked') throw error;
      // R-10: too many failed attempts; the page shows the wait time.
      if (error instanceof ApiRequestError && error.status === 429) throw error;
      return false;
    }
  };

  const logout = async () => {
    appLogger.auth('logout', `Logged out ${user?.name ?? 'unknown user'}`);
    await apiLogout().catch(() => undefined);
    clearSession();
  };

  const updateCurrentUser = async (data: SelfUpdateUserPayload): Promise<User | null> => {
    if (!user) return null;
    const response = await apiUpdateUser(user.id, data);
    if (!response.data) return null;
    setUser(response.data);
    getStorage()?.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.data));
    return response.data;
  };

  // The only trigger this context had for
  // re-fetching /users/me was mount + login — nothing re-pulled the logged-in
  // user after an action taken *during* the session that changes their role
  // server-side, like a self-service organizer-package purchase (server:
  // OrderRepository::grantOrganizerRoleIfNeeded()). Without this, the
  // Organizer-only nav item (Header.tsx, `user?.role === 'organizer'`) stays
  // hidden until the next full reload/re-login even though the purchase
  // already succeeded. Exposed as an explicit opt-in call (checkout calls it
  // after a successful order) rather than polling, since role changes mid-
  // session are otherwise rare.
  const refreshUser = useCallback(async (): Promise<User | null> => {
    if (!getStorage()?.getItem(STORAGE_KEYS.API_TOKEN)) return null;
    try {
      const response = await getCurrentUser();
      if (!response.data) return null;
      setUser(response.data);
      getStorage()?.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.data));
      return response.data;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithCredentials,
        logout,
        updateCurrentUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const useAuthSafe = () => {
  return useContext(AuthContext);
};
