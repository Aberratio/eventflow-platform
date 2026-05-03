import { getCurrentUser, login as apiLogin, logout as apiLogout, mockUsers } from '@/api';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { STORAGE_KEYS, MOCK_PASSWORD } from '@/constants';
import { appLogger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (role: UserRole) => void;
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = STORAGE_KEYS.AUTH;

const useHttpApi = Boolean(import.meta.env.VITE_API_URL);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (useHttpApi) {
      getCurrentUser()
        .then((response) => {
          if (!response.data) return;
          setUser(response.data);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.data));
          appLogger.setCurrentUser({
            id: response.data.id,
            role: response.data.role,
            name: response.data.name,
            email: response.data.email,
          });
        })
        .catch(() => localStorage.removeItem(AUTH_STORAGE_KEY));
      return;
    }

    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        appLogger.setCurrentUser({
          id: parsed.id,
          role: parsed.role,
          name: parsed.name,
          email: parsed.email,
        });
        appLogger.auth('session_restored', `Restored session for ${parsed.name} (${parsed.role})`, {
          userId: parsed.id,
          userRole: parsed.role,
          userName: parsed.name,
        });
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, []);

  const login = (role: UserRole) => {
    const mockUser = mockUsers.find((u) => u.role === role);
    if (mockUser) {
      setUser(mockUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
      appLogger.setCurrentUser({
        id: mockUser.id,
        role: mockUser.role,
        name: mockUser.name,
        email: mockUser.email,
      });
      appLogger.auth(`login`, `Logged in ${mockUser.name} (${mockUser.role})`, {
        userId: mockUser.id,
        userRole: mockUser.role,
        userName: mockUser.name,
      });
    }
  };

  const loginWithCredentials = async (email: string, password: string): Promise<boolean> => {
    if (useHttpApi) {
      try {
        const response = await apiLogin({ email, password });
        if (!response.data) return false;
        setUser(response.data);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.data));
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
    }

    if (password !== MOCK_PASSWORD) {
      appLogger.auth('login_failed', `Failed login, wrong password for ${email}`, {
        metadata: { email },
      });
      return false;
    }
    const foundUser = mockUsers.find((u) => u.email === email);
    if (!foundUser) {
      appLogger.auth('login_failed', `Failed login, unknown email: ${email}`, {
        metadata: { email },
      });
      return false;
    }
    setUser(foundUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(foundUser));
    appLogger.setCurrentUser({
      id: foundUser.id,
      role: foundUser.role,
      name: foundUser.name,
      email: foundUser.email,
    });
    appLogger.auth('login', `Logged in ${foundUser.name} (${foundUser.role})`, {
      userId: foundUser.id,
      userRole: foundUser.role,
      userName: foundUser.name,
      metadata: { method: 'credentials' },
    });
    return true;
  };

  const logout = async () => {
    appLogger.auth('logout', `Logged out ${user?.name ?? 'unknown user'}`);
    if (useHttpApi) {
      await apiLogout().catch(() => undefined);
    }
    setUser(null);
    appLogger.setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
