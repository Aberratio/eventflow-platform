import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Event, Registration } from '@/types';
import { ArrowRight, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { disciplineIcons } from '@/data/mockData';

interface UpcomingEventsProps {
  events: Event[];
  userRegistrations: Registration[];
}

export const UpcomingEvents = ({ events, userRegistrations }: UpcomingEventsProps) => {
  const now = new Date();
  const upcomingEvents = events
    .filter(e => new Date(e.date) > now && e.status === 'published')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8);

  if (upcomingEvents.length === 0) return null;

  const isUserRegistered = (eventId: string) => {
    return userRegistrations.some(r => r.eventId === eventId && r.status === 'confirmed');
  };

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Nadchodzące wydarzenia</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Najbliższe zawody w kalendarzu</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 hidden sm:flex">
            <Link to="/events">
              Kalendarz
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {upcomingEvents.map(event => {
            const registered = isUserRegistered(event.id);
            
            return (
              <Link key={event.id} to={`/events/${event.slug}`}>
                <Card className="h-full hover:shadow-md hover:border-primary/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl shrink-0">{disciplineIcons[event.discipline]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-medium text-sm line-clamp-2 leading-tight">{event.name}</h3>
                          {registered && (
                            <Badge variant="default" className="shrink-0 text-xs">
                              Zapisany
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
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
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
        
        <div className="mt-4 text-center sm:hidden">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/events">
              Zobacz kalendarz
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
