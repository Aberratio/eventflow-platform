import { Badge } from '@/components/ui/badge';
import { Event, Registration, Result } from '@/types';
import { Calendar, MapPin, Users, ArrowRight, Globe, Trophy } from 'lucide-react';
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
  const totalLimit = event.distances.reduce((acc, d) => acc + d.limit, 0);
  
  const isRegistered = userRegistrations.some(
    r => r.eventId === event.id && r.status === 'confirmed'
  );
  const hasCompleted = userResults.some(
    r => r.eventId === event.id && r.status === 'finished'
  );

  // Check if event is in the past
  const isPast = new Date(event.date) < new Date();

  const registrationStatus = event.registrationStatus || 'open';
  
  // For past events, show "Wyniki dostępne" instead of registration status
  const getStatusDisplay = () => {
    if (isPast) {
      return {
        label: 'Wyniki dostępne',
        variant: 'secondary' as const,
        showTrophy: true
      };
    }
    
    return {
      label: registrationStatus === 'open' 
        ? 'Zapisy otwarte' 
        : registrationStatus === 'closed' 
        ? 'Zapisy zamknięte' 
        : 'Brak zapisów',
      variant: registrationStatus === 'open' 
        ? 'default' as const
        : registrationStatus === 'closed' 
        ? 'secondary' as const
        : 'outline' as const,
      showTrophy: false
    };
  };
  
  const statusDisplay = getStatusDisplay();

  return (
    <Link 
      to={`/events/${event.slug}`}
      className={`group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-lg border bg-card transition-all duration-300 hover:bg-accent/50 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5 ${
        isRegistered || hasCompleted ? 'ring-1 ring-primary/20 bg-primary/5' : ''
      }`}
    >
      {/* Main Info */}
      <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground truncate transition-colors group-hover:text-primary">{event.name}</h3>
            {event.isVirtual && (
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                <Globe className="h-3 w-3 mr-1" />
                Wirtualny
              </Badge>
            )}
            {hasCompleted ? (
              <Badge variant="secondary" className="text-xs shrink-0">Ukończony</Badge>
            ) : isRegistered ? (
              <Badge variant="default" className="text-xs shrink-0">Zapisany</Badge>
            ) : null}
          </div>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {event.isVirtual && event.startDate && event.endDate 
                ? `${format(new Date(event.startDate), 'd MMM', { locale: pl })} - ${format(new Date(event.endDate), 'd MMM', { locale: pl })}`
                : format(new Date(event.date), 'd MMM yyyy', { locale: pl })
              }
            </span>
            <span className="flex items-center gap-1">
              {event.isVirtual ? (
                <>
                  <Globe className="h-3.5 w-3.5" />
                  Cały świat
                </>
              ) : (
                <>
                  <MapPin className="h-3.5 w-3.5" />
                  {event.city}
                </>
              )}
            </span>
          </div>

        {/* Distances - always show on details mode, hide on compact */}
        {showDetails && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {event.distances.map(d => (
              <Badge key={d.id} variant="outline" className="text-xs font-normal">
                {d.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Status + Counter + CTA */}
      <div className="flex items-center gap-3 sm:gap-4">
        {showDetails && (
          <>
            <Badge variant={statusDisplay.variant} className="text-xs whitespace-nowrap shrink-0">
              {statusDisplay.showTrophy && <Trophy className="h-3 w-3 mr-1" />}
              {statusDisplay.label}
            </Badge>
            
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
              <Users className="h-4 w-4" />
              <span className="font-medium text-foreground">{totalParticipants.toLocaleString()}</span>
              <span>/</span>
              <span>{totalLimit.toLocaleString()}</span>
            </div>
          </>
        )}
        
        {!showDetails && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {totalParticipants.toLocaleString()}
          </span>
        )}

        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
      </div>
    </Link>
  );
};
