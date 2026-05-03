import { getEventsByOrganizer, getOrganizerEventCredits, mockShopProducts } from '@/api';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import type { EventCreditKind, OrganizerEventCredits } from '@/types';
import {
  Calendar,
  Users,
  TrendingUp,
  Plus,
  LayoutDashboard,
  CalendarDays,
  Globe2,
  Timer,
  ShoppingCart,
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ListContainer, ListRow } from '@/components/lists';

const EMPTY_EVENT_CREDITS: OrganizerEventCredits = {
  total: 0,
  used: 0,
  available: 0,
  byType: {
    standard: { total: 0, used: 0, available: 0 },
    virtual: { total: 0, used: 0, available: 0 },
    timing: { total: 0, used: 0, available: 0 },
  },
};

const creditKinds: Array<{
  kind: EventCreditKind;
  title: string;
  description: string;
  icon: typeof CalendarDays;
}> = [
  {
    kind: 'standard',
    title: 'Wydarzenia zwykłe',
    description: 'Standardowe wydarzenia z zapisami i obsługą wyników.',
    icon: CalendarDays,
  },
  {
    kind: 'virtual',
    title: 'Wydarzenia wirtualne',
    description: 'Wydarzenia z oknem aktywności i zgłaszaniem rezultatów online.',
    icon: Globe2,
  },
  {
    kind: 'timing',
    title: 'Pomiar czasu',
    description: 'Wydarzenia wymagające pakietu profesjonalnego pomiaru czasu.',
    icon: Timer,
  },
];

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const { data: eventsResponse } = useQuery({
    queryKey: ['organizer-events', user?.id],
    queryFn: () => getEventsByOrganizer(user?.id || ''),
    enabled: Boolean(user?.id),
  });
  const myEvents = eventsResponse?.data ?? [];
  const { data: eventCreditsResponse } = useQuery({
    queryKey: ['organizer-event-credits', user?.id],
    queryFn: () => getOrganizerEventCredits(user?.id || ''),
    enabled: Boolean(user?.id),
  });
  const eventCredits = eventCreditsResponse?.data ?? EMPTY_EVENT_CREDITS;
  const creditProducts = Object.fromEntries(
    mockShopProducts
      .filter((product) => product.serviceKind === 'event_credit' && product.eventCreditKind)
      .map((product) => [product.eventCreditKind, product]),
  ) as Partial<Record<EventCreditKind, (typeof mockShopProducts)[number]>>;
  const totalParticipants = myEvents.reduce(
    (acc, e) => acc + e.distances.reduce((a, d) => a + d.registeredCount, 0),
    0,
  );

  const tabs = [
    { id: 'overview', label: 'Pulpit', icon: LayoutDashboard },
    { id: 'events', label: 'Moje wydarzenia', icon: CalendarDays },
  ];

  const getStatusBadge = (event: (typeof myEvents)[0]) => {
    const statusConfig: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
      published: { label: 'Aktywne', variant: 'default' },
      completed: { label: 'Zakończone', variant: 'secondary' },
      draft: { label: 'Szkic', variant: 'outline' },
      awaiting_approval: { label: 'Oczekuje', variant: 'outline' },
      rejected: { label: 'Odrzucone', variant: 'destructive' },
      cancelled: { label: 'Anulowane', variant: 'destructive' },
    };
    const config = statusConfig[event.status] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const handleBuyCredit = (kind: EventCreditKind) => {
    const product = creditProducts[kind];
    if (!product) return;
    addItem({ productId: product.id, quantity: 1 });
    navigate('/cart');
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Panel Organizatora</h1>
            <p className="text-muted-foreground">Zarządzaj swoimi wydarzeniami</p>
          </div>
          <Button asChild className="self-start sm:self-auto">
            <Link to="/organizer/events/new">
              <Plus className="mr-2 h-4 w-4" /> Nowe wydarzenie
            </Link>
          </Button>
        </div>

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
                      <div className="text-2xl font-bold">{myEvents.length}</div>
                      <div className="text-sm text-muted-foreground">Wydarzeń</div>
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
                        {myEvents.filter((e) => e.status === 'published').length}
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
                <ListContainer>
                  {myEvents.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      Nie masz jeszcze żadnych wydarzeń.
                    </div>
                  ) : (
                    myEvents.slice(0, 5).map((event) => (
                      <ListRow
                        key={event.id}
                        icon={<DisciplineIcon discipline={event.discipline} />}
                        title={event.name}
                        subtitle={`${event.city} • ${format(new Date(event.date), 'd MMM yyyy', { locale: pl })}`}
                        badge={getStatusBadge(event)}
                        action={
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/organizer/events/${event.id}`}>Zarządzaj</Link>
                          </Button>
                        }
                      />
                    ))
                  )}
                </ListContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Limity wydarzeń</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Możesz jeszcze utworzyć {eventCredits.available} wydarzeń z wykupionych
                      pakietów.
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/shop">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Sklep
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  {creditKinds.map(({ kind, title, description, icon: Icon }) => {
                    const credit = eventCredits.byType[kind];
                    const product = creditProducts[kind];
                    const isEmpty = credit.available <= 0;

                    return (
                      <div
                        key={kind}
                        className={`rounded-lg border p-4 ${isEmpty ? 'border-destructive/25 bg-destructive/5' : 'bg-muted/20'}`}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="rounded-md bg-primary/10 p-2 text-primary">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{title}</h3>
                              {product && (
                                <p className="text-sm font-medium text-muted-foreground">
                                  {product.price} zł / wydarzenie
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant={isEmpty ? 'destructive' : 'secondary'}>
                            {credit.available} dostępne
                          </Badge>
                        </div>
                        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
                        <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded-md bg-background p-2">
                            <span className="block text-muted-foreground">Wykupione</span>
                            <span className="font-semibold">{credit.total}</span>
                          </div>
                          <div className="rounded-md bg-background p-2">
                            <span className="block text-muted-foreground">Wykorzystane</span>
                            <span className="font-semibold">{credit.used}</span>
                          </div>
                        </div>
                        <Button
                          variant={isEmpty ? 'default' : 'outline'}
                          size="sm"
                          className="w-full"
                          onClick={() => handleBuyCredit(kind)}
                          disabled={!product}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          {isEmpty ? 'Wykup pakiet' : 'Dokup pakiet'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Wszystkie wydarzenia</CardTitle>
                  <Button asChild size="sm">
                    <Link to="/organizer/events/new">
                      <Plus className="mr-2 h-4 w-4" /> Dodaj
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ListContainer>
                  {myEvents.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      Nie masz jeszcze żadnych wydarzeń. Utwórz pierwsze z przycisku Dodaj.
                    </div>
                  ) : (
                    myEvents.map((event) => {
                      const participantCount = event.distances.reduce(
                        (a, d) => a + d.registeredCount,
                        0,
                      );
                      return (
                        <ListRow
                          key={event.id}
                          icon={<DisciplineIcon discipline={event.discipline} />}
                          title={event.name}
                          subtitle={`${event.city} • ${format(new Date(event.date), 'd MMM yyyy', { locale: pl })} • ${participantCount} uczestników`}
                          badge={getStatusBadge(event)}
                          action={
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/organizer/events/${event.id}`}>Zarządzaj</Link>
                            </Button>
                          }
                        />
                      );
                    })
                  )}
                </ListContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default OrganizerDashboard;
