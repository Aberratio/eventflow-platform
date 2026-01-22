import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Globe } from 'lucide-react';
import { Event, Registration, Result } from '@/types';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface EventCardProps {
  event: Event;
  userRegistrations?: Registration[];
  userResults?: Result[];
}

export const EventCard = ({ event, userRegistrations = [], userResults = [] }: EventCardProps) => {
  const userRegistration = userRegistrations.find(r => r.eventId === event.id);
  const userResult = userResults.find(r => r.eventId === event.id);
  
  const totalParticipants = event.distances.reduce((sum, d) => sum + d.registeredCount, 0);

  const getUserStatus = () => {
    if (userResult && userResult.status === 'finished') return 'completed';
    if (userRegistration?.status === 'confirmed') return 'registered';
    return null;
  };

  const userStatus = getUserStatus();

  return (
    <Link to={`/events/${event.slug}`} className="block group">
      <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded bg-muted shrink-0 transition-colors group-hover:bg-primary/10">
              <DisciplineIcon discipline={event.discipline} size="md" className="transition-colors group-hover:text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-sm line-clamp-2 leading-tight transition-colors group-hover:text-primary">{event.name}</h3>
                  {event.isVirtual && (
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                      <Globe className="h-3 w-3 mr-1" />
                      Wirtualny
                    </Badge>
                  )}
                </div>
                {userStatus && (
                  <Badge 
                    variant={userStatus === 'registered' ? 'default' : 'secondary'}
                    className="shrink-0 text-xs"
                  >
                    {userStatus === 'registered' ? 'Zapisany' : 'Ukończony'}
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {event.isVirtual && event.startDate && event.endDate 
                    ? `${format(new Date(event.startDate), 'd MMM', { locale: pl })} - ${format(new Date(event.endDate), 'd MMM yyyy', { locale: pl })}`
                    : format(new Date(event.date), 'd MMMM yyyy', { locale: pl })
                  }
                </span>
                <span className="flex items-center gap-1.5">
                  {event.isVirtual ? (
                    <>
                      <Globe className="h-3 w-3" />
                      Cały świat
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3 w-3" />
                      {event.city}
                    </>
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-3 w-3" />
                  {totalParticipants.toLocaleString()} uczestników
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
