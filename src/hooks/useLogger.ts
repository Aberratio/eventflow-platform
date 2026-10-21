import { useEffect } from 'react';
import { useAuthSafe } from '@/contexts/AuthContext';
import { appLogger } from '@/lib/logger';

/**
 * Hook that syncs the user context with the global logger.
 * Returns the logger instance, ready to use in React components.
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
