import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCoManagedEvents } from '@/hooks/useCoManagedEvents';
import { DashboardSkeleton } from '@/components/skeletons';

/**
 * R-01 (zakres P2, do potwierdzenia przez Zamawiającego): route guard for the organizer's event
 * management pages. An organizer passes as before; any other signed-in Account passes only when it is
 * a Co-manager of at least one Event (found via the organizer-panel event list). Creating Events and the
 * organizer dashboard keep their organizer-only guards. The server remains the authority.
 */
export const EventManagementRoute = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const isOrganizer = user?.role === 'organizer';
  const coManaged = useCoManagedEvents(Boolean(user) && !isOrganizer);

  if (isLoading || (!isOrganizer && Boolean(user) && coManaged.isLoading)) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/logowanie"
        replace
        state={{ returnTo: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (!isOrganizer && !coManaged.canReachEventManagement) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};
