import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Event, Registration, Result } from '@/types';
import { disciplineLabels, disciplineIcons } from '@/data/mockData';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface EventCardProps {
  event: Event;
  userRegistrations?: Registration[];
  userResults?: Result[];
  variant?: 'default' | 'compact' | 'featured';
}

const statusLabels: Record<string, string> = {
  registered: 'Zapisany',
  completed: 'Ukończony',
  pending: 'Oczekuje',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  registered: 'default',
  completed: 'secondary',
  pending: 'outline',
};

export const EventCard = ({ event, userRegistrations = [], userResults = [], variant = 'default' }: EventCardProps) => {
  const userRegistration = userRegistrations.find(r => r.eventId === event.id);
  const userResult = userResults.find(r => r.eventId === event.id);
  
  const totalCapacity = event.distances.reduce((sum, d) => sum + (d.limit || 0), 0);
  const totalRegistered = event.distances.reduce((sum, d) => sum + d.registeredCount, 0);
  const registrationProgress = totalCapacity > 0 ? (totalRegistered / totalCapacity) * 100 : 0;
  
  const isRegistrationOpen = new Date(event.registrationDeadline) > new Date() && event.status === 'published';

  const getUserStatus = () => {
    if (userResult && userResult.status === 'finished') return 'completed';
    if (userRegistration?.status === 'confirmed') return 'registered';
    if (userRegistration?.status === 'pending') return 'pending';
    return null;
  };

  const userStatus = getUserStatus();

  if (variant === 'compact') {
    return (
      <Link to={`/events/${event.id}`}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{disciplineIcons[event.discipline]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{event.name}</h3>
                  {userStatus && (
                    <Badge variant={statusVariants[userStatus]} className="shrink-0 text-xs">
                      {statusLabels[userStatus]}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
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
  }

  return (
    <Link to={`/events/${event.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
        <div className="relative h-40 bg-muted">
          {event.imageUrl ? (
            <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              {disciplineIcons[event.discipline]}
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1">
            <Badge variant="secondary">{disciplineLabels[event.discipline]}</Badge>
          </div>
          {userStatus && (
            <div className="absolute top-2 right-2">
              <Badge 
                variant={statusVariants[userStatus]}
                className={userStatus === 'completed' ? 'bg-amber-500 hover:bg-amber-600 text-white border-0' : ''}
              >
                {statusLabels[userStatus]}
              </Badge>
            </div>
          )}
          {event.featured && !userStatus && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-primary">Wyróżnione</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{event.name}</h3>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(event.date), 'd MMMM yyyy', { locale: pl })}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {event.city}
            </span>
          </div>
          
          {isRegistrationOpen && (
            <div className="mt-auto">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  Zapisy
                </span>
                <span className="font-medium">{totalRegistered}/{totalCapacity}</span>
              </div>
              <Progress value={registrationProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
