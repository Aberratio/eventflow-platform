import { getAllEventsPaged } from '@/api/fetchAllPages';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GradientDivider } from '@/components/ui/gradient-divider';
import { Registration, Result, PersonalRecord } from '@/types';
import { Calendar, Trophy, Medal, MapPin, Clock, ArrowRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ParticipantOverviewTabProps {
  upcomingRegistrations: Registration[];
  results: Result[];
  personalRecords: PersonalRecord[];
}

const ParticipantOverviewTab = ({
  upcomingRegistrations,
  results,
  personalRecords,
}: ParticipantOverviewTabProps) => {
  const { data: eventsResponse } = useQuery({
    queryKey: ['events', 'participant-overview'],
    queryFn: () => getAllEventsPaged({ includeUnpublished: true, includePrivate: true }),
  });
  const events = eventsResponse?.data ?? [];

  // Find the nearest upcoming event
  const nearestRegistration = upcomingRegistrations
    .map((reg) => {
      const event = events.find((e) => e.id === reg.eventId);
      return { ...reg, event };
    })
    .filter((reg) => reg.event && new Date(reg.event.date) > new Date())
    .sort((a, b) => new Date(a.event!.date).getTime() - new Date(b.event!.date).getTime())[0];

  const daysUntilNext = nearestRegistration?.event
    ? differenceInDays(new Date(nearestRegistration.event.date), new Date())
    : null;

  const stats = [
    {
      label: 'Nadchodzące starty',
      value: upcomingRegistrations.length,
      icon: Calendar,
      gradient: 'from-primary/10 to-primary/5',
    },
    {
      label: 'Ukończone zawody',
      value: results.length,
      icon: Trophy,
      gradient: 'from-warning/10 to-warning/5',
    },
    {
      label: 'Rekordy osobiste',
      value: personalRecords.length,
      icon: Medal,
      gradient: 'from-primary/10 to-warning/5',
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden border-border/50">
            <CardContent className="relative pb-4 pt-4 sm:pt-5">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
              <div className="relative flex items-center gap-2.5 sm:gap-3">
                <div className="shrink-0 rounded-xl bg-background/80 p-2 shadow-sm sm:p-2.5">
                  <stat.icon className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-bold sm:text-2xl">{stat.value}</div>
                  <div className="truncate text-[11px] text-muted-foreground sm:text-xs">
                    {stat.label}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nearest Event Highlight */}
      {nearestRegistration && nearestRegistration.event && (
        <Card className="overflow-hidden border-primary/20">
          <GradientDivider />
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              {/* Event Image */}
              <div className="h-36 w-full shrink-0 overflow-hidden rounded-xl shadow-sm sm:h-28 sm:w-36">
                <img
                  src={nearestRegistration.event.imageUrl}
                  alt={nearestRegistration.event.name}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Event Details */}
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Najbliższy start
                    </p>
                    <h3 className="truncate text-lg font-bold sm:text-xl">
                      {nearestRegistration.event.name}
                    </h3>
                  </div>
                  {daysUntilNext !== null && (
                    <Badge className="shrink-0 border-0 bg-primary/10 text-sm text-primary">
                      za {daysUntilNext} dni
                    </Badge>
                  )}
                </div>

                <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(nearestRegistration.event.date), 'd MMMM yyyy', {
                      locale: pl,
                    })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {nearestRegistration.event.city}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {nearestRegistration.distanceName}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {nearestRegistration.category}
                  </Badge>
                  {nearestRegistration.bibNumber && (
                    <span className="font-mono text-sm font-bold text-primary">
                      #{nearestRegistration.bibNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="pt-2 sm:shrink-0 sm:pt-0">
                <Button asChild className="w-full gap-2 sm:w-auto">
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
        <Button
          variant="outline"
          asChild
          className="h-auto flex-col gap-2 py-4 sm:flex-row sm:gap-2 sm:py-3"
        >
          <Link to="/events">
            <Calendar className="h-5 w-5 text-primary sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Znajdź zawody</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          asChild
          className="h-auto flex-col gap-2 py-4 sm:flex-row sm:gap-2 sm:py-3"
        >
          <Link to="/events?status=past">
            <Trophy className="h-5 w-5 text-primary sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Przeglądaj wyniki</span>
          </Link>
        </Button>
      </div>

      {/* No events message */}
      {upcomingRegistrations.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center sm:py-12">
            <div className="mx-auto mb-4 w-fit rounded-full bg-muted/50 p-4">
              <Calendar className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="mb-2 font-semibold">Nie masz jeszcze zapisów</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Znajdź swoje pierwsze zawody i zapisz się!
            </p>
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
