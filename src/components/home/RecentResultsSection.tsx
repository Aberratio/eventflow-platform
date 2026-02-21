import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowRight, Calendar, MapPin, ChevronRight } from 'lucide-react';
import { Event } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface RecentResultsSectionProps {
  events: Event[];
}

export const RecentResultsSection = ({ events }: RecentResultsSectionProps) => {
  const completedEvents = events
    .filter(e => e.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  if (completedEvents.length === 0) return null;

  return (
    <section className="relative py-10 md:py-14 animate-fade-in">
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-primary rounded-full shrink-0" />
            <div>
              <h2 className="text-xl md:text-2xl font-bold leading-tight">Ostatnie wyniki</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Sprawdź wyniki zakończonych zawodów</p>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 hidden sm:flex text-muted-foreground hover:text-foreground">
            <Link to="/wyniki">
              Wszystkie
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {completedEvents.map((event) => (
            <Link 
              key={event.id}
              to={`/results?eventId=${event.id}`}
              className="group flex items-center justify-between gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent transition-all duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-accent transition-colors">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm group-hover:text-foreground transition-colors line-clamp-1">{event.name}</div>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      {format(new Date(event.date), 'd MMM yyyy', { locale: pl })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {event.city}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
            </Link>
          ))}
        </div>

        <div className="mt-4 text-center sm:hidden">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/wyniki">
              Wszystkie wyniki
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
