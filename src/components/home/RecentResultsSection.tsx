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
    .filter((e) => e.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  if (completedEvents.length === 0) return null;

  return (
    <section className="animate-fade-in relative py-10 md:py-14">
      <div className="container relative mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 shrink-0 rounded-full bg-primary" />
            <div>
              <h2 className="text-xl font-bold leading-tight md:text-2xl">Ostatnie wyniki</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Sprawdź wyniki zakończonych zawodów
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden gap-1.5 text-muted-foreground hover:text-foreground sm:flex"
          >
            <Link to="/wydarzenia">
              Wszystkie
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {completedEvents.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.slug}?tab=results`}
              className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:bg-accent"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted transition-colors group-hover:bg-accent">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="line-clamp-1 text-sm font-medium transition-colors group-hover:text-foreground">
                    {event.name}
                  </div>
                  <div className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
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
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
            </Link>
          ))}
        </div>

        <div className="mt-4 text-center sm:hidden">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/wydarzenia">
              Wszystkie wyniki
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
