import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Registration, Result, PersonalRecord, Message } from '@/types';
import { Calendar, Trophy, Medal, Mail, MapPin, Clock, ArrowRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { pl } from 'date-fns/locale';
import { mockEvents } from '@/api/mock/events.mock';

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
    { label: 'Nadchodzące starty', value: upcomingRegistrations.length, icon: Calendar, gradient: 'from-primary/10 to-primary/5' },
    { label: 'Ukończone zawody', value: results.length, icon: Trophy, gradient: 'from-warning/10 to-warning/5' },
    { label: 'Rekordy osobiste', value: personalRecords.length, icon: Medal, gradient: 'from-primary/10 to-warning/5' },
    { label: 'Nowe wiadomości', value: unreadMessages.length, icon: Mail, gradient: 'from-muted to-muted/50' },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border/50 overflow-hidden">
            <CardContent className="pt-4 sm:pt-5 pb-4 relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
              <div className="relative flex items-center gap-2.5 sm:gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl bg-background/80 shadow-sm shrink-0">
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground truncate">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nearest Event Highlight */}
      {nearestRegistration && nearestRegistration.event && (
        <Card className="border-primary/20 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-warning to-primary" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              {/* Event Image */}
              <div className="w-full sm:w-36 h-36 sm:h-28 rounded-xl overflow-hidden shrink-0 shadow-sm">
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
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-medium">Najbliższy start</p>
                    <h3 className="text-lg sm:text-xl font-bold truncate">{nearestRegistration.event.name}</h3>
                  </div>
                  {daysUntilNext !== null && (
                    <Badge className="shrink-0 text-sm bg-primary/10 text-primary border-0">
                      za {daysUntilNext} dni
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(nearestRegistration.event.date), 'd MMMM yyyy', { locale: pl })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {nearestRegistration.event.city}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">{nearestRegistration.distanceName}</Badge>
                  <Badge variant="outline" className="text-xs">{nearestRegistration.category}</Badge>
                  {nearestRegistration.bibNumber && (
                    <span className="font-mono font-bold text-primary text-sm">#{nearestRegistration.bibNumber}</span>
                  )}
                </div>
              </div>
              
              {/* CTA */}
              <div className="sm:shrink-0 pt-2 sm:pt-0">
                <Button asChild className="w-full sm:w-auto gap-2">
                  <Link to={`/events/${nearestRegistration.event.slug}`}>
                    Szczegóły
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2 sm:flex-row sm:gap-2 sm:py-3">
          <Link to="/events">
            <Calendar className="h-5 w-5 sm:h-4 sm:w-4 text-primary" />
            <span className="text-xs sm:text-sm">Znajdź zawody</span>
          </Link>
        </Button>
        <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2 sm:flex-row sm:gap-2 sm:py-3">
          <Link to="/results">
            <Trophy className="h-5 w-5 sm:h-4 sm:w-4 text-primary" />
            <span className="text-xs sm:text-sm">Przeglądaj wyniki</span>
          </Link>
        </Button>
      </div>

      {/* No events message */}
      {upcomingRegistrations.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 sm:py-12 text-center">
            <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
              <Calendar className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold mb-2">Nie masz jeszcze zapisów</h3>
            <p className="text-muted-foreground mb-4 text-sm">Znajdź swoje pierwsze zawody i zapisz się!</p>
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
