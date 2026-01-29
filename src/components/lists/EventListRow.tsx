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

  // Check if event is in the past
  const isPast = new Date(event.date) < new Date();

  const registrationStatus = event.registrationStatus || 'open';
  
  // For past events, show "Wyniki" instead of registration status
  const getStatusDisplay = () => {
    if (isPast) {
      return {
        label: 'Wyniki',
        variant: 'secondary' as const,
        showTrophy: true
      };
    }
    
    return {
      label: registrationStatus === 'open' 
        ? 'Otwarte' 
        : registrationStatus === 'closed' 
        ? 'Zamkn.' 
        : 'Brak',
      variant: registrationStatus === 'open' 
        ? 'default' as const
        : registrationStatus === 'closed' 
        ? 'secondary' as const
        : 'outline' as const,
      showTrophy: false
    };
  };
  
  const statusDisplay = getStatusDisplay();

  // Format date for display
  const eventDate = new Date(event.date);
  const dateDisplay = event.isVirtual && event.startDate && event.endDate 
    ? `${format(new Date(event.startDate), 'd', { locale: pl })}-${format(new Date(event.endDate), 'd MMM', { locale: pl })}`
    : format(eventDate, 'd MMM', { locale: pl });

  // Format distances as inline text
  const distancesText = event.distances.map(d => d.name).join(', ');

  return (
    <Link 
      to={`/events/${event.slug}`}
      className={`group flex items-start gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors ${
        isRegistered || hasCompleted ? 'bg-primary/5' : ''
      }`}
    >
      {/* Date column - responsive width */}
      <div className="w-12 sm:w-14 shrink-0 text-center pt-0.5">
        <span className="text-xs sm:text-sm font-medium text-foreground">{dateDisplay}</span>
      </div>
      
      {/* Vertical separator */}
      <div className="w-px self-stretch bg-border/40 shrink-0" />
      
      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          <span className="font-medium text-foreground truncate group-hover:text-primary transition-colors text-sm sm:text-base">
            {event.name}
          </span>
          {event.isVirtual && (
            <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
              <Globe className="h-2 sm:h-2.5 w-2 sm:w-2.5 mr-0.5" />
              <span className="hidden sm:inline">Wirtualny</span>
              <span className="sm:hidden">Wirt.</span>
            </Badge>
          )}
          {hasCompleted ? (
            <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0">Ukończony</Badge>
          ) : isRegistered ? (
            <Badge variant="default" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0">Zapisany</Badge>
          ) : null}
          <span className="text-muted-foreground hidden sm:inline">•</span>
          <span className="text-muted-foreground text-sm hidden sm:inline">
            {event.isVirtual ? 'Cały świat' : event.city}
          </span>
        </div>
        
        {/* Distances as inline text + mobile location */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-muted-foreground mt-0.5">
          <span className="sm:hidden">
            {event.isVirtual ? 'Cały świat' : event.city}
            {showDetails && distancesText && ' • '}
          </span>
          {showDetails && <span className="truncate">{distancesText}</span>}
        </div>
      </div>
      
      {/* Status + counter + arrow */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {showDetails && (
          <>
            <Badge variant={statusDisplay.variant} className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 whitespace-nowrap">
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
        <ChevronRight className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
    </Link>
  );
};
