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
  const userRegistration = userRegistrations.find((r) => r.eventId === event.id);
  const userResult = userResults.find((r) => r.eventId === event.id);

  const totalParticipants = event.distances.reduce((sum, d) => sum + d.registeredCount, 0);

  const getUserStatus = () => {
    if (userResult && userResult.status === 'finished') return 'completed';
    if (userRegistration?.status === 'confirmed') return 'registered';
    return null;
  };

  const userStatus = getUserStatus();

  return (
    <Link to={`/events/${event.slug}`} className="group block">
      <Card className="h-full transition-all duration-200 hover:border-[hsl(var(--border-active))]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded bg-muted p-1.5">
              <DisciplineIcon
                discipline={event.discipline}
                size="md"
                className="text-muted-foreground"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="line-clamp-2 text-sm font-medium leading-tight transition-colors group-hover:text-foreground">
                    {event.name}
                  </h3>
                  {event.isVirtual && (
                    <Badge variant="outline" className="text-xs">
                      <Globe className="mr-1 h-3 w-3" />
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
                    : format(new Date(event.date), 'd MMMM yyyy', { locale: pl })}
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
