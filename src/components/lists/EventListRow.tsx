import { Badge } from '@/components/ui/badge';
import { Event, Registration, Result } from '@/types';
import { disciplineIcons } from '@/data/mockData';
import { Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ListRow } from './ListRow';

interface EventListRowProps {
  event: Event;
  userRegistrations?: Registration[];
  userResults?: Result[];
  showParticipants?: boolean;
}

export const EventListRow = ({ 
  event, 
  userRegistrations = [], 
  userResults = [],
  showParticipants = true 
}: EventListRowProps) => {
  const totalParticipants = event.distances.reduce((acc, d) => acc + d.registeredCount, 0);
  
  const isRegistered = userRegistrations.some(
    r => r.eventId === event.id && r.status === 'confirmed'
  );
  const hasCompleted = userResults.some(
    r => r.eventId === event.id && r.status === 'finished'
  );

  const badge = hasCompleted ? (
    <Badge variant="secondary" className="text-xs">Ukończony</Badge>
  ) : isRegistered ? (
    <Badge variant="default" className="text-xs">Zapisany</Badge>
  ) : null;

  const subtitle = `${format(new Date(event.date), 'd MMMM yyyy', { locale: pl })} • ${event.city}`;

  const meta = showParticipants ? (
    <span className="flex items-center gap-1 text-sm text-muted-foreground">
      <Users className="h-3.5 w-3.5" />
      {totalParticipants.toLocaleString()}
    </span>
  ) : null;

  return (
    <ListRow
      icon={disciplineIcons[event.discipline]}
      title={event.name}
      subtitle={subtitle}
      badge={badge}
      meta={meta}
      href={`/events/${event.slug}`}
      highlighted={isRegistered || hasCompleted}
    />
  );
};
