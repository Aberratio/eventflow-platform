import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, MapPin, Clock, ArrowRight, Users, Tag, Flame, Timer } from 'lucide-react';
import { Event, Registration } from '@/types';
import { disciplineLabels, disciplineIcons, getCurrentPrice } from '@/data/mockData';
import { format, formatDistanceToNow, differenceInDays, differenceInHours } from 'date-fns';
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
    .slice(0, 6);

  if (openEvents.length === 0) return null;

  const getPriceRange = (event: Event) => {
    const prices = event.distances.map(d => {
      const { price } = getCurrentPrice(d);
      return price;
    });
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) return `${minPrice} zł`;
    return `${minPrice} - ${maxPrice} zł`;
  };

  const getEarlyBirdInfo = (event: Event) => {
    for (const distance of event.distances) {
      if (distance.priceTiers && distance.priceTiers.length > 0) {
        const { tierName, nextTier } = getCurrentPrice(distance);
        if (tierName === 'Early Bird' && nextTier) {
          const daysLeft = differenceInDays(new Date(distance.priceTiers[0].endDate), now);
          return { isEarlyBird: true, daysLeft };
        }
      }
    }
    return { isEarlyBird: false, daysLeft: 0 };
  };

  const getDeadlineUrgency = (deadline: string) => {
    const daysLeft = differenceInDays(new Date(deadline), now);
    const hoursLeft = differenceInHours(new Date(deadline), now);
    
    if (hoursLeft <= 48) return { urgent: true, text: `${hoursLeft}h do końca!`, color: 'text-destructive' };
    if (daysLeft <= 7) return { urgent: true, text: `${daysLeft} dni do końca`, color: 'text-orange-600 dark:text-orange-400' };
    return { urgent: false, text: formatDistanceToNow(new Date(deadline), { addSuffix: true, locale: pl }), color: 'text-muted-foreground' };
  };

  return (
    <section className="py-8 md:py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-5 w-5 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold">Trwające zapisy</h2>
            </div>
            <p className="text-sm text-muted-foreground">Zapisz się, zanim zabraknie miejsc</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 hidden sm:flex">
            <Link to="/events">
              Wszystkie
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {openEvents.map(event => {
            const totalCapacity = event.distances.reduce((sum, d) => sum + (d.limit || 0), 0);
            const totalRegistered = event.distances.reduce((sum, d) => sum + d.registeredCount, 0);
            const progress = totalCapacity > 0 ? (totalRegistered / totalCapacity) * 100 : 0;
            const isRegistered = userRegistrations.some(r => r.eventId === event.id);
            const priceRange = getPriceRange(event);
            const earlyBird = getEarlyBirdInfo(event);
            const deadline = getDeadlineUrgency(event.registrationDeadline);
            const spotsLeft = totalCapacity - totalRegistered;
            const isAlmostFull = progress >= 80;

            return (
              <Link key={event.id} to={`/events/${event.slug}`} className="group">
                <Card className={`h-full transition-all hover:shadow-lg hover:border-primary/30 ${
                  earlyBird.isEarlyBird ? 'border-primary/20' : ''
                }`}>
                  <CardContent className="p-4 space-y-3">
                    {/* Header: Icon + Title + Price */}
                    <div className="flex items-start gap-3">
                      <div className="text-2xl shrink-0">{disciplineIcons[event.discipline]}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {event.name}
                        </h3>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
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
                        <span className="font-bold text-primary text-sm">{priceRange}</span>
                        {isRegistered && (
                          <Badge variant="default" className="block mt-1 text-xs">✓ Zapisany</Badge>
                        )}
                      </div>
                    </div>

                    {/* Badges row */}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-xs font-normal">
                        {disciplineLabels[event.discipline]}
                      </Badge>
                      {earlyBird.isEarlyBird && (
                        <Badge variant="default" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          Early Bird
                        </Badge>
                      )}
                      {event.discountCodes && event.discountCodes.length > 0 && (
                        <Badge variant="secondary" className="text-xs">Kody rabatowe</Badge>
                      )}
                    </div>

                    {/* Capacity progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          Zapisanych
                        </span>
                        <span className={`font-medium ${isAlmostFull ? 'text-destructive' : ''}`}>
                          {totalRegistered} / {totalCapacity}
                        </span>
                      </div>
                      <Progress 
                        value={progress} 
                        className={`h-1.5 ${isAlmostFull ? '[&>div]:bg-destructive' : ''}`}
                      />
                      {isAlmostFull && spotsLeft > 0 && (
                        <p className="text-xs text-destructive font-medium">
                          Tylko {spotsLeft} miejsc!
                        </p>
                      )}
                    </div>

                    {/* Deadline + Early bird info */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t">
                      <div className={`flex items-center gap-1 ${deadline.color}`}>
                        {deadline.urgent ? (
                          <Timer className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        <span className={deadline.urgent ? 'font-medium' : ''}>
                          Zapisy {deadline.text}
                        </span>
                      </div>
                      {earlyBird.isEarlyBird && earlyBird.daysLeft > 0 && (
                        <span className="text-primary font-medium">
                          {earlyBird.daysLeft}d do zmiany ceny
                        </span>
                      )}
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
              Zobacz wszystkie
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
