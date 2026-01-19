import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowRight, Calendar, MapPin } from 'lucide-react';
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
    <section className="py-8 md:py-12 animate-fade-in">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold">Ostatnie wyniki</h2>
            </div>
            <p className="text-sm text-muted-foreground">Sprawdź wyniki zakończonych zawodów</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 hidden sm:flex">
            <Link to="/wyniki">
              Kalendarz
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="space-y-2">
          {completedEvents.map(event => (
            <Card key={event.id} className="transition-all duration-300 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/results?eventId=${event.id}`}
                      className="font-medium text-sm md:text-base hover:text-primary transition-colors line-clamp-1"
                    >
                      {event.name}
                    </Link>
                    <div className="flex flex-wrap gap-2 md:gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(event.date), 'd MMM yyyy', { locale: pl })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.city}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0" asChild>
                    <Link to={`/results?eventId=${event.id}`}>
                      Zobacz wyniki
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
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