import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Registration, Result, PersonalRecord, Message } from '@/types';
import { Calendar, Trophy, Medal, Mail, MapPin, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { pl } from 'date-fns/locale';
import { mockEvents } from '@/data/mockData';

interface ParticipantOverviewTabProps {
  upcomingRegistrations: Registration[];
  results: Result[];
  personalRecords: PersonalRecord[];
  unreadMessages: Message[];
}

const ParticipantOverviewTab = ({
  upcomingRegistrations,
  results,
  personalRecords,
  unreadMessages,
}: ParticipantOverviewTabProps) => {
  // Find the nearest upcoming event
  const nearestRegistration = upcomingRegistrations
    .map(reg => {
      const event = mockEvents.find(e => e.id === reg.eventId);
      return { ...reg, event };
    })
    .filter(reg => reg.event && new Date(reg.event.date) > new Date())
    .sort((a, b) => new Date(a.event!.date).getTime() - new Date(b.event!.date).getTime())[0];

  const daysUntilNext = nearestRegistration?.event 
    ? differenceInDays(new Date(nearestRegistration.event.date), new Date())
    : null;

  const stats = [
    { label: 'Nadchodzące starty', value: upcomingRegistrations.length, icon: Calendar, color: 'text-primary' },
    { label: 'Ukończone zawody', value: results.length, icon: Trophy, color: 'text-primary' },
    { label: 'Rekordy osobiste', value: personalRecords.length, icon: Medal, color: 'text-primary' },
    { label: 'Nowe wiadomości', value: unreadMessages.length, icon: Mail, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-full bg-primary/10 shrink-0">
                  <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nearest Event Highlight */}
      {nearestRegistration && nearestRegistration.event && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              {/* Event Image */}
              <div className="w-full sm:w-32 h-32 sm:h-24 rounded-lg overflow-hidden shrink-0">
                <img 
                  src={nearestRegistration.event.imageUrl} 
                  alt={nearestRegistration.event.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Event Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Najbliższy start</p>
                    <h3 className="text-lg sm:text-xl font-bold truncate">{nearestRegistration.event.name}</h3>
                  </div>
                  {daysUntilNext !== null && (
                    <Badge variant="secondary" className="shrink-0 text-sm">
                      za {daysUntilNext} dni
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(nearestRegistration.event.date), 'd MMMM yyyy', { locale: pl })}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {nearestRegistration.event.city}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <Badge variant="outline">{nearestRegistration.distanceName}</Badge>
                  <Badge variant="outline">{nearestRegistration.category}</Badge>
                  {nearestRegistration.bibNumber && (
                    <span className="font-mono font-bold text-primary">#{nearestRegistration.bibNumber}</span>
                  )}
                </div>
              </div>
              
              {/* CTA */}
              <div className="sm:shrink-0 pt-2 sm:pt-0">
                <Button asChild className="w-full sm:w-auto">
                  <Link to={`/events/${nearestRegistration.event.slug}`}>Szczegóły</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" asChild className="flex-1">
          <Link to="/events">
            <Calendar className="mr-2 h-4 w-4" />
            Znajdź zawody
          </Link>
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link to="/results">
            <Trophy className="mr-2 h-4 w-4" />
            Przeglądaj wyniki
          </Link>
        </Button>
      </div>

      {/* No events message */}
      {upcomingRegistrations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold mb-2">Nie masz jeszcze zapisów</h3>
            <p className="text-muted-foreground mb-4">Znajdź swoje pierwsze zawody i zapisz się!</p>
            <Button asChild>
              <Link to="/events">Przeglądaj wydarzenia</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ParticipantOverviewTab;
