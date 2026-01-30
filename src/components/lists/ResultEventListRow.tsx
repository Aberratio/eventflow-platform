import { Badge } from '@/components/ui/badge';
import { Event } from '@/types';
import { ChevronRight, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface ResultEventListRowProps {
  event: Event;
}

export const ResultEventListRow = ({ event }: ResultEventListRowProps) => {
  const dateDisplay = format(new Date(event.date), 'd MMM', { locale: pl });
  const distancesText = event.distances.map(d => d.name).join(', ');

  return (
    <Link 
      to={`/events/${event.slug}?tab=results`}
      className="group flex items-start gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors"
    >
      {/* Date column with color accent */}
      <div className="w-12 sm:w-14 shrink-0 text-center pt-0.5 pr-2 sm:pr-3 border-r-2 border-primary/20">
        <span className="text-xs sm:text-sm font-medium text-foreground">{dateDisplay}</span>
      </div>
      
      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          <span className="font-medium text-foreground truncate group-hover:text-primary transition-colors text-sm sm:text-base">
            {event.name}
          </span>
          <span className="text-muted-foreground hidden sm:inline">•</span>
          <span className="text-muted-foreground text-sm hidden sm:inline">{event.city}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-muted-foreground mt-0.5">
          <span className="sm:hidden">{event.city} • </span>
          <span className="truncate">{distancesText}</span>
        </div>
      </div>
      
      {/* Results badge + arrow */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0">
          <Trophy className="h-2 sm:h-2.5 w-2 sm:w-2.5 mr-0.5" />
          Wyniki
        </Badge>
        <ChevronRight className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
    </Link>
  );
};
