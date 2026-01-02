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
    if (daysLeft <= 7) return { urgent: true, text: `${daysLeft} dni do końca`, color: 'text-orange-500' };
    return { urgent: false, text: formatDistanceToNow(new Date(deadline), { addSuffix: true, locale: pl }), color: 'text-muted-foreground' };
  };

  return (
    <section className="py-12 md:py-20 bg-gradient-to-br from-primary/5 via-background to-primary/10 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-primary/15 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full">
                <Flame className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">Trwające zapisy</span>
              </div>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold">Zapisz się teraz!</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              Nie przegap okazji - zarejestruj się, zanim zabraknie miejsc lub ceny wzrosną!
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2 hidden sm:flex">
            <Link to="/events">
              Wszystkie wydarzenia
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <Card className={`h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 ${
                  earlyBird.isEarlyBird 
                    ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent' 
                    : 'border-transparent hover:border-primary/20'
                }`}>
                  {/* Event Image */}
                  <div className="relative h-40 overflow-hidden rounded-t-lg">
                    <img 
                      src={event.imageUrl} 
                      alt={event.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                    
                    {/* Badges overlay */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                        {disciplineIcons[event.discipline]} {disciplineLabels[event.discipline]}
                      </Badge>
                      {earlyBird.isEarlyBird && (
                        <Badge className="bg-primary text-primary-foreground animate-pulse">
                          <Tag className="h-3 w-3 mr-1" />
                          Early Bird
                        </Badge>
                      )}
                    </div>
                    
                    {isRegistered && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="default" className="bg-green-600 text-white">
                          ✓ Zapisany
                        </Badge>
                      </div>
                    )}
                    
                    {/* Price tag */}
                    <div className="absolute bottom-3 right-3">
                      <div className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <span className="font-bold text-primary">{priceRange}</span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-4">
                    {/* Event title */}
                    <div>
                      <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {event.name}
                      </h3>
                    </div>

                    {/* Event details */}
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-primary" />
                        {format(new Date(event.date), 'd MMM yyyy', { locale: pl })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" />
                        {event.city}
                      </span>
                    </div>

                    {/* Capacity progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          Zapisanych
                        </span>
                        <span className={`font-semibold ${isAlmostFull ? 'text-destructive' : ''}`}>
                          {totalRegistered.toLocaleString()} / {totalCapacity.toLocaleString()}
                        </span>
                      </div>
                      <Progress 
                        value={progress} 
                        className={`h-2 ${isAlmostFull ? '[&>div]:bg-destructive' : ''}`}
                      />
                      {isAlmostFull && spotsLeft > 0 && (
                        <p className="text-xs text-destructive font-medium">
                          Tylko {spotsLeft} wolnych miejsc!
                        </p>
                      )}
                    </div>

                    {/* Deadline info */}
                    <div className={`flex items-center gap-2 text-sm ${deadline.color}`}>
                      {deadline.urgent ? (
                        <Timer className="h-4 w-4 animate-pulse" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                      <span className={deadline.urgent ? 'font-semibold' : ''}>
                        Koniec zapisów {deadline.text}
                      </span>
                    </div>

                    {/* Early bird countdown */}
                    {earlyBird.isEarlyBird && earlyBird.daysLeft > 0 && (
                      <div className="bg-primary/10 rounded-lg p-3 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          <span className="font-semibold text-primary">
                            {earlyBird.daysLeft} {earlyBird.daysLeft === 1 ? 'dzień' : 'dni'}
                          </span>
                          {' '}do końca niższej ceny!
                        </span>
                      </div>
                    )}

                    {/* Features badges */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {event.discountCodes && event.discountCodes.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Kody rabatowe
                        </Badge>
                      )}
                      {event.enableMerchandiseInRegistration && (
                        <Badge variant="outline" className="text-xs">
                          Gadżety
                        </Badge>
                      )}
                      {event.distances.some(d => d.priceTiers && d.priceTiers.length > 1) && (
                        <Badge variant="outline" className="text-xs">
                          Progi cenowe
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/events">
              Zobacz wszystkie wydarzenia
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
