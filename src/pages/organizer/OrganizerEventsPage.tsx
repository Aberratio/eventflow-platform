import { getEventsByOrganizer, getOrganizerEventLimit } from '@/api';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Plus, Calendar, MapPin, Users, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { Event } from '@/types';

type StatusFilter = 'all' | 'active' | 'draft' | 'past' | 'archived';

const statusLabels: Record<StatusFilter, string> = {
  all: 'Wszystkie',
  active: 'Aktywne',
  draft: 'Szkice',
  past: 'Przeszłe',
  archived: 'Archiwum',
};

const getStatusBadge = (status: Event['status']) => {
  switch (status) {
    case 'active':
      return <Badge variant="default">Aktywne</Badge>;
    case 'draft':
      return <Badge variant="secondary">Szkic</Badge>;
    case 'awaiting_approval':
      return <Badge variant="outline">Do sprawdzenia</Badge>;
    case 'approved':
      return <Badge variant="secondary">Zatwierdzone</Badge>;
    case 'past':
      return <Badge variant="secondary">Przeszłe</Badge>;
    case 'archived':
      return <Badge variant="outline">Zarchiwizowane</Badge>;
    case 'deleted':
      return <Badge variant="destructive">Usunięte</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const OrganizerEventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data: eventsResponse } = useQuery({
    queryKey: ['organizer-events', user?.id],
    queryFn: () => getEventsByOrganizer(user?.id || ''),
    enabled: Boolean(user?.id),
  });

  const { data: eventLimitResponse } = useQuery({
    queryKey: ['organizer-event-limit', user?.id],
    queryFn: () => getOrganizerEventLimit(user?.id || ''),
    enabled: Boolean(user?.id),
  });

  const myEvents = (eventsResponse?.data ?? []).filter((event) => event.status !== 'deleted');
  const filteredEvents =
    statusFilter === 'all' ? myEvents : myEvents.filter((event) => event.status === statusFilter);
  const eventLimit = eventLimitResponse?.data;
  const canCreateEvent = !eventLimit || eventLimit.available > 0;

  const getParticipantCount = (event: Event) =>
    event.distances.reduce((sum, d) => sum + d.registeredCount, 0);

  return (
    <Layout>
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Powrót do panelu
        </Button>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Moje wydarzenia</h1>
          <Button onClick={() => navigate('/organizer/events/new')} disabled={!canCreateEvent}>
            <Plus className="mr-2 h-4 w-4" />{' '}
            {canCreateEvent ? 'Nowe wydarzenie' : 'Limit wyczerpany'}
          </Button>
        </div>

        {eventLimit && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">
                  Limit wydarzeń: wykorzystano {eventLimit.used} z {eventLimit.limit}
                </p>
                <p className="text-sm text-muted-foreground">
                  Do limitu liczą się szkice, aktywne, przeszłe i zarchiwizowane wydarzenia.
                  Usunięte szkice bez zapisów nie są liczone.
                </p>
              </div>
              <Badge variant={canCreateEvent ? 'secondary' : 'destructive'}>
                {canCreateEvent ? `${eventLimit.available} dostępne` : 'Brak wolnych miejsc'}
              </Badge>
            </CardContent>
          </Card>
        )}

        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          className="mb-6"
        >
          <TabsList>
            {Object.entries(statusLabels).map(([key, label]) => (
              <TabsTrigger key={key} value={key}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="font-medium">Brak wydarzeń</p>
              <p className="mt-1 text-sm">
                {statusFilter === 'all'
                  ? 'Nie masz jeszcze żadnych wydarzeń. Utwórz pierwsze.'
                  : `Brak wydarzeń w kategorii "${statusLabels[statusFilter]}"`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event) => {
              const participantCount = getParticipantCount(event);
              return (
                <Card key={event.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold">{event.name}</h3>
                        {getStatusBadge(event.status)}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(event.date), 'd MMM yyyy', { locale: pl })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {participantCount} uczestników
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/organizer/events/${event.id}/overview`)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Zarządzaj
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrganizerEventsPage;
