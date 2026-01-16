import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockEvents } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Users, TrendingUp, Plus, LayoutDashboard, CalendarDays, UserCog } from 'lucide-react';
import OrganizerProfileTab from './components/OrganizerProfileTab';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const myEvents = mockEvents.filter(e => e.organizerId === user?.id || user?.role === 'admin');
  const totalParticipants = myEvents.reduce((acc, e) => acc + e.distances.reduce((a, d) => a + d.registeredCount, 0), 0);

  const tabs = [
    { id: 'overview', label: 'Pulpit', icon: LayoutDashboard },
    { id: 'events', label: 'Moje wydarzenia', icon: CalendarDays },
    { id: 'profile', label: 'Profil', icon: UserCog },
  ];

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Panel Organizatora</h1>
            <p className="text-muted-foreground">Zarządzaj swoimi wydarzeniami</p>
          </div>
          <Button asChild>
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
              <CardContent>
                <div className="space-y-4">
                  {myEvents.slice(0, 5).map(event => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{event.name}</div>
                        <div className="text-sm text-muted-foreground">{event.city} • {event.date}</div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/organizer/events/${event.id}`}>Zarządzaj</Link>
                      </Button>
                    </div>
                  ))}
                </div>
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
              <CardContent>
                <div className="space-y-4">
                  {myEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{event.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.city} • {event.date} • {event.distances.reduce((a, d) => a + d.registeredCount, 0)} uczestników
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          event.status === 'published' ? 'bg-primary/10 text-primary' :
                          event.status === 'completed' ? 'bg-muted text-muted-foreground' :
                          event.status === 'draft' ? 'bg-yellow-500/10 text-yellow-600' :
                          event.status === 'awaiting_approval' ? 'bg-amber-500/10 text-amber-600' :
                          event.status === 'cancelled' && event.rejectionReason ? 'bg-destructive/10 text-destructive' :
                          'bg-destructive/10 text-destructive'
                        }`}>
                          {event.status === 'published' ? 'Aktywne' :
                           event.status === 'completed' ? 'Zakończone' :
                           event.status === 'draft' ? 'Szkic' :
                           event.status === 'awaiting_approval' ? 'Oczekuje na akceptację' :
                           event.rejectionReason ? 'Odrzucone' : 'Anulowane'}
                        </span>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/organizer/events/${event.id}`}>Zarządzaj</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="mt-0">
            <OrganizerProfileTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default OrganizerDashboard;
