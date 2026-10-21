import { useQuery } from '@tanstack/react-query';
import { getEventsByOrganizer } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { canReachEventManagement, coManagedEvents } from '@/lib/eventTeam';

/**
 * The Events the signed-in Account co-manages. Shares its cache entry with the
 * organizer panel's event list (`organizer-events`), which carries `teamRole` per Event.
 */
export function useCoManagedEvents(enabled = true) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['organizer-events', user?.id],
    queryFn: () => getEventsByOrganizer(user?.id || ''),
    enabled: enabled && Boolean(user?.id),
  });
  const events = query.data?.data;
  return {
    isLoading: query.isLoading,
    events: coManagedEvents(events),
    allEvents: events ?? [],
    canReachEventManagement: canReachEventManagement(user?.role, events),
  };
}
