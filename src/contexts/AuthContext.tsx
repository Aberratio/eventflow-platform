import {
  getCurrentUser,
  getUsers,
  login as apiLogin,
  loginByRole as apiLoginByRole,
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
import { User, UserRole } from '@/types';
import { UpdateUserPayload } from '@/api/payloads';
import { AUTH_SESSION_EXPIRED_EVENT, STORAGE_KEYS } from '@/constants';
import { appLogger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (role: UserRole) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateCurrentUser: (data: UpdateUserPayload) => Promise<User | null>;
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
    (token?: string | null) => {
      const storage = getStorage();
      if (token && storage?.getItem(STORAGE_KEYS.API_TOKEN) !== token) {
        return;
      }
      clearSession();
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
      clearSessionForToken(token);
    };
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [clearSessionForToken]);

  const login = async (role: UserRole) => {
    try {
      const roleLoginResponse = await apiLoginByRole(role);
      const databaseUser =
        roleLoginResponse.data ?? (await getUsers({ role, pageSize: 1 })).data[0];
      if (!databaseUser) return;
      setUser(databaseUser);
      setIsLoading(false);
      getStorage()?.setItem(AUTH_STORAGE_KEY, JSON.stringify(databaseUser));
      appLogger.setCurrentUser({
        id: databaseUser.id,
        role: databaseUser.role,
        name: databaseUser.name,
        email: databaseUser.email,
      });
      appLogger.auth(`login`, `Selected ${databaseUser.name} (${databaseUser.role})`, {
        userId: databaseUser.id,
        userRole: databaseUser.role,
        userName: databaseUser.name,
      });
    } catch {
      return undefined;
    }
  };

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
    } catch {
      appLogger.auth('login_failed', `Failed login for ${email}`, { metadata: { email } });
      return false;
    }
  };

  const logout = async () => {
    appLogger.auth('logout', `Logged out ${user?.name ?? 'unknown user'}`);
    await apiLogout().catch(() => undefined);
    clearSession();
  };

  const updateCurrentUser = async (data: UpdateUserPayload): Promise<User | null> => {
    if (!user) return null;
    const response = await apiUpdateUser(user.id, data);
    if (!response.data) return null;
    setUser(response.data);
    getStorage()?.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.data));
    return response.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithCredentials,
        logout,
        updateCurrentUser,
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
