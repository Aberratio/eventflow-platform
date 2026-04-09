import { mockUsers } from '@/api';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { STORAGE_KEYS, MOCK_PASSWORD } from '@/constants';
import { appLogger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (role: UserRole) => void;
  loginWithCredentials: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = STORAGE_KEYS.AUTH;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        appLogger.setCurrentUser({ id: parsed.id, role: parsed.role, name: parsed.name, email: parsed.email });
        appLogger.auth('session_restored', `Przywrócono sesję użytkownika ${parsed.name} (${parsed.role})`, {
          userId: parsed.id, userRole: parsed.role, userName: parsed.name,
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
      appLogger.setCurrentUser({ id: mockUser.id, role: mockUser.role, name: mockUser.name, email: mockUser.email });
      appLogger.auth('login', `Zalogowano użytkownika ${mockUser.name} (rola: ${mockUser.role})`, {
        userId: mockUser.id, userRole: mockUser.role, userName: mockUser.name,
      });
    }
  };

  const loginWithCredentials = (email: string, password: string): boolean => {
    if (password !== MOCK_PASSWORD) {
      appLogger.auth('login_failed', `Nieudana próba logowania — błędne hasło dla ${email}`, { metadata: { email } });
      return false;
    }
    const foundUser = mockUsers.find((u) => u.email === email);
    if (!foundUser) {
      appLogger.auth('login_failed', `Nieudana próba logowania — nieznany email: ${email}`, { metadata: { email } });
      return false;
    }
    setUser(foundUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(foundUser));
    appLogger.setCurrentUser({ id: foundUser.id, role: foundUser.role, name: foundUser.name, email: foundUser.email });
    appLogger.auth('login', `Zalogowano użytkownika ${foundUser.name} (rola: ${foundUser.role})`, {
      userId: foundUser.id, userRole: foundUser.role, userName: foundUser.name, metadata: { method: 'credentials' },
    });
    return true;
  };

  const logout = () => {
    appLogger.auth('logout', `Wylogowano użytkownika ${user?.name ?? 'nieznany'}`);
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Safe version that returns null if not in provider
export const useAuthSafe = () => {
  return useContext(AuthContext);
};
