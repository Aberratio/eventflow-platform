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

  // Compact variant - simple row
  if (variant === 'compact') {
    return (
      <Link to={`/events/${event.slug}`}>
        <Card className="hover:shadow-md hover:border-primary/30 transition-all">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl shrink-0">{disciplineIcons[event.discipline]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-medium text-sm line-clamp-2">{event.name}</h3>
                  {userStatus && (
                    <Badge variant={statusVariants[userStatus]} className="shrink-0 text-xs">
                      {statusLabels[userStatus]}
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
  }

  // Default variant - clean card without image
  return (
    <Link to={`/events/${event.slug}`}>
      <Card className="h-full hover:shadow-md hover:border-primary/30 transition-all">
        <CardContent className="p-4 flex flex-col h-full">
          {/* Header with icon and badges */}
          <div className="flex items-start gap-3 mb-3">
            <div className="text-3xl shrink-0">{disciplineIcons[event.discipline]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-1">
                <Badge variant="outline" className="text-xs font-normal">
                  {disciplineLabels[event.discipline]}
                </Badge>
                {userStatus && (
                  <Badge 
                    variant={statusVariants[userStatus]}
                    className={`text-xs ${userStatus === 'completed' ? 'bg-amber-500 hover:bg-amber-600 text-white border-0' : ''}`}
                  >
                    {statusLabels[userStatus]}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Title */}
          <h3 className="font-semibold mb-2 line-clamp-2">{event.name}</h3>
          
          {/* Details */}
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
          
          {/* Registration progress */}
          {isRegistrationOpen && (
            <div className="mt-auto pt-3 border-t">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  Zapisy
                </span>
                <span className="font-medium">{totalRegistered} / {totalCapacity}</span>
              </div>
              <Progress value={registrationProgress} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
