import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { mockEvents } from '@/api/mock/events.mock';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Users, TrendingUp, Plus, LayoutDashboard, CalendarDays, UserCog, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import OrganizerProfileTab from './components/OrganizerProfileTab';
import { ListContainer, ListRow } from '@/components/lists';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const myEvents = mockEvents.filter(e => e.organizerId === user?.id || user?.role === 'admin');
  const totalParticipants = myEvents.reduce((acc, e) => acc + e.distances.reduce((a, d) => a + d.registeredCount, 0), 0);

  const tabs = [
    { id: 'overview', label: 'Pulpit', icon: LayoutDashboard },
    { id: 'events', label: 'Moje wydarzenia', icon: CalendarDays },
  ];

  const getStatusBadge = (event: typeof myEvents[0]) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      published: { label: 'Aktywne', variant: 'default' },
      completed: { label: 'Zakończone', variant: 'secondary' },
      draft: { label: 'Szkic', variant: 'outline' },
      awaiting_approval: { label: 'Oczekuje', variant: 'outline' },
      rejected: { label: 'Odrzucone', variant: 'destructive' },
      cancelled: { label: 'Anulowane', variant: 'destructive' },
    };
    const config = statusConfig[event.status] || statusConfig.draft;
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Panel Organizatora</h1>
            <p className="text-muted-foreground">Zarządzaj swoimi wydarzeniami</p>
          </div>
          <Button asChild className="self-start sm:self-auto">
            <Link to="/organizer/events/new"><Plus className="mr-2 h-4 w-4" /> Nowe wydarzenie</Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full h-auto flex-wrap gap-1 bg-muted/50 p-1 sm:w-auto sm:inline-flex">
            {tabs.map(tab => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex-1 sm:flex-none gap-2 text-sm py-2.5 data-[state=active]:bg-background"
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-0 space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10"><Calendar className="h-6 w-6 text-primary" /></div>
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
                    <div className="p-3 rounded-full bg-primary/10"><Users className="h-6 w-6 text-primary" /></div>
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
                    <div className="p-3 rounded-full bg-primary/10"><TrendingUp className="h-6 w-6 text-primary" /></div>
                    <div>
                      <div className="text-2xl font-bold">{myEvents.filter(e => e.status === 'published').length}</div>
                      <div className="text-sm text-muted-foreground">Aktywnych</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Ostatnie wydarzenia</CardTitle></CardHeader>
              <CardContent className="p-0">
                <ListContainer>
                  {myEvents.slice(0, 5).map(event => (
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
                  ))}
                </ListContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="mt-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Wszystkie wydarzenia</CardTitle>
                  <Button asChild size="sm">
                    <Link to="/organizer/events/new"><Plus className="mr-2 h-4 w-4" /> Dodaj</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ListContainer>
                  {myEvents.map(event => {
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
                            <Link to={`/organizer/events/${event.id}`}>Zarządzaj</Link>
                          </Button>
                        }
                      />
                    );
                  })}
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
