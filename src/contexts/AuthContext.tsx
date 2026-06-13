import { getCurrentUser, getUsers, login as apiLogin, logout as apiLogout } from '@/api';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { appLogger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (role: UserRole) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = STORAGE_KEYS.AUTH;

const getStorage = () =>
  typeof window === 'undefined' ? null : window.localStorage;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then((response) => {
        if (!response.data) return;
        setUser(response.data);
        getStorage()?.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.data));
        appLogger.setCurrentUser({
          id: response.data.id,
          role: response.data.role,
          name: response.data.name,
          email: response.data.email,
        });
      })
      .catch(() => getStorage()?.removeItem(AUTH_STORAGE_KEY));
  }, []);

  const login = async (role: UserRole) => {
    try {
      const response = await getUsers({ role, pageSize: 1 });
      const databaseUser = response.data[0];
      if (!databaseUser) return;
      setUser(databaseUser);
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
    setUser(null);
    appLogger.setCurrentUser(null);
    getStorage()?.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, loginWithCredentials, logout }}
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
