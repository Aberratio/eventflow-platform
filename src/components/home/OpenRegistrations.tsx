import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Event } from '@/types';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface OpenRegistrationsProps {
  events: Event[];
}

export const OpenRegistrations = ({ events }: OpenRegistrationsProps) => {
  const now = new Date();
  const openEvents = events
    .filter(e => !e.isPrivate && new Date(e.registrationDeadline) > now && e.status === 'published')
    .sort((a, b) => new Date(a.registrationDeadline).getTime() - new Date(b.registrationDeadline).getTime())
    .slice(0, 6);

  if (openEvents.length === 0) return null;

  const getMinPrice = (event: Event) => {
    const prices = event.distances.map(d => d.price);
    return Math.min(...prices);
  };

  return (
    <section className="py-8 md:py-12 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Trwające zapisy</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Zapisz się na nadchodzące zawody</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 hidden sm:flex">
            <Link to="/events">
              Wszystkie
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {openEvents.map(event => (
            <Link key={event.id} to={`/events/${event.slug}`} className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-muted-foreground/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded bg-muted shrink-0"><DisciplineIcon discipline={event.discipline} size="md" /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {event.name}
                      </h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1.5">
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
                    <div className="shrink-0 text-right">
                      <span className="font-bold text-primary text-sm">od {getMinPrice(event)} zł</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-4 text-center sm:hidden">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/events">
              Zobacz wszystkie
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
