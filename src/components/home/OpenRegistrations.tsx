import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, MapPin, Clock, ArrowRight, Users } from 'lucide-react';
import { Event, Registration } from '@/types';
import { disciplineLabels, disciplineIcons } from '@/data/mockData';
import { format, formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

interface OpenRegistrationsProps {
  events: Event[];
  userRegistrations: Registration[];
}

export const OpenRegistrations = ({ events, userRegistrations }: OpenRegistrationsProps) => {
  const now = new Date();
  const openEvents = events
    .filter(e => new Date(e.registrationDeadline) > now && e.status === 'published')
    .sort((a, b) => new Date(a.registrationDeadline).getTime() - new Date(b.registrationDeadline).getTime())
    .slice(0, 4);

  if (openEvents.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Trwające zapisy</h2>
            <p className="text-muted-foreground mt-1">Zarejestruj się, zanim będzie za późno!</p>
          </div>
          <Button asChild variant="ghost" className="gap-2 hidden sm:flex">
            <Link to="/events">
              Wszystkie zapisy
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {openEvents.map(event => {
            const totalCapacity = event.distances.reduce((sum, d) => sum + (d.limit || 0), 0);
            const totalRegistered = event.distances.reduce((sum, d) => sum + d.registeredCount, 0);
            const progress = (totalRegistered / totalCapacity) * 100;
            const isRegistered = userRegistrations.some(r => r.eventId === event.id);
            const deadlineText = formatDistanceToNow(new Date(event.registrationDeadline), { 
              addSuffix: true, 
              locale: pl 
            });

            return (
              <Link key={event.id} to={`/events/${event.id}`}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{disciplineIcons[event.discipline]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge variant="secondary">{disciplineLabels[event.discipline]}</Badge>
                          {isRegistered && (
                            <Badge variant="default">Zapisany</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{event.name}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(event.date), 'd MMM yyyy', { locale: pl })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.city}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              Zapisanych
                            </span>
                            <span className="font-medium">{totalRegistered} / {totalCapacity}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Koniec zapisów {deadlineText}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
        <div className="mt-6 text-center sm:hidden">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/events">
              Zobacz wszystkie zapisy
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
