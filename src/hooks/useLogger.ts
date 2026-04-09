import { useEffect } from 'react';
import { useAuthSafe } from '@/contexts/AuthContext';
import { appLogger } from '@/lib/logger';

/**
 * Hook synchronizujący kontekst użytkownika z globalnym loggerem.
 * Zwraca instancję loggera gotową do użycia w komponentach React.
 */
export function useLogger() {
  const authContext = useAuthSafe();
  const user = authContext?.user ?? null;

  useEffect(() => {
    if (user) {
      appLogger.setCurrentUser({
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
      });
    } else {
      appLogger.setCurrentUser(null);
    }
  }, [user]);

  return appLogger;
}
