import { disciplineLabels } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Event, Registration } from '@/types';
import { Users, Calendar, MapPin, TrendingUp, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EventOverviewTabProps {
  event: Event;
  registrations: Registration[];
}

export const EventOverviewTab = ({ event, registrations }: EventOverviewTabProps) => {
  const statusLabels: Record<Event['status'], string> = {
    draft: 'Szkic',
    active: 'Aktywne',
    past: 'Przeszłe',
    archived: 'Zarchiwizowane',
    deleted: 'Usunięte',
  };
  const confirmedRegistrations = registrations.filter((r) => r.status === 'confirmed');
  const pendingRegistrations = registrations.filter((r) => r.status === 'pending');
  const eventPageUrl = event.status === 'draft' ? `/events/${event.slug}/preview` : `/events/${event.slug}`;
  const totalRevenue = confirmedRegistrations.reduce((acc, reg) => {
    const distance = event.distances.find((d) => d.id === reg.distanceId);
    return acc + (distance?.price || 0);
  }, 0);

  const registrationsByDistance = event.distances.map((d) => ({
    distance: d,
    count: registrations.filter((r) => r.distanceId === d.id).length,
    percentage: d.limit
      ? Math.round((registrations.filter((r) => r.distanceId === d.id).length / d.limit) * 100)
      : 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{confirmedRegistrations.length}</div>
                <div className="text-sm text-muted-foreground">Potwierdzonych</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-warning/10 p-3">
                <Users className="h-6 w-6 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingRegistrations.length}</div>
                <div className="text-sm text-muted-foreground">Oczekujących</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-success/10 p-3">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} PLN</div>
                <div className="text-sm text-muted-foreground">Przychód</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{event.date}</div>
                <div className="text-sm text-muted-foreground">Data wydarzenia</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informacje o wydarzeniu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge>{disciplineLabels[event.discipline]}</Badge>
              <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                {statusLabels[event.status]}
              </Badge>
              {event.featured && <Badge variant="outline">Wyróżnione</Badge>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {event.location}, {event.city}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Termin rejestracji: {event.registrationDeadline}</span>
              </div>
            </div>

            <p className="text-muted-foreground">{event.description}</p>

            <Button variant="outline" asChild>
              <Link to={eventPageUrl}>
                <ExternalLink className="mr-2 h-4 w-4" /> Zobacz stronę wydarzenia
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zapisy na dystanse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {registrationsByDistance.map(({ distance, count, percentage }) => (
                <div key={distance.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{distance.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {count} / {distance.limit || 'bez limitu'}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {distance.length} {distance.unit}
                    </span>
                    <span>{distance.price} PLN</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
