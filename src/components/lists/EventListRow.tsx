import { Badge } from '@/components/ui/badge';
import { Event, Registration, Result } from '@/types';
import { Users, ChevronRight, Globe, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface EventListRowProps {
  event: Event;
  userRegistrations?: Registration[];
  userResults?: Result[];
  showDetails?: boolean;
}

export const EventListRow = ({ 
  event, 
  userRegistrations = [], 
  userResults = [],
  showDetails = false
}: EventListRowProps) => {
  const totalParticipants = event.distances.reduce((acc, d) => acc + d.registeredCount, 0);
  
  const isRegistered = userRegistrations.some(
    r => r.eventId === event.id && r.status === 'confirmed'
  );
  const hasCompleted = userResults.some(
    r => r.eventId === event.id && r.status === 'finished'
  );

  const isPast = new Date(event.date) < new Date();
  const registrationStatus = event.registrationStatus || 'open';
  
  const getStatusDisplay = () => {
    if (isPast) {
      return { label: 'Wyniki', variant: 'secondary' as const, showTrophy: true };
    }
    return {
      label: registrationStatus === 'open' ? 'Otwarte' : registrationStatus === 'closed' ? 'Zamkn.' : 'Brak',
      variant: registrationStatus === 'open' ? 'default' as const : 'secondary' as const,
      showTrophy: false
    };
  };
  
  const statusDisplay = getStatusDisplay();

  const eventDate = new Date(event.date);
  const dateDisplay = event.isVirtual && event.startDate && event.endDate 
    ? `${format(new Date(event.startDate), 'd', { locale: pl })}-${format(new Date(event.endDate), 'd MMM', { locale: pl })}`
    : format(eventDate, 'd MMM', { locale: pl });

  const distancesText = event.distances.map(d => d.name).join(', ');

  return (
    <Link 
      to={`/events/${event.slug}`}
      className={`group flex items-start gap-0 border-b border-border last:border-b-0 hover:bg-accent transition-all duration-200 ${
        isRegistered || hasCompleted ? 'bg-accent/30' : ''
      }`}
    >
      {/* Date column */}
      <div className="w-14 sm:w-16 shrink-0 text-center py-3 px-2 flex flex-col items-center justify-center border-r border-border">
        <span className="text-xs sm:text-sm font-bold text-foreground leading-none">{dateDisplay.split(' ')[0]}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{dateDisplay.split(' ')[1] || ''}</span>
      </div>
      
      {/* Red accent bar on hover */}
      <div className="w-0.5 self-stretch bg-transparent group-hover:bg-warning transition-all duration-200 shrink-0" />
      
      {/* Main content */}
      <div className="flex-1 min-w-0 py-3 px-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-foreground truncate group-hover:text-foreground transition-colors text-sm sm:text-base">
            {event.name}
          </span>
          {event.isVirtual && (
            <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1.5 py-0 shrink-0">
              <Globe className="h-2 sm:h-2.5 w-2 sm:w-2.5 mr-0.5" />
              Wirt.
            </Badge>
          )}
          {hasCompleted ? (
            <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1.5 py-0 shrink-0">Ukończony</Badge>
          ) : isRegistered ? (
            <Badge className="text-[9px] sm:text-[10px] px-1.5 py-0 shrink-0">Zapisany</Badge>
          ) : null}
        </div>
        
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground mt-0.5">
          <span className="truncate">
            {event.isVirtual ? 'Cały świat' : event.city}
          </span>
          {showDetails && distancesText && (
            <>
              <span className="opacity-40">·</span>
              <span className="truncate">{distancesText}</span>
            </>
          )}
        </div>
      </div>
      
      {/* Status + counter + arrow */}
      <div className="flex items-center gap-2 shrink-0 py-3 pr-3">
        {showDetails && (
          <>
            <Badge
              variant={statusDisplay.variant}
              className="text-[9px] sm:text-[10px] px-1.5 py-0 whitespace-nowrap"
            >
              {statusDisplay.showTrophy && <Trophy className="h-2 sm:h-2.5 w-2 sm:w-2.5 mr-0.5" />}
              {statusDisplay.label}
            </Badge>
            <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:flex items-center gap-1">
              <Users className="h-3 w-3" />
              {totalParticipants >= 1000 
                ? `${(totalParticipants / 1000).toFixed(1)}k` 
                : totalParticipants.toLocaleString()}
            </span>
          </>
        )}
        <ChevronRight className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
      </div>
    </Link>
  );
};
