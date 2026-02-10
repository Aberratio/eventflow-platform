import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockEvents, mockRegistrations } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Plus, Calendar, MapPin, Users, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

type StatusFilter = 'all' | 'published' | 'draft' | 'completed';

const statusLabels: Record<StatusFilter, string> = {
  all: 'Wszystkie',
  published: 'Aktywne',
  draft: 'Szkice',
  completed: 'Zakończone',
};

const OrganizerEventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const myEvents = mockEvents.filter(e => e.organizerId === user?.id);

  const filteredEvents = myEvents.filter(e => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'completed') return e.status === 'completed';
    if (statusFilter === 'draft') return ['draft', 'awaiting_approval'].includes(e.status);
    return e.status === 'published';
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default">Aktywne</Badge>;
      case 'draft':
        return <Badge variant="secondary">Szkic</Badge>;
      case 'awaiting_approval':
        return <Badge variant="outline">Oczekuje</Badge>;
      case 'completed':
        return <Badge variant="secondary">Zakończone</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Anulowane</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getParticipantCount = (eventId: string) => {
    return mockRegistrations.filter(r => r.eventId === eventId && r.status !== 'cancelled' && r.status !== 'removed').length;
  };

  return (
    <Layout>
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate('/organizer')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Powrót do panelu
        </Button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Moje wydarzenia</h1>
          <Button onClick={() => navigate('/organizer/events/new')}>
            <Plus className="mr-2 h-4 w-4" /> Nowe wydarzenie
          </Button>
        </div>

        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} className="mb-6">
          <TabsList>
            {Object.entries(statusLabels).map(([key, label]) => (
              <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Brak wydarzeń</p>
              <p className="text-sm mt-1">
                {statusFilter === 'all'
                  ? 'Nie masz jeszcze żadnych wydarzeń. Utwórz pierwsze!'
                  : `Brak wydarzeń w kategorii "${statusLabels[statusFilter]}"`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map(event => {
              const participantCount = getParticipantCount(event.id);
              return (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base truncate">{event.name}</h3>
                        {getStatusBadge(event.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground flex-wrap">
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
                      onClick={() => navigate(`/organizer/events/${event.id}`)}
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
