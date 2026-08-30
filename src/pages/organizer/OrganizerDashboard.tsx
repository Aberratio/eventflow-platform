import { getEventsByOrganizer, getOrganizerEventLimit } from '@/api';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { useAuth } from '@/contexts/AuthContext';
import type { Event, OrganizerEventLimit } from '@/types';
import {
  Calendar,
  Users,
  TrendingUp,
  Plus,
  LayoutDashboard,
  CalendarDays,
  Archive,
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ListContainer, ListRow } from '@/components/lists';

const EMPTY_EVENT_LIMIT: OrganizerEventLimit = {
  limit: 0,
  used: 0,
  available: 0,
};

const statusConfig: Record<
  Event['publicationStatus'],
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  published: { label: 'Aktywne', variant: 'default' },
  finished: { label: 'Zakończone', variant: 'secondary' },
  cancelled: { label: 'Odwołane', variant: 'destructive' },
  archived: { label: 'Zarchiwizowane', variant: 'outline' },
  draft: { label: 'Szkic', variant: 'outline' },
  submitted: { label: 'Do sprawdzenia', variant: 'outline' },
  rejected: { label: 'Odrzucone', variant: 'destructive' },
  deleted: { label: 'Usunięte', variant: 'destructive' },
};

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

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

  const myEvents = eventsResponse?.data ?? [];
  const eventLimit = eventLimitResponse?.data ?? EMPTY_EVENT_LIMIT;
  const visibleEvents = myEvents.filter(
    (event) => event.publicationStatus !== 'archived' && event.publicationStatus !== 'deleted',
  );
  const archivedEvents = myEvents.filter((event) => event.publicationStatus === 'archived');
  const totalParticipants = myEvents.reduce(
    (acc, e) => acc + e.distances.reduce((a, d) => a + d.registeredCount, 0),
    0,
  );
  const canCreateEvent = eventLimit.available > 0;

  const tabs = [
    { id: 'overview', label: 'Pulpit', icon: LayoutDashboard },
    { id: 'events', label: 'Moje wydarzenia', icon: CalendarDays },
    { id: 'archive', label: 'Archiwum', icon: Archive },
  ];

  const getStatusBadge = (event: Event) => {
    const config = statusConfig[event.publicationStatus] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const renderEventList = (events: Event[], emptyText: string) => (
    <ListContainer>
      {events.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">{emptyText}</div>
      ) : (
        events.map((event) => {
          const participantCount = event.distances.reduce((a, d) => a + d.registeredCount, 0);
          return (
            <ListRow
              key={event.id}
              icon={<DisciplineIcon discipline={event.discipline} />}
              title={event.name}
              subtitle={`${event.city} • ${format(new Date(event.date), 'd MMM yyyy', { locale: pl })} • ${participantCount} uczestników`}
              badge={getStatusBadge(event)}
              action={
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/organizer/events/${event.id}/overview`}>Zarządzaj</Link>
                </Button>
              }
            />
          );
        })
      )}
    </ListContainer>
  );

  const createButton = canCreateEvent ? (
    <Button asChild className="self-start sm:self-auto">
      <Link to="/organizer/events/new">
        <Plus className="mr-2 h-4 w-4" /> Nowe wydarzenie
      </Link>
    </Button>
  ) : (
    <Button disabled className="self-start sm:self-auto">
      <Plus className="mr-2 h-4 w-4" /> Limit wyczerpany
    </Button>
  );

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Panel Organizatora</h1>
            <p className="text-muted-foreground">Zarządzaj swoimi wydarzeniami</p>
          </div>
          {createButton}
        </div>

        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Limit wydarzeń</p>
              <p className="text-lg font-semibold">
                Wykorzystano {eventLimit.used} z {eventLimit.limit} wydarzeń. Dostępne:{' '}
                {eventLimit.available}.
              </p>
              <p className="text-sm text-muted-foreground">
                Do limitu liczą się wszystkie wydarzenia poza usuniętymi, również szkice i archiwum.
              </p>
            </div>
            <Badge variant={canCreateEvent ? 'secondary' : 'destructive'} className="self-start">
              {canCreateEvent ? `${eventLimit.available} dostępne` : 'Brak wolnych miejsc'}
            </Badge>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="h-auto w-full flex-wrap gap-1 bg-muted/50 p-1 sm:inline-flex sm:w-auto">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-1 gap-2 py-2.5 text-sm data-[state=active]:bg-background sm:flex-none"
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-0 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{visibleEvents.length}</div>
                      <div className="text-sm text-muted-foreground">Wydarzeń w panelu</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{totalParticipants.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Łącznie uczestników</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {myEvents.filter((e) => e.publicationStatus === 'published').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Aktywnych</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Ostatnie wydarzenia</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {renderEventList(
                  visibleEvents.slice(0, 5),
                  'Nie masz jeszcze żadnych wydarzeń w panelu.',
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Wszystkie wydarzenia</CardTitle>
                  {createButton}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {renderEventList(
                  visibleEvents,
                  canCreateEvent
                    ? 'Nie masz jeszcze żadnych wydarzeń. Utwórz pierwsze z przycisku Dodaj.'
                    : 'Nie masz wydarzeń w głównym panelu.',
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archive" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Archiwum wydarzeń</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {renderEventList(archivedEvents, 'Archiwum jest puste.')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default OrganizerDashboard;
