import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockEvents, mockRegistrations } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Users, TrendingUp, Plus, ArrowRight } from 'lucide-react';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const myEvents = mockEvents.filter(e => e.organizerId === user?.id || user?.role === 'admin');
  const totalParticipants = myEvents.reduce((acc, e) => acc + e.distances.reduce((a, d) => a + d.registeredCount, 0), 0);

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

        <div className="grid md:grid-cols-3 gap-4 mb-8">
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
          <CardHeader><CardTitle>Twoje wydarzenia</CardTitle></CardHeader>
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
      </div>
    </Layout>
  );
};

export default OrganizerDashboard;
