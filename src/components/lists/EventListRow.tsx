import { Badge } from '@/components/ui/badge';
import { Event, Registration, Result } from '@/types';
import { Users, ChevronRight, Globe, Trophy, Clock, CheckCircle2, XCircle, Radio } from 'lucide-react';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface EventListRowProps {
  event: Event;
  userRegistrations?: Registration[];
  userResults?: Result[];
  showDetails?: boolean;
}

type EventTimeStatus = 'past' | 'live' | 'upcoming';

const getEventTimeStatus = (event: Event): EventTimeStatus => {
  const now = new Date();
  const eventDate = new Date(event.date);
  
  // Check if event is today (LIVE)
  if (isToday(eventDate)) return 'live';
  
  // For multi-day virtual events
  if (event.isVirtual && event.startDate && event.endDate) {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    if (now >= start && now <= end) return 'live';
    if (now > end) return 'past';
    return 'upcoming';
  }
  
  if (isBefore(eventDate, startOfDay(now))) return 'past';
  return 'upcoming';
};

interface StatusConfig {
  label: string;
  icon: React.ReactNode;
  className: string;
}

const getStatusConfig = (event: Event, timeStatus: EventTimeStatus): StatusConfig => {
  if (timeStatus === 'live') {
    return {
      label: 'Na żywo',
      icon: <Radio className="h-2.5 w-2.5 mr-1 animate-pulse" />,
      className: 'bg-destructive/15 text-destructive border-destructive/30 font-semibold',
    };
  }

  if (timeStatus === 'past') {
    return {
      label: 'Wyniki',
      icon: <Trophy className="h-2.5 w-2.5 mr-1" />,
      className: 'bg-muted text-muted-foreground border-border',
    };
  }

  // Upcoming
  const regStatus = event.registrationStatus || 'open';
  if (regStatus === 'open') {
    return {
      label: 'Zapisy otwarte',
      icon: <CheckCircle2 className="h-2.5 w-2.5 mr-1" />,
      className: 'bg-success/15 text-success border-success/30 font-medium',
    };
  }
  if (regStatus === 'closed') {
    return {
      label: 'Zapisy zamknięte',
      icon: <XCircle className="h-2.5 w-2.5 mr-1" />,
      className: 'bg-warning/15 text-warning border-warning/30',
    };
  }
  return {
    label: 'Brak zapisów',
    icon: <Clock className="h-2.5 w-2.5 mr-1" />,
    className: 'bg-muted text-muted-foreground border-border',
  };
};

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

  const timeStatus = getEventTimeStatus(event);
  const statusConfig = getStatusConfig(event, timeStatus);
  const isPast = timeStatus === 'past';
  const isLive = timeStatus === 'live';

  const eventDate = new Date(event.date);
  const dateDisplay = event.isVirtual && event.startDate && event.endDate 
    ? `${format(new Date(event.startDate), 'd', { locale: pl })}-${format(new Date(event.endDate), 'd MMM', { locale: pl })}`
    : format(eventDate, 'd MMM', { locale: pl });

  const distancesText = event.distances.map(d => d.name).join(', ');

  return (
    <Link 
      to={`/events/${event.slug}`}
      className={cn(
        'group flex items-start gap-0 border-b border-border last:border-b-0 transition-all duration-200',
        isPast && 'opacity-60 hover:opacity-90',
        isLive && 'bg-destructive/[0.04]',
        !isPast && !isLive && 'hover:bg-accent',
        (isRegistered || hasCompleted) && 'bg-accent/30',
      )}
    >
      {/* Date column */}
      <div className={cn(
        'w-14 sm:w-16 shrink-0 text-center py-3 px-2 flex flex-col items-center justify-center border-r border-border',
        isLive && 'border-r-destructive/40',
      )}>
        <span className={cn(
          'text-xs sm:text-sm font-bold leading-none',
          isLive ? 'text-destructive' : isPast ? 'text-muted-foreground' : 'text-foreground',
        )}>
          {dateDisplay.split(' ')[0]}
        </span>
        <span className={cn(
          'text-[10px] uppercase tracking-wide mt-0.5',
          isLive ? 'text-destructive/70' : 'text-muted-foreground',
        )}>
          {dateDisplay.split(' ')[1] || ''}
        </span>
      </div>
      
      {/* Left accent bar */}
      <div className={cn(
        'w-0.5 self-stretch shrink-0 transition-all duration-200',
        isLive ? 'bg-destructive' : 'bg-transparent group-hover:bg-warning',
      )} />
      
      {/* Main content */}
      <div className="flex-1 min-w-0 py-3 px-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn(
            'font-medium truncate transition-colors text-sm sm:text-base',
            isPast ? 'text-muted-foreground' : 'text-foreground group-hover:text-foreground',
          )}>
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
              variant="outline"
              className={cn('text-[9px] sm:text-[10px] px-1.5 py-0.5 whitespace-nowrap flex items-center', statusConfig.className)}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
            {!isPast && (
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:flex items-center gap-1">
                <Users className="h-3 w-3" />
                {totalParticipants >= 1000 
                  ? `${(totalParticipants / 1000).toFixed(1)}k` 
                  : totalParticipants.toLocaleString()}
              </span>
            )}
          </>
        )}
        <ChevronRight className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
      </div>
    </Link>
  );
};
